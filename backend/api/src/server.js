const fs = require('fs')
const Fastify = require('fastify');

const PORT = 3000;
const USERS_PORT = 3002;
const TOURNAMENTS_PORT = 3003;

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
      key: fs.readFileSync("/app/certs/key.pem"),
      cert: fs.readFileSync("/app/certs/cert.pem"),
    }
});

const proxy = require('@fastify/http-proxy');

const routes = [
  { prefix: '/users', url: `https://users:${USERS_PORT}` },
  { prefix: '/tournaments', url: `https://tournaments:${TOURNAMENTS_PORT}` },
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