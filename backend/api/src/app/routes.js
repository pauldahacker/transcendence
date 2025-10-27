const { v6: uuidv6 } = require('uuid');
const schemas = require('./schemas');

function routes(app) {
  app.get('/health', async (_request, _reply) => {
    return { status: 'ok' };
  });

  // a safety stub for future proofing, does not affect anything
  app.options('/api/*', async (_req, reply) => {
    reply.code(204).send();
  });

  app.post('/admin', {
    schema: { body: schemas.adminPasswordSchema },
    preHandler: app.auth([
      app.verifyAdminCredentials,
    ])}, async (request, _reply) => {
      request.log.info('Admin logging in');
      try {
        const token = app.jwt.sign({
          username: 'admin',
          jti: uuidv6()}, { expiresIn: '1h' });
        return { token };
      } catch (err) {
        throw err;
      }
    }
  );

  const preHandler = app.auth([
    app.verifyInternalApiKey,
    app.verifyJWT
  ], { relation: 'or' });

  app.register(require('@fastify/http-proxy'), {
    upstream: "https://users:" + process.env.USERS_PORT,
    prefix: '/users',
    preHandler: preHandler,
  });

  app.register(require('@fastify/http-proxy'), {
    upstream: "https://tournaments:" + process.env.TOURNAMENTS_PORT,
    prefix: '/tournaments',
    preHandler: preHandler,
  });

  // app.register(require('@fastify/http-proxy'), {
  //   upstream: "https://blockchain:" + process.env.BLOCKCHAIN_PORT,
  //   prefix: '/blockchain',
  //   preHandler: preHandler,
  // });
app.register(async function (scope) {
  // Apply rate limit only inside this scope
  scope.register(require('@fastify/rate-limit'), {
    max: 30,                  // 30 requests
    timeWindow: '10 seconds', // per 10s window
    continueExceeding: false, // 429 immediately when exceeded
    ban: 0,                   // no auto-ban
    cache: 10000,             // small cache is fine
    global: true
  });

  // The proxy within this scope; the scope's prefix provides '/blockchain'
  scope.register(require('@fastify/http-proxy'), {
    upstream: "https://blockchain:" + process.env.BLOCKCHAIN_PORT,
    prefix: '/',              // keep root inside the scope
    preHandler: preHandler,
  });
  }, { prefix: '/blockchain' });
}

module.exports = routes;