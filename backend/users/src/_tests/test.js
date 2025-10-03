const { test } = require('node:test')
const supertest = require('supertest')
const buildFastify = require('../app')
const db = require('../db')

db.create()

test('GET `/` route', async (t) => {
  const fastify = buildFastify()

  t.after(() => fastify.close())
  
  await fastify.ready()
  
  const response = await supertest(fastify.server)
    .get('/')
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8')
  t.assert.deepStrictEqual(response.body, { message: 'users' })
})

test('GET `/health` route', async (t) => {
  const fastify = buildFastify()

  t.after(() => fastify.close())
  
  await fastify.ready()
  
  const response = await supertest(fastify.server)
	.get('/health')
	.expect(200)
	.expect('Content-Type', 'application/json; charset=utf-8')
  t.assert.deepStrictEqual(response.body, { status: 'ok' })
})

test('POST `register` route', async (t) => {
  const fastify = buildFastify()

  t.after(() => fastify.close())
  
  await fastify.ready()
  
  const response = await supertest(fastify.server)
  .post('/register')
  .send({ username: 'myuser', password: 'mypass' })
  .expect(200)
  .expect('Content-Type', 'application/json; charset=utf-8')

  t.assert.deepStrictEqual(response.body, { token: 'YOUR_JWT_TOKEN' })
})
