/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:23:43 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/19 08:43:03 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const fs = require('fs');
const path = require('path');
const Fastify = require('fastify');

const CERT_DIR = '/certs';
const AUTH_URL = process.env.AUTH_URL || 'http://auth:3001';

const fastify = Fastify({
  logger: true,
  https: {
    key: fs.readFileSync(path.join(CERT_DIR, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(CERT_DIR, 'localhost.pem')),
  },
});

// basic hardening & CORS for local dev
async function build() {
  await fastify.register(require('@fastify/helmet'));
  await fastify.register(require('@fastify/cors'), {
    origin: true, // allow your SPA origin in dev; tighten later
    credentials: true,
  });

  // liveness
  fastify.get('/healthz', async () => ({ status: 'ok' }));

  // proxy /auth/* → auth service
  await fastify.register(require('@fastify/http-proxy'), {
    upstream: AUTH_URL,
    prefix: '/auth',
    rewritePrefix: '/', // so /auth/healthz → /healthz on the auth service
  });

  const port = 443;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`gateway up on https://0.0.0.0:${port}`);
}

build().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
