const fs = require('fs')
const path = require('path')
const Fastify = require('fastify');

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

routes = [
  { prefix: '/', url: 'http://frontend:3000' },
  { prefix: '/api/auth', url: 'http://auth:3001' },
  { prefix: '/api/tournaments', url: 'http://tournaments:3002' },
];

routes.forEach((route) => {
  server.register(proxy, {
    upstream: route.url,
    prefix: route.prefix,
    http2: false
  });
});

server.get('/api', async (request, reply) => {
  return { message: 'API Gateway is running' };
});

server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

server.listen({ host: '0.0.0.0', port: 443 }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});