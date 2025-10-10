/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 00:17:06 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';
const schemas = require('./schemas');
const { repo } = require('./repo');

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


// simple SELECT to check if db is connected properlly 
  app.get('/health/db', async (request, reply) => {
    try {
      db.prepare('SELECT 1').get();
      return reply.send({ status: 'ok' });
    } catch (err) {
      request?.log?.error?.(err);
      return reply.code(500).send({ status: 'error' });
    }
  });

  // POST /tournaments/:id/participants
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

  // GET /tournaments/:id/participants
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

  // DELETE /tournaments/:id/participants/:pid
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
}

module.exports = routes;
