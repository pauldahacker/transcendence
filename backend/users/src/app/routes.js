const schemas = require('./schemas');
const { v6: uuidv6 } = require('uuid');
const tokenBlacklist = new Set();

function routes(app, db) {
	app.get('/', async (request, reply) => {
			request.log.info('Fetching all users');
			const users = db.getAllUsers();
			return reply.send(users);
		}
	);

	app.get('/health', async (_request, reply) => {
		return reply.send({ status: 'ok' });
	});

	app.post('/register',
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

	app.post('/login', {
			schema: { body: schemas.usernameAndPasswordSchema },
			preHandler: app.auth([
				app.verifyUserAndPassword,
			]),
		}, async (request, reply) => {
			request.log.info('User logging in');
			try {
				const token = app.jwt.sign({
					username: request.body.username,
					jti: uuidv6()}, { expiresIn: '1h' });
				return reply.send({ token });
			} catch (err) {
				throw err;
			}
		}
	);

	app.post('/logout', {
		preHandler: app.auth([
			app.verifyJWT
		])
	}, async (request, reply) => {
		request.log.info('User logging out');
		try {
			tokenBlacklist.add(request.user.jti);
			return reply.send({ message: 'Logged out successfully' });
		} catch (err) {
					throw err;
			}
		}
	);

	app.get('/:user_id', {
			preHandler: app.auth([
				app.verifyJWT
			])
		},
		async (request, reply) => {
			request.log.info('Fetching user profile');
			try {
				const info = db.getProfile(request.params.user_id);
				return reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);

	app.put('/:user_id', {
			preHandler: app.auth([[
				app.verifyJWT,
				app.verifyUserOwnership
			], app.verifyAdminJWT], { relation: 'or' }),
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

	app.delete('/:user_id', {
		preHandler: app.auth([
			app.verifyUserOwnership,
			app.verifyAdminJWT
		], { relation: 'or' })
	}, async (request, reply) => {
		request.log.info('Deleting user');
		try {
			db.deleteUser(request.params.user_id);
			return reply.send({ message: 'User deleted' });
		} catch (err) {
			throw err;
		}
	});
}

module.exports = { routes, tokenBlacklist };