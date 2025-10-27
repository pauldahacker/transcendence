/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/28 00:00:06 by rzhdanov         ###   ########.fr       */
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
const { scoreMatchBody, scoreMatchResponse } = require('./schemas');
const { finishMatchAndAdvance, getMatchById, getParticipantsUserIds } = require('./repo');
const { nextMatchResponse } = require('./schemas');
const { getNextScheduledMatch } = require('./repo');
const { reportFinalIfEnabled } = require('./blockchainReporter');
// const REPORT_GUEST_AS_ZERO = String(process.env.REPORT_GUEST_AS_ZERO || 'true') === 'true';
const reportGuestAsZero = () => String(process.env.REPORT_GUEST_AS_ZERO || 'true') === 'true';

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
    const { display_name, is_bot = false, user_id = null } = request.body;
    const res = r.insertParticipant(tid, { display_name, is_bot, user_id });
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
  
  // POST /:id/matches/:mid/score
  app.route({
    method: 'POST',
    url: '/:id/matches/:mid/score',
    schema: {
      params: {
        type: 'object',
        required: ['id', 'mid'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          mid: { type: 'integer', minimum: 1 }
        }
      },
      body: scoreMatchBody,
      response: scoreMatchResponse
    },
    handler: async (req, reply) => {
      const id = Number(req.params.id);
      const mid = Number(req.params.mid);
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(mid) || mid < 1) {
        return reply.code(400).send({ status: 'bad_request' });
      }

      const { score_a, score_b } = req.body;

      const r = finishMatchAndAdvance(db, id, mid, score_a, score_b);

      if (r && r.error) {
        if (r.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
        if (r.error === 'conflict') return reply.code(409).send({ status: 'conflict', message: r.message || 'conflict' });
        if (r.error === 'bad_request') return reply.code(400).send({ status: 'bad_request', message: r.message });
        // Fallback
        return reply.code(400).send({ status: 'bad_request' });
      }
      // report to Users service if both users are known. send 200 after that anyway
      try {
        // reload match to get participant IDs (a/b)
        const { match } = getMatchById(db, id, mid);
        if (match && match.a_participant_id && match.b_participant_id) {
          const { aUserId, bUserId } = getParticipantsUserIds(db, match.a_participant_id, match.b_participant_id);

          // check if at least one user is real
          const aIsUser = Number.isInteger(aUserId) && aUserId != 0;
          const bIsUser = Number.isInteger(bUserId) && bUserId != 0;
          if (aIsUser && bIsUser) {
            const winnerPid = match.winner_participant_id;
            const winnerIsA = (winnerPid === match.a_participant_id);
            const winnerUserId = winnerIsA ? aUserId : bUserId;
            const loserUserId  = winnerIsA ? bUserId : aUserId;

            const payload = {
              tournament_id: id,
              match_id: match.id,
              match_date: new Date().toISOString(),
              a_participant_id: match.a_participant_id,
              b_participant_id: match.b_participant_id,
              a_participant_score: match.score_a,
              b_participant_score: match.score_b,
              winner_id: winnerUserId,
              loser_id: loserUserId,
            };

            await fetch(`https://api:${process.env.API_PORT}/users/match`, {
              method: 'POST',
              headers: {
                'x-internal-api-key': String(process.env.INTERNAL_API_KEY || ''),
                'content-type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          }
          else if (reportGuestAsZero() && (aIsUser || bIsUser)) {
            //one is real one is bot/ guest
            const winnerPid = match.winner_participant_id;
            const winnerIsA = (winnerPid === match.a_participant_id);

            // winner and loser usre IDs with0 as placeholder for guest or bot
            const winnerUserId = winnerIsA ? (aIsUser ? aUserId : 0) : (bIsUser ? bUserId : 0);
            const loserUserId  = winnerIsA ? (bIsUser ? bUserId : 0) : (aIsUser ? aUserId : 0);

            const payload = {
              tournament_id: id,
              match_id: match.id,
              match_date: new Date().toISOString(),
              a_participant_id: match.a_participant_id,
              b_participant_id: match.b_participant_id,
              a_participant_score: match.score_a,
              b_participant_score: match.score_b,
              winner_id: winnerUserId,
              loser_id: loserUserId,
              
            };

            const url = `https://api:${process.env.API_PORT}/users/match`;
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'x-internal-api-key': String(process.env.INTERNAL_API_KEY || ''),
                'content-type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              req.log?.warn?.({ status: res.status }, 'users/match failed');
            }
          } else {
            // both sides are guests / bots OR REPORT_GUEST_AS_ZERO is set to false, so nothing to report
            // if for some reason we wnat to keep loggin such matches too we will have to chnage this part
            // this will mean we will need and extra table with results  fo suc matches that
            // we will probably join with the main table of tournaments resulsts 
    
            req.log?.info?.({ matchId: match.id }, 'users/match skipped: no real users in this match');
          }
        }
      } catch (err) {
        req.log?.warn?.({ err }, 'users/match reporting threw');
      }
      try {
        //  after the match check: if no scheduled matches remain, this was the final
        const next = getNextScheduledMatch(db, id);
        const wasFinal = next && next.none === true;
        const winnerPid = r.match?.winner_participant_id;
        if (wasFinal && Number.isInteger(winnerPid)) {
          // resolve winner display name from participants list
          const participants = listParticipantsSimple(db, id);
          const winner = Array.isArray(participants)
            ? participants.find((p) => p.id === winnerPid)
            : null;

          const winnerAlias = winner?.display_name || String(winnerPid);
          const pointsToWin = Math.max(Number(score_a), Number(score_b));

          // fire and forget (no interference with outer code flow)
          reportFinalIfEnabled({
            tournament_id: id,
            winner_alias: winnerAlias,
            score_a: Number(score_a),
            score_b: Number(score_b),
            points_to_win: Number(pointsToWin),
          }, req.log);
        }
      } catch (e) {
        // future proof: if something changes, flag removed or anything else we still know
        // smth is not correcrt while the outer code shoould still proceed
        req?.log?.error?.({ err: e }, 'blockchain reporter threw unexpectedly');
      }
      return reply.code(200).send(r.match);
    }
  });

  // GET /:id/next
  app.route({
    method: 'GET',
    url: '/:id/next',
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      response: nextMatchResponse
    },
    handler: async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ status: 'bad_request' });
      }
      const r = getNextScheduledMatch(db, id);
      if (r && r.error === 'not_found') return reply.code(404).send({ status: 'not_found' });
      if (r && r.none) return reply.code(204).send();
      return reply.code(200).send(r.match);
    }
  });
}

module.exports = routes;
