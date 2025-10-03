const fs = require('fs')
const buildFastify = require('./app');
const PORT = 3002;

const server = buildFastify({
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

server.listen({ host: '0.0.0.0', port: PORT }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});