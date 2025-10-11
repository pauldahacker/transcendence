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

  // this is to enable unauthenticateed access to public users endpoints
  // I cannot login otherwise
  // Delete/comment out this part if it breaks anything
  // also remember to change the preHandler below
  const usersProxyPreHandler = (req, reply, done) => {
    // Public endpoints that must work without JWT / internal API key
    const isPublicUsers =
      req.method === 'POST' && (req.url === '/users/login' || req.url === '/users/register');
    if (isPublicUsers) return done();
    return preHandler(req, reply, done);
  };
  // end of segment to be deleted /commented out
  app.register(require('@fastify/http-proxy'), {
    upstream: "https://users:" + process.env.USERS_PORT,
    prefix: '/users',
    // swithc back to preHandler if necessary
    // preHandler: preHandler,
    preHandler: usersProxyPreHandler,
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