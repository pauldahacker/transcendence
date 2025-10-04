'use strict';

const { UsersDatabase } = require('./db');
const Fastify = require('fastify');
const { routes } = require('../routes');
const { JSONError } = require('./schemas');

function buildFastify(opts, dbFile) {
  const fastify = Fastify(opts);
  const db = new UsersDatabase(dbFile);

  fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET });
  fastify.register(require('@fastify/auth'));
  
  fastify.after(() => {
    routes(fastify, db);
  });

  fastify.decorate('verifyJWT', async (request, _reply, done) => {
    const jwt = fastify.jwt;

    if (!request.headers.auth || request.headers.auth.length === 0)
      return done(JSONError('Missing token header', 401));

    jwt.verify(request.headers.auth, (err, decoded) => {
      try {
        if (err || !decoded.user || !decoded.password) {
          throw JSONError('Token not valid', 401);
        }

        const password = db.getUser(decoded.user);
        if (password !== decoded.password)
          throw JSONError('Token credentials not valid', 401);
      } catch (error) {
        return done(error);
      }
      return done();
    });
  });

  fastify.decorate('verifyUserAndPassword', async (request, _reply, done) => {
    if (!request.body || !request.body.username) 
      return done(JSONError('Missing user in body', 400));

    try {
      const password = db.getUser(request.body.username);
      if (!password || password !== request.body.password)
        throw done(JSONError('Password not valid', 401));
    } catch (err) {
      return done(err);
    }
    return done();
  });

  return fastify;
}

module.exports = { buildFastify };