const { v6: uuidv6 } = require('uuid');
const schemas = require('./schemas');

function routes(app) {
  app.get('/health', async (_request, _reply) => {
    return { status: 'ok' };
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
    app.verifyJWT,
    app.verifyInternalApiKey
  ], { relation: 'or' });

  app.register(require('@fastify/http-proxy'), {
    upstream: "https://users:" + process.env.USERS_PORT,
    prefix: '/users',
    preHandler: preHandler,
  });

  app.addHook('onRequest', (req, reply, done) => {
    if (req.method !== 'OPTIONS') return done();
    if (!req.url.startsWith('/tournaments/')) return done();

    const origin = req.headers.origin || '*';
    reply
      .header('access-control-allow-origin', origin)
      .header('vary', 'Origin')
      .header('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      .header(
        'access-control-allow-headers',
        req.headers['access-control-request-headers'] ||
          'authorization,content-type,x-internal-api-key'
      )
      .header('access-control-allow-credentials', 'true')
      .code(204)
      .send();
  });

  app.register(require('@fastify/http-proxy'), {
    upstream: "https://tournaments:" + process.env.TOURNAMENTS_PORT,
    prefix: '/tournaments',
    preHandler: preHandler,
  });
}

module.exports = routes;