const fs = require('fs')
const Fastify = require('fastify');

const PORT = 3003;

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

server.get('/', async (request, reply) => {
  return { message: 'tournaments' };
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