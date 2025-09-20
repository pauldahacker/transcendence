/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.e2e.test.js                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/20 00:14:44 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/20 21:48:52 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/**
 * E2E tests for auth/server.js without modifying server.js.
 * Spawns a fresh server process with temp SQLite DB and random port.
 */
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const portfinder = require('portfinder');

jest.setTimeout(30000);

const SERVICE_DIR = path.resolve(__dirname, '..');
let child;
let baseUrl;
let tmpDbPath;

async function waitForHealthz(url, timeoutMs = 10000) {
  const start = Date.now();
  // axios instance with no retries and small timeout
  const http = axios.create({ timeout: 1000, validateStatus: () => true });
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await http.get(url + '/healthz');
      if (r.status === 200 && r.data && r.data.status === 'ok') return;
    } catch (_) { /* ignore until up */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('healthz did not become ready');
}

beforeAll(async () => {
  const port = await portfinder.getPortPromise({ port: 3005 }); // start searching from 3005
  baseUrl = `http://127.0.0.1:${port}`;

  // temp DB file for isolation
  tmpDbPath = path.join(os.tmpdir(), `auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);

  // spawn the service (same server.js you shared)
  child = spawn(process.execPath, ['server.js'], {
    cwd: SERVICE_DIR,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      AUTH_DB_PATH: tmpDbPath,
      AUTH_JWT_SECRET: 'test_secret_please_change',
      AUTH_ACCESS_TTL: '60',    // 1 min access
      AUTH_REFRESH_TTL: '600'   // 10 min refresh
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // optional: pipe logs to jest output for debugging
  child.stdout.on('data', d => process.stdout.write(`[auth] ${d}`));
  child.stderr.on('data', d => process.stdout.write(`[auth-err] ${d}`));

  await waitForHealthz(baseUrl);
});

afterAll(async () => {
  if (child && !child.killed) {
    child.kill('SIGTERM');
  }
  // cleanup temp DB
  if (tmpDbPath && fs.existsSync(tmpDbPath)) {
    try { fs.unlinkSync(tmpDbPath); } catch {}
  }
});

describe('auth service e2e', () => {
  const http = axios.create({
    validateStatus: () => true,
    timeout: 3000
  });

  const email = `test${Date.now()}@a.com`;
  const password = 'SuperSafe123';

  it('healthz responds ok', async () => {
    const res = await http.get(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
  });

  it('signup creates a new user (201) or 409 if duplicate', async () => {
    const r1 = await http.post(`${baseUrl}/signup`, { email, password });
    expect([201, 409]).toContain(r1.status);
    if (r1.status === 201) {
      expect(r1.data).toHaveProperty('id');
      expect(r1.data).toMatchObject({ email });
    }
    const r2 = await http.post(`${baseUrl}/signup`, { email, password });
    expect(r2.status).toBe(409);
    expect(r2.data).toHaveProperty('error', 'email_in_use');
  });

  it('login fails with wrong password', async () => {
    const r = await http.post(`${baseUrl}/login`, { email, password: 'WrongPass123' });
    expect(r.status).toBe(401);
    expect(r.data).toHaveProperty('error', 'invalid_credentials');
  });

  let accessToken, refreshToken;

  it('login returns access & refresh tokens', async () => {
    const r = await http.post(`${baseUrl}/login`, { email, password });
    expect(r.status).toBe(200);
    expect(r.data).toHaveProperty('accessToken');
    expect(r.data).toHaveProperty('refreshToken');
    accessToken = r.data.accessToken;
    refreshToken = r.data.refreshToken;
  });

  it('/me requires bearer token', async () => {
    const r1 = await http.get(`${baseUrl}/me`);
    expect(r1.status).toBe(401);
    expect(r1.data).toHaveProperty('error', 'missing_token');

    const r2 = await http.get(`${baseUrl}/me`, { headers: { authorization: 'Bearer bad.token.here' } });
    expect(r2.status).toBe(401);
    expect(r2.data).toHaveProperty('error', 'invalid_token');
  });

  it('/me works with valid access token', async () => {
    const r = await http.get(`${baseUrl}/me`, { headers: { authorization: `Bearer ${accessToken}` } });
    expect(r.status).toBe(200);
    expect(r.data).toHaveProperty('email', email);
    expect(r.data).toHaveProperty('id');
  });

  it('refresh rotates refresh token (old one becomes invalid)', async () => {
    const r1 = await http.post(`${baseUrl}/refresh`, { refreshToken });
    expect(r1.status).toBe(200);
    expect(r1.data).toHaveProperty('accessToken');
    expect(r1.data).toHaveProperty('refreshToken');

    const oldRefresh = refreshToken;
    refreshToken = r1.data.refreshToken; // rotated

    // old refresh should now be invalid
    const r2 = await http.post(`${baseUrl}/refresh`, { refreshToken: oldRefresh });
    expect(r2.status).toBe(401);
    expect(r2.data).toHaveProperty('error', 'invalid_refresh');
  });

  it('logout revokes all refresh tokens for the user', async () => {
    // call logout with current access token
    const r1 = await http.post(`${baseUrl}/logout`, {}, { headers: { authorization: `Bearer ${accessToken}` } });
    expect(r1.status).toBe(200);
    expect(r1.data).toEqual({ ok: true });

    // any existing refresh token should now be invalid
    const r2 = await http.post(`${baseUrl}/refresh`, { refreshToken });
    expect(r2.status).toBe(401);
    expect(r2.data).toHaveProperty('error', 'invalid_refresh');
  });
});
