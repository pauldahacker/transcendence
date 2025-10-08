'use strict';
const Fastify = require('fastify');
const bcrypt = require('bcrypt');

const { UsersDatabase } = require('./db');
const { routes, tokenBlacklist } = require('./routes');
const { JSONError } = require('./schemas');

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
        throw JSONError('Missing user in body', 400);

      const user = db.getUser(request.body.username);
      if (!await bcrypt.compare(request.body.password, user.password))
        throw JSONError('Password not valid', 401);
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyUserOwnership', async (request, _reply, done) => {
    try {
      if (!request.params.user_id) 
        throw JSONError('Missing user ID in params', 400);

      const user = db.getUserById(request.params.user_id);
      if (user.username !== request.user.username)
        throw JSONError('User not authorized', 403);
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyAdminJWT', async (request, reply) => {
    try {
      if (request.user.username !== "admin")
        throw JSONError('User not authorized', 403);
    } catch (err) {
      throw err;
    }
  });

  app.decorate('verifyInternalApiKey', (request, _reply, done) => {
    try {
      const apiKey = request.headers['x-internal-api-key'];
      if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY)
        throw JSONError('Invalid API Key', 401);
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