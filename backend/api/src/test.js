const { test } = require('node:test');
const supertest = require('supertest');
const buildFastify = require('./app/app');
const schemas = require('./app/schemas');

let token;

function debug(response_body) {
  console.log(response_body);
  process.exit(1);
}

test('GET `/health` route', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();
  
  const response = await supertest(app.server)
  .get('/health')
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('POST `/admin` route with incorrect admin password', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/admin')
  .send({ admin_password: 'wrong-password' })
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, schemas.JSONError('Admin credentials are invalid', 401, 'Unauthorized'));
});

test('POST `/admin` route with correct admin password', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/admin')
  .send({ admin_password: process.env.ADMIN_PASSWORD })
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(response.body.token);
  token = response.body.token;
});

test('GET `/users/health` route without token nor internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/users/health')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/users/health` route with token', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/users/health')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/tournaments/health` route without token nor internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/tournaments/health')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/tournaments/health` route with token', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/tournaments/health')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/tournaments/health` route with internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/tournaments/health')
  .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/users/health` route with internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/users/health')
  .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/users/health` route with invalid internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/users/health')
  .set('x-internal-api-key', 'invalid-api-key')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
});

test('GET `/tournaments/health` route with invalid internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/tournaments/health')
  .set('x-internal-api-key', 'invalid-api-key')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
});

test('GET `/users/` route with token to fetch all users', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/users/')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(Array.isArray(response.body));
});

test('GET `/blockchain/health` without auth -> 401', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  await supertest(app.server)
    .get('/blockchain/health')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/blockchain/health` with internal API key -> 200', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  const res = await supertest(app.server)
    .get('/blockchain/health')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(res.body, { status: 'ok' });
});

// --- Blockchain ABI proxy auth tests ---
test('GET `/blockchain/abi/TournamentRegistry` without auth -> 401', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  await supertest(app.server)
    .get('/blockchain/abi/TournamentRegistry')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/blockchain/abi/TournamentRegistry` with internal API key -> 200', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  const res = await supertest(app.server)
    .get('/blockchain/abi/TournamentRegistry')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

  // ABI is an array (validated at the blockchain service level)
  t.assert.ok(Array.isArray(res.body));
  t.assert.ok(res.body.length >= 0);
});

// --- Blockchain finals proxy auth tests ---
test('POST `/blockchain/finals` without auth -> 401', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  await supertest(app.server)
    .post('/blockchain/finals')
    .send({ tournament_id: 123, winner_alias: 'alice', score_a: 3, score_b: 1, points_to_win: 3 })
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');
});

test('POST `/blockchain/finals` with internal API key -> 201 { txHash }', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  const res = await supertest(app.server)
    .post('/blockchain/finals')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .send({ tournament_id: 456, winner_alias: 'bob', score_a: 3, score_b: 2, points_to_win: 3 })
    .expect(201)
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(res.body && typeof res.body.txHash === 'string');
});

// --- Blockchain finals READ proxy auth tests ---
test('GET `/blockchain/finals/:id` without auth -> 401', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  await supertest(app.server)
    .get('/blockchain/finals/999')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/blockchain/finals/:id` with internal API key -> 200 (after seed POST)', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  // Seed a result via POST through the gateway (uses internal key)
  const seedId = 777;
  await supertest(app.server)
    .post('/blockchain/finals')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .send({ tournament_id: seedId, winner_alias: 'seeded', score_a: 3, score_b: 1, points_to_win: 3 })
    .expect(201)
    .expect('Content-Type', 'application/json; charset=utf-8');

  // Now read it back via GET with the internal key
  const res = await supertest(app.server)
    .get(`/blockchain/finals/${seedId}`)
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.strictEqual(res.body.exists, true);
  t.assert.strictEqual(res.body.winner_alias, 'seeded');
  t.assert.strictEqual(res.body.score_a, 3);
  t.assert.strictEqual(res.body.score_b, 1);
  t.assert.strictEqual(res.body.points_to_win, 3);
});

// --- Blockchain config proxy auth tests ---
test('GET `/blockchain/config` without auth -> 401', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  await supertest(app.server)
    .get('/blockchain/config')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/blockchain/config` with internal API key -> 200 + fields', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  const res = await supertest(app.server)
    .get('/blockchain/config')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(Object.prototype.hasOwnProperty.call(res.body, 'enabled'), 'missing enabled');
  t.assert.ok(Object.prototype.hasOwnProperty.call(res.body, 'network'), 'missing network');
  t.assert.ok(Object.prototype.hasOwnProperty.call(res.body, 'registryAddress'), 'missing registryAddress');
});

// --- Blockchain finals duplicate guard via proxy ---
test('POST `/blockchain/finals` twice -> 201 then 409 (idempotent)', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  const tid = 13579;

  // First call -> 201
  const first = await supertest(app.server)
    .post('/blockchain/finals')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .send({ tournament_id: tid, winner_alias: 'dup', score_a: 3, score_b: 1, points_to_win: 3 })
    .expect(201)
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(first.body && typeof first.body.txHash === 'string', 'expected txHash string');

  // Second call with same id -> 409
  const second = await supertest(app.server)
    .post('/blockchain/finals')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .send({ tournament_id: tid, winner_alias: 'dup', score_a: 3, score_b: 1, points_to_win: 3 })
    .expect(409)
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.equal(second.body && second.body.error, 'already_recorded', 'expected already_recorded error');
});

test('Rate limit: multiple hits to `/blockchain/health` -> 200 then 429 (or 403)', async (t) => {
  const app = buildFastify(opts = {});
  t.after(() => app.close());
  await app.ready();

  // hit below the threshold first
  for (let i = 0; i < 30; i++) {
    await supertest(app.server)
      .get('/blockchain/health')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(200);
  }

  // the next immediate hit should be limited
  const res = await supertest(app.server)
    .get('/blockchain/health')
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY);

  // Accept either 429 (rate limit) or 403 (auth short-circuit after limit)
  t.assert.ok([429, 403].includes(res.statusCode), `expected 429/403, got ${res.statusCode}`);

  const bodyText = typeof res.text === 'string' ? res.text : '';
  const looksLimited =
    /Too Many Requests/i.test(bodyText) ||
    res.body?.code === 'FST_ERR_RATE_LIMIT' ||
    /rate[- ]?limit/i.test(bodyText) ||
    res.headers['x-ratelimit-limit'] !== undefined;

  t.assert.ok(looksLimited, 'expected rate-limit style response or headers');
});

// test('OPTIONS preflight -> 204 (no auth)', async (t) => {
//   const app = buildFastify(opts = {});
//   t.after(() => app.close());
//   await app.ready();

//   await supertest(app.server)
//     .options('/users/health')
//     .expect(204);
// });
