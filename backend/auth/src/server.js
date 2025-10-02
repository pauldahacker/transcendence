const fastify = require('fastify')({
  logger: true
})

const PORT = process.env.AUTH_PORT || 3001;

fastify.get('/', async (request, reply) => {
  reply.send({ status: 'auth service' })
})

fastify.listen({ host: '0.0.0.0', port: PORT }, function (err) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})