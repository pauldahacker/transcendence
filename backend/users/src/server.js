const fs = require('fs')
const { buildFastify } = require('./app/app');

const DB_NAME = 'users.db'
const PORT = 3002;

const optsFastify = {
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
      allowHTTP1: true,
      key: fs.readFileSync("/app/certs/key.pem"),
      cert: fs.readFileSync("/app/certs/cert.pem"),
    },
    http2: true
}

const { app } = buildFastify(optsFastify, DB_NAME);

app.listen({ host: '0.0.0.0', port: PORT }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});