/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/16 22:21:35 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const fs = require('fs');
const path = require('path');

async function routes(fastify) {
  // service-level open health
  fastify.get('/health', async () => ({ status: 'ok' }));

  // stub for db health check (like in tournaments). maybe I will not need  it
  fastify.get('/health/db', async () => ({ status: 'ok' }));

  // return TournamentRegistry ABI
  fastify.get('/abi/TournamentRegistry', async (req, reply) => {
    // const rootDir = path.join(__dirname, '..', '..');
    const abiPath = path.join(
      __dirname,
      '..',
      'artifacts',
      'contracts',
      'TournamentRegistry.sol',
      'TournamentRegistry.json'
    );

    try {
      const buf = fs.readFileSync(abiPath);
      const json = JSON.parse(buf.toString());
      // Return only the ABI array (clean surface)
      return json.abi || [];
    } catch (err) {
      req.log.error({ err, abiPath }, 'failed to read ABI');
      reply.code(500).send({ error: 'abi_unavailable' });
    }
  });
}

module.exports = routes;
