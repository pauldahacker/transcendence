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

	app.post('/register', {
		schema: { body: schemas.usernameAndPasswordSchema } 
		}, async (request, reply) => {
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
					id: db.getUser(request.body.username).id,
					username: request.body.username,
					jti: uuidv6()}, { expiresIn: '1h' });
				db.setSessionState(request.body.username, true);
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
			db.setSessionState(request.user.username, false);
			return reply.send({ message: 'Logged out successfully' });
		} catch (err) {
					throw err;
			}
		}
	);

	app.get('/:user_id', {
			preHandler: [app.auth([
				app.verifyJWT,
			]), app.verifyUserExists]
		}, async (request, reply) => {
			request.log.info('Fetching user profile');
			try {
				const info = db.getProfile(request.params.user_id);
				return reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);		

	app.get('/:user_id/stats', {
			preHandler: [app.auth([
					app.verifyJWT
			]), app.verifyUserExists]
		}, async (request, reply) => {
			request.log.info('Fetching user stats');
			try {
				const info = db.getUserStats(request.params.user_id);
				return reply.send(info);
			} catch (err) {
				throw err;
			}
		}
	);

	app.get('/:user_id/friends', {
		preHandler: [app.auth([
					app.verifyJWT
			]), app.verifyUserExists]
	}, async (request, reply) => {
		request.log.info('Fetching user friends');
		try {
			const info = db.getUserFriends(request.params.user_id, request.query.filter);
			return reply.send(info);
		} catch (err) {
			throw err;
		}
	});

	app.post('/:user_id/friend-request', {
		preHandler: [app.auth([
					app.verifyJWT
			]), app.verifyUserExists
		]}, async (request, reply) => {
		request.log.info('Managing friend request');
		try {
			request.params.user_id = parseInt(request.params.user_id);
			if (request.query.action === 'add')
				var info = db.addFriend(request.user.id, request.params.user_id);
			else if (request.query.action === 'remove')
				var info = db.removeFriend(request.user.id, request.params.user_id);
			else
				throw new Error('Invalid action', 400);

			return reply.send(info);
		} catch (err) {
			throw err;
		}
	});

	app.get('/:user_id/match-history', {
		preHandler: [app.auth([
					app.verifyJWT
			]), app.verifyUserExists
		]}, async (request, reply) => {
		request.log.info('Fetching user match history');
		try {
			const info = db.getUserMatchHistory(request.params.user_id);
			return reply.send(info);
		} catch (err) {
			throw err;
		}
	});

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
		preHandler: app.auth([[
				app.verifyJWT,
				app.verifyUserOwnership
			], app.verifyAdminJWT], { relation: 'or' }),
	}, async (request, reply) => {
		request.log.info('Deleting user');
		try {
			db.deleteUser(request.params.user_id);
			return reply.send({ message: 'User deleted' });
		} catch (err) {
			throw err;
		}
	});

	app.post('/match',
		{ schema: { body: schemas.matchResultSchema } },
		async (request, reply) => {
		request.log.info('Adding match result');
		try {
			const info = db.addMatchResult(request.body);
			return reply.status(201).send(info);
		} catch (err) {
			throw err;
		}
	});
}

module.exports = { routes, tokenBlacklist };