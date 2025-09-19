/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/19 10:28:08 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const Fastify = require('fastify');

const PORT = Number(process.env.PORT || 3001);

const fastify = Fastify({ logger: true });

// liveness
fastify.get('/healthz', async () => ({ status: 'ok' }));

async function start() {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`auth up on http://0.0.0.0:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
