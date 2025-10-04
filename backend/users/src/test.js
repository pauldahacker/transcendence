const { test } = require('node:test');
const supertest = require('supertest');
const unlink = require('fs').unlink;
const { buildFastify } = require('./app/app');
const { JSONError } = require('./app/schemas');

const DB_PATH = 'test.db';
let token;

unlink(DB_PATH, (err) => {
  if (err && err.code !== 'ENOENT') throw err;
});

test('GET `/` route', async (t) => {
  const app = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
    .get('/')
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');
  t.assert.deepStrictEqual(response.body, { message: 'users' });
});

test('GET `/health` route', async (t) => {
  const app = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();
  
  const response = await supertest(app.server)
  .get('/health')
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');
  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('POST `/register` route', async (t) => {
  const app = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('First registration', async (t) => {
    const response = await supertest(app.server)
    .post('/register')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.ok(response.body.token);
  });

  await t.test('Second registration', async (t) => {
    const response = await supertest(app.server)
    .post('/register')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(409)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, JSONError('Username already exists', 409, 'SQLITE_CONSTRAINT_UNIQUE'));
  });
});


test('POST `/login` route', async (t) => {
  const app = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('Login with correct credentials', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.ok(response.body.token);
    token = response.body.token;
  });

  await t.test('Login with incorrect password', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'myuser', password: 'wrongpass' })
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, JSONError('Password not valid', 401));
  });

  await t.test('Login with non-existent user', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'nouser', password: 'mypass' })
    .expect(404)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, JSONError('User not found', 404));
  });
});

test('POST `/logout` route', async (t) => {
  const app = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('Logout with valid token', async (t) => {
    const response = await supertest(app.server)
    .post('/logout')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, { message: 'Logged out successfully' });
  });

  await t.test('Logout with missing token', async (t) => {
    const response = await supertest(app.server)
    .post('/logout')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, JSONError('Token not valid', 401));
  });

  await t.test('Logout with blacklisted token', async (t) => {
    const response = await supertest(app.server)
    .post('/logout')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, JSONError('Token not valid', 401));
  });
});