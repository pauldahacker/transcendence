'use strict';

const { UsersDatabase } = require('./db');
const Fastify = require('fastify');
const bcrypt = require('bcrypt');
const { routes, tokenBlacklist } = require('./routes');
const { JSONError } = require('./schemas');

function buildFastify(opts, dbFile) {
  const app = Fastify(opts);
  const db = new UsersDatabase(dbFile);

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

  app.decorate('verifyJWT', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send(JSONError('Token not valid', 401));
      throw err;
    }
  });

  app.decorate('verifyUserAndPassword', async (request, _reply, done) => {
    if (!request.body || !request.body.username) 
      return done(JSONError('Missing user in body', 400));

    try {
      const user = db.getUser(request.body.username);
      if (!await bcrypt.compare(request.body.password, user.password))
        return done(JSONError('Password not valid', 401));
    } catch (err) {
      return done(err);
    }
    return done();
  });

  app.decorate('verifyUserOwnership', async (request, _reply, done) => {
    if (!request.params.user_id) 
      return done(JSONError('Missing user ID in params', 400));

    try {
      const user = db.getUserById(request.params.user_id);
      if (!user || user.username !== request.user.username)
        throw done(JSONError('User not authorized', 403));
    } catch (err) {
      return done(err);
    }
    return done();
  });

  app.decorate('verifyAdmin', async (request, _reply, done) => {
    try {
      const user = db.getUser(request.user.username);
      if (!user || !user.is_admin)
        throw done(JSONError('Admin privileges required', 403));
    } catch (err) {
      return done(err);
    }
    return done();
  });

  return { app, db };
}

module.exports = { buildFastify, tokenBlacklist };