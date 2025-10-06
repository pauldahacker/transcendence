const fs = require('fs')
const Fastify = require('fastify');
const { request } = require('http');

const PORT = 443;
const API_PORT = 3000;
const FRONTEND_PORT = 3001;

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

const routes = [
  { prefix: '/api', url: `https://api:${API_PORT}` },
  { prefix: '/', url: `https://frontend:${FRONTEND_PORT}` }
];

routes.forEach((route) => {
  server.register(require('@fastify/http-proxy'), {
		upstream: route.url,
		prefix: route.prefix,
		http2: false
	});
});

app.decorate('verifyAdmin', async (request, _reply, done) => {
    try {
      const user = db.getUser(request.user.username);
      if (!user || !user.is_admin)
        throw done(JSONError('Admin privileges required', 403));
    } catch (err) {
      return done(err);
    }
    return done();
  });

server.setErrorHandler((error, request, reply) => {
  if (error.code === 'UND_ERR_SOCKET' || error.code === 'ECONNREFUSED') {
	server.log.error(`Upstream service unavailable: ${error.message}`);
	reply.code(503).send({ 
	  error: 'Service Temporarily Unavailable',
	  message: 'The requested service is currently unavailable. Please try again later.',
	});
  } else {
	server.log.error(error);
	reply.code(500).send({ error: 'Internal Server Error' });
  }
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