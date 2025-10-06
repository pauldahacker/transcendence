import fs from 'fs';
import Fastify from 'fastify';
import got from 'got';

const PORT = 3003;
const API_PORT = 3000;

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
    const data = await got.get(`https://api:${API_PORT}/`, {
      https: {
        rejectUnauthorized: false
      },
      headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY }
    }).json();

  return data;
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