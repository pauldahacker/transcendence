/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/27 08:19:03 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const Fastify = require('fastify');
const { z } = require('zod');
const { connect } = require('./db');
const { request } = require('undici');

const PORT = Number(process.env.PORT || 3002);
const AUTH_INTERNAL_URL = process.env.AUTH_INTERNAL_URL || 'http://auth:3001';

const fastify = Fastify({ logger: true });
const db = connect();

const sql = {
  insertTournament: db.prepare(`INSERT INTO tournament (owner_user_id, mode, points_to_win, status, created_at) VALUES (?, ?, ?, 'pending', ?)`),
  getTournament: db.prepare(`SELECT * FROM tournament WHERE id = ?`),

  insertParticipant: db.prepare(`INSERT INTO tournament_participant (tournament_id, user_id, display_name, is_bot) VALUES (?, ?, ?, ?)`),
  listParticipants: db.prepare(`SELECT * FROM tournament_participant WHERE tournament_id = ? ORDER BY id ASC`),

  insertMatch: db.prepare(`INSERT INTO match (tournament_id, a_participant_id, b_participant_id, round, order_index, status) VALUES (?, ?, ?, ?, ?, 'pending')`),
  listMatches: db.prepare(`SELECT * FROM match WHERE tournament_id = ? ORDER BY round ASC, order_index ASC`)
};

// ----- helpers -----

function isBotAlias(name) {
  const s = String(name || '').trim();
  // Accept “[AI] 1”, “AI 1”, “ai2”, etc.
  return /^\[?\s*ai\s*\]?(\s+\d+)?$/i.test(s);
}

function bearerUserId(req) {
  // In v1 we trust the gateway to have validated JWT if you add a guard later.
  // For now, decode from 'sub' if you decide to pass userId via header (simple approach):
  // Better: have gateway inject X-User-Id after verifying token; but to keep scope tight,
  // accept an optional header for owner in v1.
  const hdr = req.headers['x-user-id'];
  if (hdr) return Number(hdr);
  // fallback: not ideal; for now, reject if not provided
  return null;
}

async function lookupUserIdByDisplayName(displayName) {
  const url = `${AUTH_INTERNAL_URL}/public/by-display-name?name=${encodeURIComponent(displayName)}`;
  const res = await request(url, { method: 'GET' });
  if (res.statusCode === 200) {
    const data = await res.body.json();
    return data.id;
  }
  return null; // not found -> treat as bot or guest
}

function validateAliases(aliases) {
  const trimmed = aliases.map(a => (a || '').trim());
  if (trimmed.length < 2 || trimmed.length % 2 !== 0) {
    return { ok: false, message: 'Number of players must be even and at least 2.' };
  }
  // frontend rule: forbid [] and >16 chars
  for (const a of trimmed) {
    if (/\[|\]/.test(a)) return { ok: false, message: 'No brackets [] allowed.' };
    if (a.length > 16) return { ok: false, message: 'Player names cannot exceed 16 characters.' };
  }
  const unique = new Set(trimmed);
  if (unique.size !== trimmed.length) return { ok: false, message: 'Player names must be unique.' };
  return { ok: true, aliases: trimmed };
}

// ----- routes -----

fastify.get('/healthz', async () => ({ status: 'ok' }));

// POST /tournaments  -> create + bracket v1
fastify.post('/', async (req, reply) => {
  const bodySchema = z.object({
    players: z.array(z.object({ alias: z.string() })).min(2),
    mode: z.enum(['1v1']).default('1v1'),
    pointsToWin: z.number().int().min(1).max(21).default(5)
  });
  const body = bodySchema.parse(req.body);

  const ownerId = bearerUserId(req);
  if (!ownerId) return reply.code(401).send({ error: 'unauthorized' });

  // apply frontend’s empty→AI rule here too, so backend is the source of truth
  let botCounter = 1;
  const rawAliases = body.players.map(p => (p.alias || '').trim());
  const filled = rawAliases.map(a => (a === '' ? `[AI] ${botCounter++}` : a));

  const v = validateAliases(filled);
  if (!v.ok) return reply.code(400).send({ error: v.message });
  const aliases = v.aliases;

  // shuffle like FE does (or accept order; here we shuffle)
  const shuffled = [...aliases].sort(() => Math.random() - 0.5);

  const now = new Date().toISOString();

  const createTx = db.transaction(() => {
  const tRes = sql.insertTournament.run(ownerId, body.mode, body.pointsToWin, now);
  const tid = tRes.lastInsertRowid;

  const partIds = []; // { id, name, isBot, userId }
  // Insert participants with user_id null for now
  for (const name of shuffled) {
    const isBot = isBotAlias(name);
    const r = sql.insertParticipant.run(tid, null, name, isBot ? 1 : 0);
    partIds.push({ id: r.lastInsertRowid, name, isBot, userId: null });
  }

  // Create first-round matches (pairs)
  for (let i = 0; i < partIds.length; i += 2) {
    const a = partIds[i].id, b = partIds[i + 1].id;
    sql.insertMatch.run(tid, a, b, 1, (i / 2) + 1);
  }

  return { tid, partIds };
});

const { tid, partIds } = createTx();  // <-- call the transaction

  // resolve in series (N is small)
  for (const p of partIds) {
    if (!p.isBot) {
      try {
        const id = await lookupUserIdByDisplayName(p.name);
        if (id) {
          db.prepare(`UPDATE tournament_participant SET user_id = ? WHERE id = ?`).run(id, p.id);
        }
      } catch {
        // ignore lookup failures; participant remains guest/bot by displayName only
      }
    }
  }

  const participants = sql.listParticipants.all(tid);
  const matches = sql.listMatches.all(tid);

  // shape response for FE
  const resp = {
    tournamentId: tid,
    participants: participants.map(p => ({
      id: `tp_${p.id}`,
      displayName: p.display_name,
      userId: p.user_id ?? null,
      isBot: !!p.is_bot
    })),
    matches: matches.map(m => ({
      id: `m_${m.id}`,
      a: `tp_${m.a_participant_id}`,
      b: `tp_${m.b_participant_id}`,
      round: m.round,
      order: m.order_index
    }))
  };

  return reply.code(201).send(resp);
});

// GET /tournaments/:id  -> current bracket
fastify.get('/:id', async (req, reply) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return reply.code(400).send({ error: 'bad_id' });

  const t = sql.getTournament.get(id);
  if (!t) return reply.code(404).send({ error: 'not_found' });

  const participants = sql.listParticipants.all(id);
  const matches = sql.listMatches.all(id);

  return {
    tournamentId: id,
    status: t.status,
    mode: t.mode,
    pointsToWin: t.points_to_win,
    participants: participants.map(p => ({
      id: `tp_${p.id}`,
      displayName: p.display_name,
      userId: p.user_id ?? null,
      isBot: !!p.is_bot
    })),
    matches: matches.map(m => ({
      id: `m_${m.id}`,
      a: `tp_${m.a_participant_id}`,
      b: `tp_${m.b_participant_id}`,
      round: m.round,
      order: m.order_index,
      status: m.status,
      scoreA: m.score_a,
      scoreB: m.score_b,
      winner: m.winner_participant_id ? `tp_${m.winner_participant_id}` : null
    }))
  };
});

async function start() {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`tournaments up on http://0.0.0.0:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
