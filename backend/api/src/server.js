const fs = require('fs')
const path = require('path')
const Fastify = require('fastify');

const PORT = process.env.PORT || 3000;
const AUTH_PORT = process.env.AUTH_PORT || 3001;
const TOURNAMENTS_PORT = process.env.TOURNAMENTS_PORT || 3002;

const server = Fastify({
  logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname'
        }
      }
    },
    https: {
      key: fs.readFileSync(path.join(__dirname, "../certs/key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "../certs/cert.pem")),
    }
});

const proxy = require('@fastify/http-proxy');

const routes = [
  { prefix: '/auth', url: `http://auth:${AUTH_PORT}` },
  { prefix: '/tournaments', url: `http://tournaments:${TOURNAMENTS_PORT}` },
];

routes.forEach((route) => {
  server.register(proxy, {
    upstream: route.url,
    prefix: route.prefix
  });
});

server.get('/', async (request, reply) => {
  return { message: 'API Gateway is running' };
});

server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

server.listen({ host: '0.0.0.0', port: PORT }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});