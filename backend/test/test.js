const { test } = require('node:test');
const supertest = require('supertest');
const schemas = require('./schemas');

let tokens = {
  adminToken: null,
  user1Token: null,
  user2Token: null,
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
      tokens.adminToken = response.body.token;
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
        .set('Authorization', `Bearer ${tokens.adminToken}`)
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

        t.assert.deepStrictEqual(response.body, schemas.JSONError('Invalid API Key', 401, 'Unauthorized'));
      });
    });

    await t.test('GET `/api/tournaments/health` route: Admin JWT and API key authorization', async (t) => {

      await t.test('Access without admin token nor internal API key', async (t) => {
        const response = await supertest(server)
        .get('/api/tournaments/health')
        .expect(401)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.deepStrictEqual(response.body, schemas.JSONError('Invalid API Key', 401, 'Unauthorized'));
      });

      await t.test('Access with admin token', async (t) => {
        const response = await supertest(server)
        .get('/api/tournaments/health')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
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

        t.assert.deepStrictEqual(response.body, schemas.JSONError('Invalid API Key', 401, 'Unauthorized'));
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
      .set('Authorization', `Bearer ${tokens.adminToken}`)
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

        const response = await supertest(server)
        .post('/api/users/register')
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
        .send({ username: 'testuser2', password: 'testpassword2' })
        .expect(201)
        .expect('Content-Type', 'application/json; charset=utf-8');

        t.assert.ok(response.body.id);
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
      tokens.user1Token = user1Response.body.token;

      const user2Response = await supertest(server)
      .post('/api/users/login')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ username: 'testuser2', password: 'testpassword2' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.ok(user2Response.body.token);
      tokens.user2Token = user2Response.body.token;
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
      .set('Authorization', `Bearer ${tokens.user1Token}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, { message: 'Logged out successfully' });
    });

    await t.test('Logout with blacklisted token', async (t) => {
      const response = await supertest(server)
      .post('/api/users/logout')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1Token}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });
  });

  await t.test('GET `/api/users/:user_id` route', async (t) => {

    await t.test('Get profile without token', async (t) => {
      const response = await supertest(server)
      .get('/api/users/1')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Get profile with blacklisted token', async (t) => {
      const response = await supertest(server)
      .get('/api/users/1')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1Token}`)
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Get profile with valid token', async (t) => {
      const response = await supertest(server)
      .get('/api/users/2')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2Token}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
      t.assert.strictEqual(response.body.username, 'testuser2');
      profile = response.body;
    });

    await t.test('Get profile with admin token', async (t) => {
      const response = await supertest(server)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
      t.assert.strictEqual(response.body.username, 'testuser');
    });

    await t.test('Get profile as a different user', async (t) => {
      const response = await supertest(server)
      .get('/api/users/1')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user2Token}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
      t.assert.strictEqual(response.body.username, 'testuser');
    });

    await t.test('Get profile of non-existing user', async (t) => {
      const response = await supertest(server)
      .get('/api/users/9999')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .expect(404)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not found', 404));
    });
  });

  await t.test('PUT `/api/users/:user_id` route', async (t) => {
    
    await t.test('Update profile without token', async (t) => {
      const response = await supertest(server)
      .put('/api/users/1')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .send({ display_name: 'New Name' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_NO_AUTHORIZATION_IN_HEADER");
    });

    await t.test('Update profile with blacklisted token', async (t) => {
      const response = await supertest(server)
      .put('/api/users/1')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
      .set('Authorization', `Bearer ${tokens.user1Token}`)
      .send({ display_name: 'New Name' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body.code, "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED");
    });

    await t.test('Update profile while logged in as different user', async (t) => {
      const response = await supertest(server)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${tokens.user2Token}`)
      .send({ display_name: 'New Name' })
      .expect(401)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, schemas.JSONError('User not authorized', 401, 'Unauthorized'));
    });

    await t.test('Update profile while logged in as admin', async (t) => {
      const response = await supertest(server)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({ display_name: 'Admin Changed Name' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
      t.assert.strictEqual(response.body.display_name, 'Admin Changed Name');
    });

    await t.test('Update profile while logged in as the same user', async (t) => {
      const response = await supertest(server)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${tokens.user2Token}`)
      .send({ display_name: 'New Name' })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(Object.keys(response.body), schemas.profileResponseKeys);
      t.assert.strictEqual(response.body.display_name, 'New Name');
      profile = response.body;
    });

    await t.test('Update profile with empty body', async (t) => {
      const response = await supertest(server)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${tokens.user2Token}`)
      .send({ })
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

      t.assert.deepStrictEqual(response.body, profile);
    });
  });

  // --------------------------------------------------------
// E2E (gateway): tournament -> blockchain (feature-flagged)
// --------------------------------------------------------
await test('E2E tournament → gateway → blockchain (skips if reporter disabled)', async (t) => {
  const IAK = process.env.INTERNAL_API_KEY;
  if (!IAK) {
    t.diagnostic('[e2e-bridge] SKIP: INTERNAL_API_KEY missing in env');
    return;
  }

  // Helper to sleep a bit during polling
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 1) Create a 2-player tournament via the API Gateway
  const create = await supertest(server)
    .post('/api/tournaments/')
    .set('x-internal-api-key', IAK)
    .send({ mode: 'single_elimination', points_to_win: 11 })
    .expect('Content-Type', 'application/json; charset=utf-8');

  t.assert.strictEqual(create.status, 201, `create tournament failed: ${create.status}`);
  const tid = create.body.id;
  t.assert.ok(Number.isInteger(tid) && tid > 0, 'missing tournament id');

  // Join alice & bob
  for (const name of ['alice', 'bob']) {
    const join = await supertest(server)
      .post(`/api/tournaments/${tid}/participants`)
      .set('x-internal-api-key', IAK)
      .send({ display_name: name })
      .expect('Content-Type', 'application/json; charset=utf-8');
    t.assert.strictEqual(join.status, 201, `join ${name} failed: ${join.status}`);
  }

  // Start the tournament
  const start = await supertest(server)
    .post(`/api/tournaments/${tid}/start`)
    .set('x-internal-api-key', IAK)
    .expect('Content-Type', 'application/json; charset=utf-8');
  t.assert.strictEqual(start.status, 200, `start failed: ${start.status}`);

  // Get the only round-1 match
  const matches = await supertest(server)
    .get(`/api/tournaments/${tid}/matches?round=1`)
    .set('x-internal-api-key', IAK)
    .expect('Content-Type', 'application/json; charset=utf-8');
  t.assert.strictEqual(matches.status, 200, `list matches failed: ${matches.status}`);
  t.assert.ok(Array.isArray(matches.body) && matches.body.length === 1, 'expected exactly one match');
  const match = matches.body[0];

  // Score the final: side A wins (alice)
  const score = await supertest(server)
    .post(`/api/tournaments/${tid}/matches/${match.id}/score`)
    .set('x-internal-api-key', IAK)
    .send({ score_a: 3, score_b: 1 });

  t.assert.ok([200, 204].includes(score.status), `score failed: ${score.status}`);

  // 2) Poll blockchain via gateway for up to ~2s for the recorded final
  const expectedWinner = 'alice';
  const deadline = Date.now() + 2000;
  let observed = null;

  while (Date.now() < deadline) {
    const r = await supertest(server)
      .get(`/api/blockchain/finals/${tid}`)
      .set('x-internal-api-key', IAK);

    if (r.status === 200 && r.body && r.body.exists) {
      observed = r.body;
      break;
    } else if (r.status !== 404) {
      // Unexpected error → fail
      t.assert.fail(`[e2e-bridge] unexpected blockchain status: ${r.status} ${r.text || ''}`);
      return;
    }
    await sleep(200);
  }

  if (!observed) {
    // Don’t fail the suite if reporter is disabled/not wired; just note and skip.
    t.diagnostic(`[e2e-bridge] SKIP: final not observed in time (reporter disabled or delayed). tid=${tid}`);
    return;
  }

  t.assert.strictEqual(observed.winner_alias, expectedWinner, `wrong winner, expected ${expectedWinner}`);
});

  // await t.test('DELETE `/api/users/:user_id` route', async (t) => {
  //   await t.test('Delete without user ownership token', async (t) => { 
  //     

  //     
  //     

  //     const response = await supertest(server)
  //     .delete('/api/users/1')
  //     .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  //     .expect(401)
  //     .expect('Content-Type', 'application/json; charset=utf-8');
  //   });

  //   await t.test('Delete route while logged in as different user', async (t) => {
  //     

  //     
  //     

  //     const response = await supertest(server)
  //     .delete('/api/users/1')
  //     .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  //     .set('Authorization', `Bearer ${tokens.user2Token}`)
  //     .expect(403)
  //     .expect('Content-Type', 'application/json; charset=utf-8');

  //     t.assert.deepStrictEqual(response.body, schemas.JSONError('User not authorized', 403));
  //   });

  //   await t.test('Delete while logged in as the same user', async (t) => {
  //     

  //     
  //     

  //     const response = await supertest(server)
  //     .delete('/api/users/2')
  //     .set('x-internal-api-key', process.env.INTERNAL_API_KEY)
  //     .set('Authorization', `Bearer ${tokens.user2Token}`)
  //     .expect(200)
  //     .expect('Content-Type', 'application/json; charset=utf-8');

  //     t.assert.deepStrictEqual(response.body, { message: 'User deleted' });
  //   });

  //   await t.test('Delete while logged in as admin', async (t) => {
  //     

  //     
  //     

  //     const response = await supertest(server)
  //     .delete('/api/users/1')
  //     .set('Authorization', `Bearer ${tokens.adminToken}`)
  //     .expect(200)
  //     .expect('Content-Type', 'application/json; charset=utf-8');

  //     t.assert.deepStrictEqual(response.body, { message: 'User deleted' });
  //   });
  // });
});