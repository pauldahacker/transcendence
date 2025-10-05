'use strict';

const { UsersDatabase } = require('./db');
const Fastify = require('fastify');
const { routes, tokenBlacklist } = require('./routes');
const { JSONError } = require('./schemas');

function buildFastify(opts, dbFile) {
  const fastify = Fastify(opts);
  const db = new UsersDatabase(dbFile);

  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
    trusted: async (_request, decodedToken) => {
      if (tokenBlacklist.has(decodedToken.jti))
        return false;
      return decodedToken;
    }
  });
  fastify.register(require('@fastify/auth'));
  
  fastify.after(() => {
    routes(fastify, db);
  });

  fastify.decorate('verifyJWT', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send(JSONError('Token not valid', 401));
      throw err;
    }
  });


  fastify.decorate('verifyUserAndPassword', async (request, _reply, done) => {
    if (!request.body || !request.body.username) 
      return done(JSONError('Missing user in body', 400));

    try {
      const user = db.getUser(request.body.username);
      if (!user || user.password !== request.body.password)
        throw done(JSONError('Password not valid', 401));
    } catch (err) {
      return done(err);
    }
    return done();
  });

  fastify.decorate('verifyUserOwnership', async (request, _reply, done) => {
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

  return fastify;
}

module.exports = { buildFastify, tokenBlacklist };