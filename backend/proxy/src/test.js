const { test } = require('node:test');
const supertest = require('supertest');
const buildFastify = require('./app/app');
const schemas = require('./app/schemas');

// Proxy tests

test('GET `/health` route', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/health')
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepEqual(response.body, { status: 'ok' });
});

test('GET `/` route', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/')
  .expect(200)
  .expect('Content-Type', 'text/html');
});

// API tests

test('GET `/api/health` route', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/health')
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepEqual(response.body, { status: 'ok' });
});

test('POST `/api/admin` route with incorrect admin password', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/api/admin')
  .send({ admin_password: 'wrong-password' })
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, schemas.JSONError('Admin credentials are invalid', 401));
});

test('POST `/api/admin` route with correct admin password', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/api/admin')
  .send({ admin_password: process.env.ADMIN_PASSWORD })
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(response.body.token);
  token = response.body.token;
});

test('GET `/api/users/health` route without token nor internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/users/health')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/api/users/health` route with token', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/users/health')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/api/tournaments/health` route without token nor internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/tournaments/health')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');
});

test('GET `/api/tournaments/health` route with token', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/tournaments/health')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/api/tournaments/health` route with internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/tournaments/health')
  .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/api/users/health` route with internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/users/health')
  .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('GET `/api/users/health` route with invalid internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/users/health')
  .set('x-internal-api-key', 'invalid-api-key')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, schemas.JSONError('Invalid API Key', 401));
});

test('GET `/api/tournaments/health` route with invalid internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/tournaments/health')
  .set('x-internal-api-key', 'invalid-api-key')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body, schemas.JSONError('Invalid API Key', 401));
});

// Users tests

test('GET `/api/users/` route without token nor internal API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/users/')
  .expect(401)
  .expect('Content-Type', 'application/json; charset=utf-8');
});

test('POST `/api/users/register` route with valid token', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/api/users/register')
  .set('Authorization', `Bearer ${token}`)
  .send({ username: 'testuser', password: 'testpassword' })
  .expect(201)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(response.body.id);
});

test('POST `/api/users/register` route with valid API key', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/api/users/register')
  .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  .send({ username: 'testuser2', password: 'testpassword2' })
  .expect(201)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(response.body.id);
});

test('GET `/api/users/` route with token to fetch users', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/api/users/')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(Array.isArray(response.body));
  t.assert.ok(response.body.length === 2);
});

test('POST `/api/users/login` route with correct username and password', async (t) => {
  const app = buildFastify(opts = {});

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .post('/api/users/login')
  .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  .send({ username: 'testuser', password: 'testpassword' })
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.ok(response.body.token);
});