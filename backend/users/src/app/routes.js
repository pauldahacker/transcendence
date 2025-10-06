const schemas = require('./schemas');
const { v6: uuidv6 } = require('uuid');
const tokenBlacklist = new Set();

function routes(fastify, db) {
	fastify.get('/', {
		preHandler: fastify.auth([
			fastify.verifyJWT
		])}, async (_request, _reply) => {
			return db.getAllUsers();
		}
	);

	fastify.get('/health', async (_request, _reply) => {
		return { status: 'ok' };
	});

	fastify.post('/register',
		{ schema: { body: schemas.usernameAndPasswordSchema } },
		async (request, reply) => {
			request.log.info('Creating new user');
			try {
				const info = db.addUser(request.body.username, request.body.password);

				reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);

	fastify.post('/login', {
			schema: { body: schemas.usernameAndPasswordSchema },
			preHandler: fastify.auth([
				fastify.verifyUserAndPassword,
			]),
		}, async (request, _reply) => {
			request.log.info('User logging in');
			try {
				const token = fastify.jwt.sign({
					username: request.body.username,
					jti: uuidv6()}, { expiresIn: '1h' });
				return { token };
			} catch (err) {
				throw err;
			}
		}
	);

	fastify.post('/logout', {
			preHandler: fastify.auth([
				fastify.verifyJWT,
			]),
		}, async (request, reply) => {
			request.log.info('User logging out');
			try {				
				tokenBlacklist.add(request.user.jti);
				reply.send({ message: 'Logged out successfully' });
			} catch (err) {
					throw err;
			}
		}
	);

	fastify.get('/:user_id', {
			preHandler: fastify.auth([
				fastify.verifyJWT,
			]),
		}, async (request, reply) => {
			request.log.info('Fetching user profile');
			try {
				const info = db.getProfile(request.params.user_id);
				reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);

	fastify.put('/:user_id', {
			preHandler: fastify.auth([
				fastify.verifyJWT,
				fastify.verifyUserOwnership
			], { relation: 'and' }),
		}, async (request, reply) => {
			request.log.info('Updating user profile');
			try {
				const info = db.updateProfile(request.params.user_id, request.body);
				reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);
}

module.exports = { routes, tokenBlacklist };