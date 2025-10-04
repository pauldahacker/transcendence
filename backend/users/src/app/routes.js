const schemas = require('./schemas');

function routes(fastify, db) {
	fastify.get('/', async (_request, _reply) => {
		return { message: 'users' };
	});

	fastify.get('/health', async (_request, _reply) => {
		return { status: 'ok' };
	});

	fastify.post('/register',
		{ schema: { body: schemas.usernameAndPasswordSchema } },
		async (request, reply) => {
			request.log.info('Creating new user');
			try {
				db.addUser(request.body.username, request.body.password);

				const token = fastify.jwt.sign({ user: request.body.username, password: request.body.password });
				reply.send({ token });
			} catch (err) {
				throw err;
			}
		});

	fastify.post('/login', {
		schema: { body: schemas.usernameAndPasswordSchema },
		preHandler: fastify.auth([
			fastify.verifyUserAndPassword,
		]),
	}, async (request, _reply) => {
		request.log.info('User logging in');
		try {
			const token = fastify.jwt.sign({
				user: request.body.username,
				password: request.body.password
			});
			return { token };
		} catch (err) {
			throw err;
		}
	});
}

module.exports = { routes };