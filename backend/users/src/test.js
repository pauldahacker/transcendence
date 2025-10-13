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
      INSERT OR IGNORE INTO friends (a_friend_id, b_friend_id, created_at, confirmed) VALUES
      (1, 2, datetime('now'), 1);
      `);
});

test('POST `/match` route', async (t) => {
  const { app } = buildFastify(opts = {}, DB_PATH);

  t.after(() => app.close());
  await app.ready();

  await t.test('Add match result with incorrect data', async (t) => {
    const response = await supertest(app.server)
    .post('/match')
    .set('Authorization', `Bearer ${token_1}`)
    .send({ tournament_id: 1, match_id: 5, match_date: '2024-01-01T12:00:00Z', a_participant_id: 1, b_participant_id: 2, a_participant_score: 21 })
    .expect(400)
    .expect('Content-Type', 'application/json; charset=utf-8');
  });

  await t.test('Add match result with valid data', async (t) => {
    
    await t.test('Add match result 1', async (t) => {
      const response = await supertest(app.server)
      .post('/match')
      .set('Authorization', `Bearer ${token_1}`)
      .send({ tournament_id: 1, match_id: 1, match_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: 1, b_participant_id: 2, a_participant_score: 21, b_participant_score: 15, winner_id: 1, loser_id: 2 })
      .expect(201);
    });

    await t.test('Add match result 2', async (t) => {
      const response = await supertest(app.server)
      .post('/match')
      .set('Authorization', `Bearer ${token_1}`)
      .send({ tournament_id: 1, match_id: 2, match_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: 1, b_participant_id: 2, a_participant_score: 18, b_participant_score: 21, winner_id: 2, loser_id: 1 })
      .expect(201);
    });

    await t.test('Add match result 3', async (t) => {
      const response = await supertest(app.server)
      .post('/match')
      .set('Authorization', `Bearer ${token_1}`)
      .send({ tournament_id: 1, match_id: 3, match_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: 1, b_participant_id: 2, a_participant_score: 21, b_participant_score: 19, winner_id: 1, loser_id: 2 })
      .expect(201);
    });

    await t.test('Add match result 4', async (t) => {
      const response = await supertest(app.server)
      .post('/match')
      .set('Authorization', `Bearer ${token_1}`)
      .send({ tournament_id: 1, match_id: 4, match_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: 1, b_participant_id: 2, a_participant_score: 21, b_participant_score: 17, winner_id: 1, loser_id: 2 })
      .expect(201);
    });
  });
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

    t.assert.deepStrictEqual(response.body.match_history.length, 4);

    t.assert.deepStrictEqual(response.body.match_history[0].opponent_username, 'otheruser');
    t.assert.deepStrictEqual(response.body.match_history[0].user_score, 21);
    t.assert.deepStrictEqual(response.body.match_history[0].opponent_score, 17);
    t.assert.deepStrictEqual(response.body.match_history[0].result, 'win');

    t.assert.deepStrictEqual(response.body.match_history[1].opponent_username, 'otheruser');
    t.assert.deepStrictEqual(response.body.match_history[1].user_score, 21);
    t.assert.deepStrictEqual(response.body.match_history[1].opponent_score, 19);
    t.assert.deepStrictEqual(response.body.match_history[1].result, 'win');

    t.assert.deepStrictEqual(response.body.match_history[2].opponent_username, 'otheruser');
    t.assert.deepStrictEqual(response.body.match_history[2].user_score, 18);
    t.assert.deepStrictEqual(response.body.match_history[2].opponent_score, 21);
    t.assert.deepStrictEqual(response.body.match_history[2].result, 'loss');

    t.assert.deepStrictEqual(response.body.match_history[3].opponent_username, 'otheruser');
    t.assert.deepStrictEqual(response.body.match_history[3].user_score, 21);
    t.assert.deepStrictEqual(response.body.match_history[3].opponent_score, 15);
    t.assert.deepStrictEqual(response.body.match_history[3].result, 'win');
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
