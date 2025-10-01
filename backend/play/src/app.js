const fastify = require('fastify')({
  logger: true
})

fastify.get('/', function (request, reply) {
  reply.send({ status: 'play service' })
})

fastify.listen({ host: "0.0.0.0", port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})