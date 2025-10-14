const { test } = require('node:test');
const supertest = require('supertest');
const unlink = require('fs').unlink;
const { buildFastify } = require('./app/app');
const schemas = require('./app/schemas');

const DB_PATH = 'test.db';
let token_1;
let token_2;
let profile;

unlink(DB_PATH, (err) => {
  if (err && err.code !== 'ENOENT') throw err;
});

test('GET `/health` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();
  
  const response = await supertest(app.server)
  .get('/health')
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');
  t.assert.deepStrictEqual(response.body, { status: 'ok' });
});

test('POST `/register` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('First registration', async (t) => {
    const response = await supertest(app.server)
    .post('/register')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(201)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(Object.keys(response.body), schemas.userResponseKeys);
    t.assert.strictEqual(response.body.username, 'myuser');
  });

  await t.test('Second registration', async (t) => {
    const response = await supertest(app.server)
    .post('/register')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(409)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, schemas.JSONError('Username already exists', 409, 'SQLITE_CONSTRAINT_UNIQUE'));
  });
});

test('POST `/login` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('Login without previous registration', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'nouser', password: 'mypass' })
    .expect(404)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
  });

  await t.test('Login with correct credentials', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.ok(response.body.token);
    token_1 = response.body.token;
  });

  await t.test('Login with incorrect password', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'myuser', password: 'wrongpass' })
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, schemas.JSONError('Password not valid', 401, 'Unauthorized'));
  });

  await t.test('Login with non-existent user', async (t) => {
    const response = await supertest(app.server)
    .post('/login')
    .send({ username: 'nouser', password: 'mypass' })
    .expect(404)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
  });
});

test('POST `/logout` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();
  
  await t.test('Logout with missing token', async (t) => {
    const response = await supertest(app.server)
    .post('/logout')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
  });

  await t.test('Logout with valid token', async (t) => {
    const response = await supertest(app.server)
    .post('/logout')
    .set('Authorization', `Bearer ${token_1}`)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, { message: 'Logged out successfully' });
  });

  await t.test('Logout with blacklisted token', async (t) => {
    const response = await supertest(app.server)
    .post('/logout')
    .set('Authorization', `Bearer ${token_1}`)
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
  });
});

test('GET `/:user_id` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();
  
  await t.test('Get profile with missing token', async (t) => {
    const response = await supertest(app.server)
    .get('/1')
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
  });

  await t.test('Get profile with blacklisted token', async (t) => {
    const response = await supertest(app.server)
    .get('/1')
    .set('Authorization', `Bearer ${token_1}`)
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
  });

  await t.test('Get profile with valid token', async (t) => {
    const loginResponse = await supertest(app.server)
    .post('/login')
    .send({ username: 'myuser', password: 'mypass' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.ok(loginResponse.body.token);
    token_1 = loginResponse.body.token;

    const response = await supertest(app.server)
    .get('/1')
    .set('Authorization', `Bearer ${token_1}`)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
    t.assert.strictEqual(response.body.username, 'myuser');
    profile = response.body;
  });

  await t.test('Get non-existent user profile', async (t) => {
    const response = await supertest(app.server)
    .get('/999')
    .set('Authorization', `Bearer ${token_1}`)
    .expect(404)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
  });
});

test('PUT `/:user_id` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();
  
  await t.test('Update profile with missing token', async (t) => {
    const response = await supertest(app.server)
    .put('/1')
    .send({ display_name: 'New Name' })
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
  });

  await t.test('No updates provided', async (t) => {
    const response = await supertest(app.server)
    .put('/1')
    .set('Authorization', `Bearer ${token_1}`)
    .send({ })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, profile);
  });

  await t.test('Update profile with valid token', async (t) => {
    const response = await supertest(app.server)
    .put('/1')
    .set('Authorization', `Bearer ${token_1}`)
    .send({ display_name: 'New Name', bio: 'This is my bio' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
    t.assert.strictEqual(response.body.username, 'myuser');
    t.assert.strictEqual(response.body.display_name, 'New Name');
    t.assert.strictEqual(response.body.bio, 'This is my bio');
    profile = response.body;
  });

  await t.test('Update another user profile', async (t) => {
     const registerResponse = await supertest(app.server)
    .post('/register')
    .send({ username: 'otheruser', password: 'otherpass' })
    .expect(201)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(Object.keys(registerResponse.body), schemas.userResponseKeys);
    t.assert.strictEqual(registerResponse.body.username, 'otheruser');

    const response = await supertest(app.server)
    .put('/2')
    .set('Authorization', `Bearer ${token_1}`)
    .send({ display_name: 'Name' })
    .expect(401)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(response.body, schemas.JSONError('User not authorized', 401, 'Unauthorized'));
  });
});

test('GET `/` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  const response = await supertest(app.server)
  .get('/')
  .set('Authorization', `Bearer ${token_1}`)
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.deepStrictEqual(response.body[0].id, 1);
  t.assert.deepStrictEqual(response.body[0].username, 'myuser');
  t.assert.deepStrictEqual(response.body[1].id, 2);
  t.assert.deepStrictEqual(response.body[1].username, 'otheruser');
});

test('Dump database', async (t) => {
  const { db } = buildFastify(opts = {}, DB_PATH);
    db.exec(`
      INSERT OR IGNORE INTO friends (user1_id, user2_id, created_at, confirmed) VALUES
      (1, 2, datetime('now'), 1);

      INSERT OR IGNORE INTO match_history (user1_id, user2_id, winner_id, user1_wins, user2_wins, match_date) VALUES
      (1, 2, 1, 1, 0, datetime('now')),
      (1, 2, 2, 0, 1, datetime('now')),
      (1, 2, 1, 1, 0, datetime('now')),
      (1, 2, 1, 1, 0, datetime('now'));
    `);
});

test('Check profile updates', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('Get profile with valid token', async (t) => {
    const response = await supertest(app.server)
    .get('/1')
    .set('Authorization', `Bearer ${token_1}`)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
    t.assert.deepStrictEqual(response.body.username, 'myuser');
    t.assert.deepStrictEqual(response.body.display_name, 'New Name');
    t.assert.deepStrictEqual(response.body.bio, 'This is my bio');
    t.assert.deepStrictEqual(response.body.friends, [2]);
    t.assert.deepStrictEqual(response.body.stats.total_matches, 4);
    t.assert.deepStrictEqual(response.body.stats.wins, 3);
    t.assert.deepStrictEqual(response.body.stats.losses, 1);
    profile = response.body;
  });

  await t.test('Get other user profile with valid token', async (t) => {
    const loginResponse = await supertest(app.server)
    .post('/login')
    .send({ username: 'otheruser', password: 'otherpass' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.ok(loginResponse.body.token);
    token_2 = loginResponse.body.token;

    const response = await supertest(app.server)
    .get('/2')
    .set('Authorization', `Bearer ${token_2}`)
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
    t.assert.deepStrictEqual(response.body.username, 'otheruser');
    t.assert.deepStrictEqual(response.body.display_name, null);
    t.assert.deepStrictEqual(response.body.bio, null);
    t.assert.deepStrictEqual(response.body.friends, [1]);
    t.assert.deepStrictEqual(response.body.stats.total_matches, 4);
    t.assert.deepStrictEqual(response.body.stats.wins, 1);
    t.assert.deepStrictEqual(response.body.stats.losses, 3);
  });
});
