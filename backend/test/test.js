const { test } = require('node:test');
const supertest = require('supertest');
const schemas = require('./schemas');

let tokens = {
  admin: null,
  user1: null,
  user2: null,
  user3: null,
};

let ids = {
  user1: null,
  user2: null,
  user3: null,
};

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const server = "https://localhost";

test('`api` tests', async (t) => {
  
  await t.test('GET `/api/health` route', async (t) => {
    const response = await supertest(server)
    .get('/api/health')
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');

    t.assert.deepEqual(response.body, { status: 'ok' });
  });

  await t.test('POST `/api/admin` route', async (t) => {
    
    await t.test('Login as admin with incorrect admin password', async (t) => {
      const response = await supertest(server)
      .post('/api/admin')
      .send({ admin_password: 'wrong-password' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('Admin credentials are invalid', 401, 'Unauthorized'));
    });

    await t.test('Login as admin route with correct admin password', async (t) => {
      const response = await supertest(server)
      .post('/api/admin')
      .send({ admin_password: process.env.ADMIN_PASSWORD })
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(response.body.token);
      tokens.admin = response.body.token;
    });
  });

    await t.test('GET `/api/users/health` route: Admin JWT and API key authorization', async (t) => {

      await t.test('Access without admin token nor internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/users/health')
        .expect(401)
        .expect('Content-Type', 'application/json; charset=utf-8');
      });

      await t.test('Access with admin token', async (t) => {
        const response = await supertest(server)
        .get('/api/users/health')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body, { status: 'ok' });
      });

      await t.test('Access with internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/users/health')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body, { status: 'ok' });
      });

      await t.test('Access with invalid internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/users/health')
        .set('x-internal-api-key', 'invalid-api-key')
        .expect(401)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
      });
    });

    await t.test('GET `/api/tournaments/health` route: Admin JWT and API key authorization', async (t) => {

      await t.test('Access without admin token nor internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/tournaments/health')
        .expect(401)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
      });

      await t.test('Access with admin token', async (t) => {
        const response = await supertest(server)
        .get('/api/tournaments/health')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body, { status: 'ok' });
      });

      await t.test('Access with internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/tournaments/health')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body, { status: 'ok' });
      });

      await t.test('Access with invalid internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/tournaments/health')
        .set('x-internal-api-key', 'invalid-api-key')
        .expect(401)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
      });
    });
});

