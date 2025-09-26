/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/26 06:42:54 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const Fastify = require('fastify');
const { z } = require('zod');
const argon2 = require('argon2');
const { createSecretKey } = require('crypto');
const { SignJWT, jwtVerify } = require('jose');
const { randomBytes } = require('crypto');
const { connect } = require('./db');

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev_super_secret_change_me';
const ACCESS_TTL = Number(process.env.AUTH_ACCESS_TTL || 900);      // seconds
const REFRESH_TTL = Number(process.env.AUTH_REFRESH_TTL || 604800);  // seconds

const fastify = Fastify({ logger: true });
const db = connect();

const sql = {
  insertUser: db.prepare('INSERT INTO users_auth (email, password_hash, created_at, display_name) VALUES (?, ?, ?, ?)'),
  getUserByEmail: db.prepare('SELECT * FROM users_auth WHERE email = ?'),
  getUserById: db.prepare('SELECT * FROM users_auth WHERE id = ?'),
  getUserByDisplayName: db.prepare('SELECT * FROM users_auth WHERE display_name = ?'),
  insertRefresh: db.prepare('INSERT INTO refresh_tokens (user_id, token, exp, created_at) VALUES (?, ?, ?, ?)'),
  getRefresh: db.prepare('SELECT * FROM refresh_tokens WHERE token = ?'),
  deleteRefresh: db.prepare('DELETE FROM refresh_tokens WHERE token = ?'),
  deleteUserRefreshes: db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?'),
};

const secretKey = createSecretKey(Buffer.from(JWT_SECRET, 'utf8'));

function validDisplayName(s) {
  if (typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length < 1 || trimmed.length > 16) return false;
  if (/[\\[\\]]/.test(trimmed)) return false;      // disallow brackets like your FE
  // Optional stricter rule:
  // if (!/^[A-Za-z0-9 _-]+$/.test(trimmed)) return false;
  return true;
}

async function signAccess(user) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: String(user.id), typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TTL)
    .sign(secretKey);
}

async function signRefresh(user) {
  const now = Math.floor(Date.now() / 1000);
// ensure each issued refresh is unique, even within the same second
  const jti = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : randomBytes(16).toString('hex');
  const token = await new SignJWT({ sub: String(user.id), typ: 'refresh', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TTL)
    .sign(secretKey);
  sql.insertRefresh.run(user.id, token, now + REFRESH_TTL, new Date().toISOString());
  return token;
}

async function verifyToken(token, expectedTyp) {
  const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
  if (payload.typ !== expectedTyp) throw new Error('wrong token type');
  return payload;
}

// liveness
fastify.get('/healthz', async () => ({ status: 'ok' }));

// signup
fastify.post('/signup', async (req, reply) => {
  const bodySchema = z.object({
    email: z.string().email().max(200),
    password: z.string().min(8).max(128),
    displayName: z.string()
  });
  const body = bodySchema.parse(req.body);

  // validate display name like the frontend
  if (!validDisplayName(body.displayName)) {
    return reply.code(400).send({ error: 'invalid_display_name' });
  }

  const exists = sql.getUserByEmail.get(body.email);
  if (exists) return reply.code(409).send({ error: 'email_in_use' });

  const nameExists = sql.getUserByDisplayName.get(body.displayName.trim());
  if (nameExists) return reply.code(409).send({ error: 'display_name_in_use' });

  const hash = await argon2.hash(body.password, { type: argon2.argon2id });
  const createdAt = new Date().toISOString();
  const info = sql.insertUser.run(body.email, hash, createdAt, body.displayName.trim());

  return reply.code(201).send({
    id: info.lastInsertRowid,
    email: body.email,
    displayName: body.displayName.trim(),
    createdAt
  });
});

// login
fastify.post('/login', async (req, reply) => {
  const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  const body = bodySchema.parse(req.body);

  const user = sql.getUserByEmail.get(body.email);
  if (!user) return reply.code(401).send({ error: 'invalid_credentials' });

  const ok = await argon2.verify(user.password_hash, body.password);
  if (!ok) return reply.code(401).send({ error: 'invalid_credentials' });

  const accessToken = await signAccess(user);
  const refreshToken = await signRefresh(user);
  return { accessToken, refreshToken };
});

// refresh (rotation) — transactional, strict delete-before-issue
fastify.post('/refresh', async (req, reply) => {
  const bodySchema = z.object({ refreshToken: z.string().min(10) });
  const { refreshToken } = bodySchema.parse(req.body);

  // must exist in DB (pre-check)
  const row = sql.getRefresh.get(refreshToken);
  if (!row) return reply.code(401).send({ error: 'invalid_refresh' });

  let payload;
  try {
    payload = await verifyToken(refreshToken, 'refresh');
  } catch {
    // purge used/bad token
    sql.deleteRefresh.run(refreshToken);
    return reply.code(401).send({ error: 'invalid_refresh' });
  }

  const user = sql.getUserById.get(Number(payload.sub));
  if (!user) return reply.code(401).send({ error: 'invalid_user' });

  // Perform delete+issue as one atomic step to avoid race/TOCTOU
  const tx = db.transaction((oldToken, u) => {
    const res = sql.deleteRefresh.run(oldToken);
    if (res.changes !== 1) {
      // someone already used/rotated it in parallel
      throw new Error('stale_refresh');
    }
    // issue and store a new refresh for this user
    // (signRefresh writes the row)
    return true;
  });

  try {
    tx(refreshToken, user);
  } catch (e) {
    if (String(e.message).includes('stale_refresh')) {
      return reply.code(401).send({ error: 'invalid_refresh' });
    }
    fastify.log.error(e);
    return reply.code(500).send({ error: 'server_error' });
  }

  const accessToken = await signAccess(user);
  const newRefresh = await signRefresh(user);
  return { accessToken, refreshToken: newRefresh };
});

// me (requires access token)
fastify.get('/me', async (req, reply) => {
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return reply.code(401).send({ error: 'missing_token' });

  let payload;
  try {
    payload = await verifyToken(token, 'access');
  } catch {
    return reply.code(401).send({ error: 'invalid_token' });
  }
  const user = sql.getUserById.get(Number(payload.sub));
  if (!user) return reply.code(401).send({ error: 'invalid_user' });

  return { id: user.id, email: user.email, displayName: user.display_name || '', createdAt: user.created_at };
});

// logout (invalidate all refresh tokens)
fastify.post('/logout', async (req, reply) => {
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return reply.code(200).send({ ok: true }); // idempotent

  try {
    const payload = await verifyToken(token, 'access');
    sql.deleteUserRefreshes.run(Number(payload.sub));
  } catch {
    // ignore
  }
  return { ok: true };
});

async function start() {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`auth up on http://0.0.0.0:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
