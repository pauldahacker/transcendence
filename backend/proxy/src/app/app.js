const Fastify = require('fastify');
const { applyRelaxedSecurityHeaders, applySecurityHeaders } = require('./securityHeaders');

const API_PORT = 3000;
const FRONTEND_PORT = 3001;

const routes = [
  { prefix: '/api', url: `https://api:${API_PORT}` },
  { prefix: '/', url: `https://frontend:${FRONTEND_PORT}` }
];

function buildFastify(opts) {
	const app = Fastify(opts);

	routes.forEach((route) => {
		app.register(require('@fastify/http-proxy'), {
			upstream: route.url,
			prefix: route.prefix,
		});
	});
	
	app.addHook('onRequest', async (request, reply) => {
		const url = request.url;

		/* if (url === '/')
			applySecurityHeaders(reply, "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com");
		else if (url.endsWith('/health'))
			applyRelaxedSecurityHeaders(reply);
		else if (url.startsWith('/api'))
			applySecurityHeaders(reply); */
	});

	app.get('/health', async (_request, _reply) => {
		return { status: 'ok' };
	});

	return app;
}

module.exports = buildFastify;