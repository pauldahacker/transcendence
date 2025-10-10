/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 02:23:01 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';
const schemas = require('./schemas');
const {
  getTournamentForUpdate,
  listParticipantsSimple,
  clearMatches,
  insertMatch
} = require('./repo');
const { repo } = require('./repo');
const { listMatchesQuery, listMatchesResponse } = require('./schemas');
const { listMatchesByRound } = require('./repo');

function routes(app, db) {
  const r = repo(db);

  app.get('/health', async (_req, reply) => {
    return reply.send({ status: 'ok' });
  });

  // --- Domain: create tournament (draft) ---
  app.post('/', {
    schema: {
      body: schemas.tournamentCreateSchema,
      response: { 201: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } }
    },
  }, async (request, reply) => {
    const id = r.createTournament(request.body);
    return reply.code(201).send({ id });
  });

  // --- Domain: get tournament by id ---
  app.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } },
      },
      response: {
        200: schemas.tournamentEntity,
        404: { type: 'object', required: ['status'], properties: { status: { type: 'string', const: 'not_found' } } }
      },
    },
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const t = r.getTournamentById(id);
    if (!t) return reply.code(404).send({ status: 'not_found' });
    return t;
  });

  // simple SELECT to check if db is connected properly
  app.get('/health/db', async (request, reply) => {
    try {
      db.prepare('SELECT 1').get();
      return reply.send({ status: 'ok' });
    } catch (err) {
      request?.log?.error?.(err);
      return reply.code(500).send({ status: 'error' });
    }
  });

  // --- Participants ---
  app.post('/:id/participants', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: schemas.postParticipantBody,
      response: schemas.postParticipantResponse
    }
  }, async (request, reply) => {
    const tid = Number(request.params.id);
    const { display_name, is_bot = false } = request.body;
    const res = r.insertParticipant(tid, { display_name, is_bot });
    if (res?.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
    if (res?.error === 'conflict') return reply.code(409).send({ status: 'conflict', message: 'alias already joined' });
    return reply.code(201).send({ id: Number(res.id) });
  });

  app.get('/:id/participants', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      response: schemas.listParticipantsResponse
    }
  }, async (request, reply) => {
    const tid = Number(request.params.id);
    const res = r.listParticipants(tid);
    if (res?.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
    return reply.send(res.rows);
  });

  app.delete('/:id/participants/:pid', {
    schema: {
      params: {
        type: 'object',
        required: ['id', 'pid'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          pid: { type: 'integer', minimum: 1 }
        }
      },
      response: schemas.deleteParticipantResponse
    }
  }, async (request, reply) => {
    const tid = Number(request.params.id);
    const pid = Number(request.params.pid);
    const res = r.deleteParticipant(tid, pid);
    if (res?.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
    return reply.code(204).send();
  });

  // --- Start tournament (single elimination, power-of-two) ---
  app.post('/:id/start', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      response: schemas.startTournamentResponse
    }
  }, async (request, reply) => {
    const id = Number(request.params.id);

    const rT = getTournamentForUpdate(db, id);
    if (rT.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
    const t = rT.t;
    if (t.status !== 'draft') return reply.code(409).send({ status: 'conflict', message: 'already_started' });

    const participants = listParticipantsSimple(db, id);
    const n = participants.length;
    if (n < 2) return reply.code(400).send({ status: 'bad_request', message: 'need_at_least_2_participants' });

    const isPow2 = (x) => (x & (x - 1)) === 0;
    if (!isPow2(n)) return reply.code(400).send({ status: 'bad_request', message: 'participants_not_power_of_two' });

    // deterministic seeding: by join order (id asc)
    const tx = db.transaction((tid, seeds) => {
      clearMatches(db, tid);
      let order = 0;
      for (let i = 0; i < seeds.length; i += 2) {
        insertMatch(db, {
          tournament_id: tid,
          round: 1,
          order_index: order++,
          a_participant_id: seeds[i].id,
          b_participant_id: seeds[i + 1].id
        });
      }
      db.prepare(`UPDATE tournament SET status = 'active' WHERE id = ?`).run(tid);
    });

    tx(id, participants);

    const rounds = Math.log2(n);
    const matches_created = n / 2;
    return reply.send({ status: 'active', rounds, matches_created });
  });

  // --- List matches per round ---
  app.get('/:id/matches', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      querystring: listMatchesQuery,
      response: listMatchesResponse
    }
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const round = request.query.round ? Number(request.query.round) : undefined;
    if (round !== undefined && (!Number.isInteger(round) || round < 1)) {
      return reply.code(400).send({ status: 'bad_request' });
    }
    const r = listMatchesByRound(db, id, round);
    if (r.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
    return reply.send(r.rows);
  });
}

module.exports = routes;
