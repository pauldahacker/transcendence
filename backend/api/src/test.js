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