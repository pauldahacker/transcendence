/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/21 21:06:27 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const fs = require('fs');
const path = require('path');
const { finalsPostSchema } = require('./schemas');
// const { recordFinal, getFinal } = require('./chain');
const { recordFinal, getFinal, diagnostics } = require('./chain');

// no longer needed due to switch away from internal mock up
// const finalsStore = new Map();

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

  // no longer needed due to switch away from internal mock up
  // fastify.post('/finals', { schema: { body: finalsPostSchema } }, async (req, reply) => {
  //   const {
  //     tournament_id,
  //     winner_alias,
  //     score_a,
  //     score_b,
  //     points_to_win
  //   } = req.body || {};
  
  //   const id = Number(tournament_id);
  //   const txHash = `0xmock_${id}_${Date.now()}`;
  
  //   // store the latest result for this tournament (mock, overwrites previous)
  //   finalsStore.set(id, { winner_alias, score_a, score_b, points_to_win });
  
  //   reply.code(201).send({ txHash });
  // });

  fastify.post('/finals', { schema: { body: finalsPostSchema } }, async (req, reply) => {
    const { tournament_id, winner_alias, score_a, score_b, points_to_win } = req.body;
    try {
      const { txHash } = await recordFinal({ tournament_id, winner_alias, score_a, score_b, points_to_win });
      reply.code(201).send({ txHash });
    } catch (err) {
      if (err && err.code === 'ALREADY_RECORDED') {
        return reply.code(409).send({ error: 'already_recorded' });
      }
      throw err; // just a precautin for fastify to produce 500 for unexpected cases 
    }
  });

  fastify.get('/finals/:tournament_id', async (req, reply) => {
    const id = Number(req.params.tournament_id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'bad_tournament_id' });
    }
    //replaced due to swtich away from internal mockup
    // const data = finalsStore.get(id);
    const data = await getFinal(id);
    if (!data) return reply.code(404).send({ error: 'not_found' });
    // return a copy of the data
    return { ...data, exists: true };
  });

  // diagnostics: surface adapter readiness without secrets
  fastify.get('/config/diagnostics', async (_req, _reply) => {
    const d = await diagnostics();
    return d;
  });

  fastify.get('/config', async () => {
    const enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
    const hasCreds = Boolean(process.env.RPC_URL && process.env.PRIVATE_KEY && process.env.REGISTRY_ADDRESS);
    const ready = enabled && hasCreds;
    const network = ready
      ? (process.env.BLOCKCHAIN_NETWORK && process.env.BLOCKCHAIN_NETWORK.trim()
        ? process.env.BLOCKCHAIN_NETWORK.trim()
        : 'fuji')
      : (process.env.BLOCKCHAIN_NETWORK && process.env.BLOCKCHAIN_NETWORK.trim()
        ? process.env.BLOCKCHAIN_NETWORK.trim()
        : null);
    const registryAddress = process.env.REGISTRY_ADDRESS || null; // public contract address (when set)
    const mode = ready ? 'real' : 'mock';
    return { enabled, mode, ready, network, registryAddress };
  }); 
}

module.exports = routes;
