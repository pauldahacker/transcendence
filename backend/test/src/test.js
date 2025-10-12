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