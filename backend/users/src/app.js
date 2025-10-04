'use strict'
/*
Register a user:

    curl -i 'http://127.0.0.1:3000/register' -H 'content-type: application/json' --data '{"user": "myuser","password":"mypass"}'
Will return:
    {"token":"YOUR_JWT_TOKEN"}

The application then:
1. generates a JWT token (from 'supersecret') and adds to the response headers
1. inserts user in the leveldb

Check it's all working by using one or the other auth mechanisms:
1. Auth using username and password (you can also use JWT on this endpoint)
    curl 'http://127.0.0.1:3000/auth-multiple' -H 'content-type: application/json' --data '{"user": "myuser","password":"mypass"}'
    {"hello":"world"}

1. Auth using JWT token
    curl -i 'http://127.0.0.1:3000/auth' -H 'content-type: application/json' -H "auth: YOUR_JWT_TOKEN"
 */
const db = require('./db');
const Fastify = require('fastify')

function buildFastify(opts) {
  const fastify = Fastify(opts)
  db.create()

  fastify.register(require('@fastify/jwt'), { secret: 'supersecret' })
  fastify.register(require('@fastify/auth'))
  fastify.after(routes)

  fastify.decorate('verifyJWTandLevelDB', verifyJWTandLevelDB)
  fastify.decorate('verifyUserAndPassword', verifyUserAndPassword)

  function verifyJWTandLevelDB (request, reply, done) {
    const jwt = this.jwt
    const level = this.level.authdb

    if (request.body && request.body.failureWithReply) {
      reply.code(401).send({ error: 'Unauthorized' })
      return done(new Error())
    }

    if (!request.raw.headers.auth) {
      return done(new Error('Missing token header'))
    }

    jwt.verify(request.raw.headers.auth, onVerify)

    function onVerify (err, decoded) {
      if (err || !decoded.user || !decoded.password) {
        return done(new Error('Token not valid'))
      }

      level.get(decoded.user, onUser)

      function onUser (err, password) {
        if (err) {
          if (err.notFound) {
            return done(new Error('Token not valid'))
          }
          return done(err)
        }

        if (!password || password !== decoded.password) {
          return done(new Error('Token not valid'))
        }

        done()
      }
    }
  }

  function verifyUserAndPassword (request, _reply, done) {
    const level = this.level.authdb

    if (!request.body || !request.body.user) {
      return done(new Error('Missing user in request body'))
    }

    level.get(request.body.user, onUser)

    function onUser (err, password) {
      if (err) {
        if (err.notFound) {
          return done(new Error('Password not valid'))
        }
        return done(err)
      }

      if (!password || password !== request.body.password) {
        return done(new Error('Password not valid'))
      }

      done()
    }
  }

  function routes () {
    fastify.get('/', async (request, reply) => {
      return { message: 'users' }
    })

    fastify.get('/health', async (request, reply) => {
      return { status: 'ok' }
    })

    fastify.route({
      method: 'POST',
      url: '/register',
      schema: {
      body: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['username', 'password']
      }
      },
      handler: (req, reply) => {
        req.log.info('Creating new user')
        try {
          db.addUser(req.body.username, req.body.password);

          const token = fastify.jwt.sign({ user: req.body.username, password: req.body.password })
          reply.send({ token })
        } catch (err) {
            reply.status(err.cause?.code || 500).send(err.message);
        }
      }
    })

    fastify.route({
      method: 'POST',
      url: '/auth',
      preHandler: fastify.auth([
        fastify.verifyJWTandLevelDB,
        fastify.verifyUserAndPassword
      ]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  }

  return fastify
}

module.exports = buildFastify