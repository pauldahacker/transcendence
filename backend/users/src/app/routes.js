const schemas = require('./schemas');
const { v6: uuidv6 } = require('uuid');
const tokenBlacklist = new Set();

function routes(fastify, db) {
	fastify.get('/', async (request, reply) => {
			request.log.info('Fetching all users');
			const users = db.getAllUsers();
			fastify.log.info("Users: ", users);
			if (!users)
				return reply.status(404).send(schemas.JSONError('No users found', 404));
			return reply.send(users);
		}
	);

	fastify.get('/health', async (_request, reply) => {
		return reply.send({ status: 'ok' });
	});

	fastify.post('/register',
		{ schema: { body: schemas.usernameAndPasswordSchema } },
		async (request, reply) => {
			request.log.info('Creating new user');
			try {
				const info = db.addUser(request.body.username, request.body.password);

				return reply.status(201).send(info);
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
		}, async (request, reply) => {
			request.log.info('User logging in');
			try {
				const token = fastify.jwt.sign({
					username: request.body.username,
					jti: uuidv6()}, { expiresIn: '1h' });
				return reply.send({ token });
			} catch (err) {
				throw err;
			}
		}
	);

	fastify.post('/logout', async (request, reply) => {
			request.log.info('User logging out');
			try {				
				tokenBlacklist.add(request.user.jti);
				return reply.send({ message: 'Logged out successfully' });
			} catch (err) {
					throw err;
			}
		}
	);

	fastify.get('/:user_id', async (request, reply) => {
			request.log.info('Fetching user profile');
			try {
				const info = db.getProfile(request.params.user_id);
				return reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);

	fastify.put('/:user_id', {
			preHandler: fastify.auth([
				fastify.verifyUserOwnership
			], { relation: 'and' }),
		}, async (request, reply) => {
			request.log.info('Updating user profile');
			try {
				const info = db.updateProfile(request.params.user_id, request.body);
				return reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);
}

module.exports = { routes, tokenBlacklist };