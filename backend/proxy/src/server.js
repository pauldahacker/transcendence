const fs = require('fs')
const Fastify = require('fastify');
const { applyRelaxedSecurityHeaders, applySecurityHeaders } = require('./securityHeaders');

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
		allowHTTP1: true,
	  key: fs.readFileSync("/app/certs/key.pem"),
	  cert: fs.readFileSync("/app/certs/cert.pem"),
	},
	http2: true
});

const routes = [
  { prefix: '/api', url: `https://api:${API_PORT}` },
  { prefix: '/', url: `https://frontend:${FRONTEND_PORT}` }
];

routes.forEach((route) => {
  server.register(require('@fastify/http-proxy'), {
		upstream: route.url,
		prefix: route.prefix,
	});
});

server.setErrorHandler((error, _request, reply) => {
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

server.addHook('onRequest', async (request, reply) => {
  const url = request.url;

	if (url === '/')
		applySecurityHeaders(reply, "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com");
  else if (url.endsWith('/health'))
    applyRelaxedSecurityHeaders(reply);
	else if (url.startsWith('/api'))
		applySecurityHeaders(reply);
});

server.get('/health', async (_request, _reply) => {
  return { status: 'ok' };
});

server.listen({ host: '0.0.0.0', port: PORT }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});