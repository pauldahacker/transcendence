const Fastify = require('fastify');
const { applyRelaxedSecurityHeaders, applySecurityHeaders } = require('./securityHeaders');

function buildFastify(opts) {
	const app = Fastify(opts);

	app.register(require('@fastify/http-proxy'), {
		upstream: "https://frontend:" + process.env.FRONTEND_PORT,
		prefix: '/',
	});

	app.register(require('@fastify/http-proxy'), {
		upstream: "https://api:" + process.env.API_PORT,
		prefix: '/api',
	});

	app.addHook('onRequest', async (request, reply) => {
		const url = request.url;

		if (url === '/')
			applySecurityHeaders(reply, "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src https: wss:");
		else if (url.endsWith('/health'))
			applyRelaxedSecurityHeaders(reply);
		else if (url.startsWith('/api'))
			applySecurityHeaders(reply);
	});

	app.get('/health', async (_request, _reply) => {
		return { status: 'ok' };
	});

	return app;
}

module.exports = buildFastify;