test('`users` tests', async (t) => {

  await t.test('GET `/api/users/` route', async (t) => {
    
    await t.test('Fetch users without token nor internal API key', async (t) => {
      const response = await supertest(server)
      .get('/api/users/')
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');
    });

    await t.test('Fetch users with internal API key', async (t) => {
      const response = await supertest(server)
      .get('/api/users/')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(Array.isArray(response.body));
    });

    await t.test('Fetch users with admin token', async (t) => {
      const response = await supertest(server)
      .get('/api/users/')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(Array.isArray(response.body));
    });
  });

  await t.test('POST `/api/users/register` route', async (t) => {
    
    await t.test('Register with valid data', async (t) => {
      
      await t.test('First registration', async (t) => {
        const user1Response = await supertest(server)
        .post('/api/users/register')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(201)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.ok(user1Response.body.id);
        ids.user1 = user1Response.body.id;

        const response = await supertest(server)
        .post('/api/users/register')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ username: 'testuser2', password: 'testpassword2' })
        .expect(201)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.ok(response.body.id);
        ids.user2 = response.body.id;
      });

      await t.test('Duplicate registration', async (t) => {
        const response = await supertest(server)
        .post('/api/users/register')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(409)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body, schemas.JSONError('Username already exists', 409, 'SQLITE_CONSTRAINT_UNIQUE'));
      });
    });

    await t.test('POST `/api/users/register` route with invalid username `admin`', async (t) => {
      const response = await supertest(server)
      .post('/api/users/register')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ username: 'admin', password: 'somepassword' })
      .expect(400)
      .expect('Content-Type', 'application/json; charset=utf-8');
    });
  });
  
  await t.test('POST `/api/users/login` route', async (t) => {

    await t.test('Login without previous registration', async (t) => {
      const response = await supertest(server)
      .post('/api/users/login')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ username: 'nouser', password: 'mypass' })
      .expect(404);

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
    });

    await t.test('Login with correct credentials', async (t) => {
      const user1Response = await supertest(server)
      .post('/api/users/login')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ username: 'testuser', password: 'testpassword' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(user1Response.body.token);
      tokens.user1 = user1Response.body.token;

      const user2Response = await supertest(server)
      .post('/api/users/login')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ username: 'testuser2', password: 'testpassword2' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(user2Response.body.token);
      tokens.user2 = user2Response.body.token;
    });

    await t.test('Login with incorrect credentials', async (t) => {
      const response = await supertest(server)
      .post('/api/users/login')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ username: 'testuser', password: 'wrongpass' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('Password not valid', 401, 'Unauthorized'));
    });
  });

  await test('POST `/api/users/logout` route', async (t) => {

    await t.test('Logout with missing token', async (t) => {
      const response = await supertest(server)
      .post('/api/users/logout')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Logout with valid token', async (t) => {
      const response = await supertest(server)
      .post('/api/users/logout')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, { message: 'Logged out successfully' });
    });

    await t.test('Logout with blacklisted token', async (t) => {
      const response = await supertest(server)
      .post('/api/users/logout')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });
  });

  await t.test('GET `/api/users/:user_id` route', async (t) => {

    await t.test('Get profile without token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Get profile with blacklisted token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Get profile with valid token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user2}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseSchema.required);
      t.assert.strictEqual(response.body.username, 'testuser2');
      profile = response.body;
    });

    await t.test('Get profile with admin token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseSchema.required);
      t.assert.strictEqual(response.body.username, 'testuser');
    });

    await t.test('Get profile as a different user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseSchema.required);
      t.assert.strictEqual(response.body.username, 'testuser');
    });

    await t.test('Get profile of non-existing user', async (t) => {
      const response = await supertest(server)
      .get('/api/users/9999')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(404)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
    });
  });

  await t.test('PUT `/api/users/:user_id` route', async (t) => {
    
    await t.test('Update profile without token', async (t) => {
      const response = await supertest(server)
      .put(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ display_name: 'New Name' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Update profile with blacklisted token', async (t) => {
      const response = await supertest(server)
      .put(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .send({ display_name: 'New Name' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Update profile while logged in as different user', async (t) => {
      const response = await supertest(server)
      .put(`/api/users/${ids.user1}`)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .send({ display_name: 'New Name' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not authorized', 401, 'Unauthorized'));
    });

    await t.test('Update profile while logged in as admin', async (t) => {
      const response = await supertest(server)
      .put(`/api/users/${ids.user1}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ display_name: 'Admin Changed Name' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseSchema.required);
      t.assert.strictEqual(response.body.display_name, 'Admin Changed Name');
    });

    await t.test('Update profile while logged in as the same user', async (t) => {
      const response = await supertest(server)
      .put(`/api/users/${ids.user2}`)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .send({ display_name: 'New Name' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseSchema.required);
      t.assert.strictEqual(response.body.display_name, 'New Name');
      profile = response.body;
    });

    await t.test('Update profile with empty body', async (t) => {
      const response = await supertest(server)
      .put(`/api/users/${ids.user2}`)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .send({ })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, profile);
    });
  });

  await t.test('POST `/api/users/match` route', async (t) => {

    await t.test('Add match result without internal API key nor admin token', async (t) => {
      const response = await supertest(server)
      .post('/api/users/match')
      .send({ tournament_id: 1, match_id: 5, match_date: '2024-01-01T12:00:00Z', a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 21, b_participant_score: 15, winner_id: ids.user1, loser_id: ids.user2 })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');
    });

    await t.test('Add match result with invalid internal API key', async (t) => {
      const response = await supertest(server)
      .post('/api/users/match')
      .set('x-internal-api-key', 'invalid-api-key')
      .send({ tournament_id: 1, match_id: 5, match_date: '2024-01-01T12:00:00Z', a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 21, b_participant_score: 15, winner_id: ids.user1, loser_id: ids.user2 })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Add match result with missing data', async (t) => {
      const response = await supertest(server)
      .post('/api/users/match')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ match_id: 5, match_date: '2024-01-01T12:00:00Z', a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 21, b_participant_score: 15, winner_id: ids.user1, loser_id: ids.user2 })
      .expect(400)
      .expect('Content-Type', 'application/json; charset=utf-8');
    });

    await t.test('Add match result with valid data', async (t) => {
      
      await t.test('Add match result 1', async (t) => {
        const response = await supertest(server)
        .post('/api/users/match')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ tournament_id: 1, match_id: 1, match_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 21, b_participant_score: 15, winner_id: ids.user1, loser_id: ids.user2 })
        .expect(201);
      });

      await t.test('Add match result 2', async (t) => {
        const response = await supertest(server)
        .post('/api/users/match')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ tournament_id: 1, match_id: 2, match_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 18, b_participant_score: 21, winner_id: ids.user2, loser_id: ids.user1 })
        .expect(201);
      });

      await t.test('Add match result 3', async (t) => {
        const response = await supertest(server)
        .post('/api/users/match')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ tournament_id: 1, match_id: 3, match_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 21, b_participant_score: 19, winner_id: ids.user1, loser_id: ids.user2 })
        .expect(201);
      });

      await t.test('Add match result 4', async (t) => {
        const response = await supertest(server)
        .post('/api/users/match')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ tournament_id: 1, match_id: 4, match_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), a_participant_id: ids.user1, b_participant_id: ids.user2, a_participant_score: 21, b_participant_score: 17, winner_id: ids.user1, loser_id: ids.user2 })
        .expect(201);
      });
    });
  });

  await t.test('GET `/api/users/:user_id/stats` route', async (t) => {
    await t.test('Get stats without token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/stats`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Get stats with blacklisted token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/stats`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Get stats with valid token as different user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/stats`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.statsResponseSchema.required);
      t.assert.strictEqual(response.body.total_matches, 4);
      t.assert.strictEqual(response.body.wins, 3);
      t.assert.strictEqual(response.body.losses, 1);
    });

    await t.test('Get stats with valid token as the same user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user2}/stats`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.statsResponseSchema.required);
      t.assert.strictEqual(response.body.total_matches, 4);
      t.assert.strictEqual(response.body.wins, 1);
      t.assert.strictEqual(response.body.losses, 3);
    });
  });

  await t.test('POST `/api/users/:user_id/friend-request` route', async (t) => {

    // Create a third user
    await supertest(server)
    .post(`/api/users/register`)
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .send({ username: 'testuser3', password: 'testpassword3' })
    .expect(201)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .then((res) => {
      ids.user3 = res.body.id;
    });

    await supertest(server)
    .post(`/api/users/login`)
    .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
    .send({ username: 'testuser3', password: 'testpassword3' })
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .then((res) => {
      tokens.user3 = res.body.token;
    });

    await t.test('Send friend request without token', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/${ids.user1}/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Send friend request with blacklisted token', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/${ids.user1}/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Send friend request to oneself', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/${ids.user3}/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user3}`)
      .expect(400)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('Cannot send friend request to oneself', 400));
    });

    await t.test('Send valid friend request', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/${ids.user3}/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, { message: 'Friend request sent' });
    });

    await t.test('Send duplicate friend request with valid token', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/${ids.user3}/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(409)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('Friend request already sent', 409));
    });

    await t.test('Send friend request with invalid user ID', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/invalid_id/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user3}`)
      .expect(404)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
    });

    await t.test('Accept friend request with valid token', async (t) => {
      const response = await supertest(server)
      .post(`/api/users/${ids.user2}/friend-request`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user3}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, { message: 'Friend request accepted' });
    });
  });

  await t.test('GET `/api/users/:user_id/friends` route', async (t) => {

    await t.test('Get user friends without token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/friends`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Get user friends with blacklisted token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/friends`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Get user friends with valid token as different user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user2}/friends`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user3}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body[0]), schemas.friendsResponseSchema.items.required);
      t.assert.strictEqual(response.body.length, 1);
      t.assert.strictEqual(response.body[0].id, ids.user3);
      t.assert.strictEqual(response.body[0].username, 'testuser3');
      t.assert.strictEqual(response.body[0].display_name, null);
      t.assert.strictEqual(response.body[0].avatar_url, "https://avatar.iran.liara.run/public");
      t.assert.strictEqual(response.body[0].confirmed, 1);
    });

    await t.test('Get user friends with valid token as the same user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user3}/friends`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user3}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body[0]), schemas.friendsResponseSchema.items.required);
      t.assert.strictEqual(response.body.length, 1);
      t.assert.strictEqual(response.body[0].id, ids.user2);
      t.assert.strictEqual(response.body[0].username, 'testuser2');
      t.assert.strictEqual(response.body[0].display_name, 'New Name');
      t.assert.strictEqual(response.body[0].avatar_url, "https://avatar.iran.liara.run/public");
      t.assert.strictEqual(response.body[0].confirmed, 1);
    });

    await t.test('Get non-existent user friends with valid token', async (t) => {
      const response = await supertest(server)
      .get('/api/users/9999/friends')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(404)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
    });
  });

  await t.test('GET `/:user_id/friends` route with /?filter=` query', async (t) => {

    await t.test('Get user friends with `?filter=confirmed`', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user2}/friends?filter=confirmed`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user3}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body[0]), schemas.friendsResponseSchema.items.required);
      t.assert.strictEqual(response.body.length, 1);
      t.assert.strictEqual(response.body[0].id, ids.user3);
      t.assert.strictEqual(response.body[0].username, 'testuser3');
      t.assert.strictEqual(response.body[0].display_name, null);
      t.assert.strictEqual(response.body[0].avatar_url, "https://avatar.iran.liara.run/public");
      t.assert.strictEqual(response.body[0].confirmed, 1);
    });

    await t.test('Get user friends with `?filter=pending`', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/friends?filter=pending`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.strictEqual(response.body.length, 0);
    });

    await t.test('Get user friends with `?filter=requested`', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/friends?filter=requested`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.strictEqual(response.body.length, 0);
    });

    await t.test('Get user friends with invalid `?filter=` value', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/friends?filter=invalid`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(400)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('Invalid filter value', 400));
    });
  });

  await t.test('GET `/:user_id/match_history` route', async (t) => {

    await t.test('Get match history without token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/match_history`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Get match history with blacklisted token', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/match_history`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Get match history with valid token as different user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user1}/match_history`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(Array.isArray(response.body));
      t.assert.deepStrictEqual(Object.keys(response.body[0]), schemas.matchHistoryResponseSchema.items.required);
      t.assert.strictEqual(response.body.length, 4);
    });

    await t.test('Get match history with valid token as the same user', async (t) => {
      const response = await supertest(server)
      .get(`/api/users/${ids.user2}/match_history`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(Array.isArray(response.body));
      t.assert.deepStrictEqual(Object.keys(response.body[0]), schemas.matchHistoryResponseSchema.items.required);
      t.assert.strictEqual(response.body.length, 4);
    });
  });

  await t.test('DELETE `/api/users/:user_id` route', async (t) => {

    await t.test('Delete without user ownership token', async (t) => { 
      const response = await supertest(server)
      .delete(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');
    });

    await t.test('Delete route while logged in as different user', async (t) => {
      const response = await supertest(server)
      .delete(`/api/users/${ids.user1}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not authorized', 401, 'Unauthorized'));
    });

    await t.test('Delete while logged in as the same user', async (t) => {

      const response = await supertest(server)
      .delete(`/api/users/${ids.user2}`)
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, { message: 'User deleted' });
    });

    await t.test('Delete while logged in as admin', async (t) => {

      const user1response = await supertest(server)
      .delete(`/api/users/${ids.user1}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(user1response.body, { message: 'User deleted' });

      const user3response = await supertest(server)
      .delete(`/api/users/${ids.user3}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(user3response.body, { message: 'User deleted' });
    });
  });
});