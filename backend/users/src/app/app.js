'use strict';
const Fastify = require('fastify');
const bcrypt = require('bcrypt');

const { UsersDatabase } = require('./db');
const { routes, tokenBlacklist } = require('./routes');

function buildFastify(opts, dbPath) {
  const app = Fastify(opts);
  const db = new UsersDatabase(dbPath);

  app.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
    trusted: async (_request, decodedToken) => {
      if (tokenBlacklist.has(decodedToken.jti))
        return false;
      return decodedToken;
    }
  });
  app.register(require('@fastify/auth'));
  app.after(() => {
    routes(app, db);
  });

  app.decorate('verifyUserAndPassword', async (request, _reply) => {
    try {
      if (!request.body || !request.body.username) 
        throw Error('Missing user in body', 400);

      const user = db.getUser(request.body.username);
      if (!await bcrypt.compare(request.body.password, user.password))
        throw Error('Password not valid', 401);
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyUserOwnership', async (request, _reply) => {
    try {
      if (!request.params.user_id) 
        throw Error('Missing user ID in params', 400);

      if (parseInt(request.params.user_id) !== request.user.id)
        throw Error('User not authorized');
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyUserExists', async (request, _reply) => {
    try {
      if (!request.params.user_id) 
        throw Error('Missing user ID in params', 400);

      db.getUserById(request.params.user_id);
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyAdminJWT', async (request, _reply) => {
    try {
      await request.jwtVerify();
      if (request.user.username !== "admin")
        throw Error('User not authorized');
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyInternalApiKey', (request, _reply, done) => {
    try {
      const apiKey = request.headers['x-internal-api-key'];
      if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY)
        throw Error('Invalid API Key', 401);
    } catch (err) {
      return done(err);
    }
    return done();
  });

  app.decorate('verifyJWT', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  return { app, db };
}

module.exports = { buildFastify, tokenBlacklist };