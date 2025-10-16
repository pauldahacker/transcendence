/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/16 23:27:37 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const fs = require('fs');
const path = require('path');
const { finalsPostSchema } = require('./schemas');

const finalsStore = new Map();

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

  fastify.post('/finals', { schema: { body: finalsPostSchema } }, async (req, reply) => {
    const {
      tournament_id,
      winner_alias,
      score_a,
      score_b,
      points_to_win
    } = req.body || {};
  
    const id = Number(tournament_id);
    const txHash = `0xmock_${id}_${Date.now()}`;
  
    // store the latest result for this tournament (mock, overwrites previous)
    finalsStore.set(id, { winner_alias, score_a, score_b, points_to_win });
  
    reply.code(201).send({ txHash });
  });

  fastify.get('/finals/:tournament_id', async (req, reply) => {
    const id = Number(req.params.tournament_id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'bad_tournament_id' });
    }
    const data = finalsStore.get(id);
    if (!data) return reply.code(404).send({ error: 'not_found' });
    // return a copy of the data
    return { ...data, exists: true };
  });
}

module.exports = routes;
