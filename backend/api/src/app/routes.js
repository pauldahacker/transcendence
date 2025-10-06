const { v6: uuidv6 } = require('uuid');
const schemas = require('./schemas');

const USERS_PORT = 3002;
const TOURNAMENTS_PORT = 3003;

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

  const proxyRoutes = [
    {
      prefix: '/users',
      url: `https://users:${USERS_PORT}`,
      preHandler: preHandler,
    },
    {
      prefix: '/tournaments',
      url: `https://tournaments:${TOURNAMENTS_PORT}`,
      preHandler: preHandler,
    }
  ];

  proxyRoutes.forEach((proxyRoute) => {
    app.register(require('@fastify/http-proxy'), {
      upstream: proxyRoute.url,
      prefix: proxyRoute.prefix,
      preHandler: proxyRoute.preHandler,
    });
  });
}

module.exports = routes;