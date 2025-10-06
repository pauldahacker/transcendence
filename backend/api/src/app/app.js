'use strict';

const Fastify = require('fastify');
const routes = require('./routes');
const { JSONError } = require('./schemas');

function buildFastify(opts) {
  const app = Fastify(opts);

  app.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
  });
  app.register(require('@fastify/auth'));
  app.after(() => {
    routes(app);
  });

  app.decorate('verifyJWT', async (request, _reply, done) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return done(JSONError('Token not valid', 401));
    }
    return done();
  });

  app.decorate('verifyAdminCredentials', async (request, _reply, done) => {
    try {
      if (request.body.admin_password !== process.env.ADMIN_PASSWORD)
        throw new JSONError('Admin credentials are invalid', 401);
    } catch (err) {
      return done(err);
    }
    return done();
  });

  app.decorate('verifyInternalApiKey', async (request, reply, done) => {
    try {
      const apiKey = request.headers['x-internal-api-key'];
      if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        throw new JSONError('Invalid API Key', 401);
      }
    } catch (err) {
      return done(err);
    }
    return done();
  });

  return app;
}

module.exports = buildFastify;