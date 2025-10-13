/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   schemas.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 11:46:06 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

// Tournament

const tournamentCreateSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['mode', 'points_to_win'],
  properties: {
    mode: { type: 'string', enum: ['single_elimination'] },
    points_to_win: { type: 'integer', minimum: 1, maximum: 21 },
    owner_user_id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  },
};

const tournamentEntity = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'integer' },
    owner_user_id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    mode: { type: 'string', enum: ['single_elimination'] },
    points_to_win: { type: 'integer' },
    status: { type: 'string', enum: ['draft', 'active', 'completed'] },
    created_at: { type: 'string' }, // ISO text
  },
};

// Common error shapes

const notFoundSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status'],
  properties: { status: { type: 'string', const: 'not_found' } },
};

const conflictSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['status'],
  properties: {
    status: { type: 'string', const: 'conflict' },
    message: { type: 'string' },
  },
};

const badRequestSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['status'],
  properties: {
    status: { type: 'string', const: 'bad_request' },
    message: { type: 'string' },
  },
};

// Participants

const participantEntity = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'tournament_id', 'display_name', 'joined_at', 'is_bot'],
  properties: {
    id: { type: 'integer' },
    tournament_id: { type: 'integer' },
    display_name: { type: 'string', minLength: 1, maxLength: 64 },
    joined_at: { type: 'string' }, // ISO text
    is_bot: { type: 'boolean' },
  },
};

const postParticipantBody = {
  type: 'object',
  additionalProperties: false,
  required: ['display_name'],
  properties: {
    display_name: { type: 'string', minLength: 1, maxLength: 64 },
    is_bot: { type: 'boolean', default: false },
  },
};

const postParticipantResponse = {
  201: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'integer' } },
  },
  404: notFoundSchema,
  409: conflictSchema,
};

const listParticipantsResponse = {
  200: { type: 'array', items: participantEntity },
  404: notFoundSchema,
};

const deleteParticipantResponse = {
  204: { type: 'null' },
  404: notFoundSchema,
};

// Matches

const matchEntity = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id', 'tournament_id', 'round', 'order_index',
    'a_participant_id', 'b_participant_id',
    'status', 'score_a', 'score_b', 'winner_participant_id', 'updated_at'
  ],
  properties: {
    id: { type: 'integer' },
    tournament_id: { type: 'integer' },
    round: { type: 'integer', minimum: 1 },
    order_index: { type: 'integer', minimum: 0 },
    a_participant_id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    b_participant_id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    status: { type: 'string', enum: ['scheduled', 'in_progress', 'finished'] },
    score_a: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    score_b: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    winner_participant_id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    updated_at: { type: 'string' },
  },
};

const startTournamentResponse = {
  200: {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'rounds', 'matches_created'],
    properties: {
      status: { type: 'string', const: 'active' },
      rounds: { type: 'integer', minimum: 1 },
      matches_created: { type: 'integer', minimum: 1 },
    },
  },
  400: badRequestSchema,
  404: notFoundSchema,
  409: conflictSchema,
};

const listMatchesQuery = {
  type: 'object',
  additionalProperties: false,
  properties: { round: { type: 'integer', minimum: 1 } },
};

const listMatchesResponse = {
  200: { type: 'array', items: matchEntity },
  404: notFoundSchema,
};

// Optional: params schemas for consistent 400s on invalid path params

const idParams = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
};

const idPidParams = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'pid'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    pid: { type: 'integer', minimum: 1 },
  },
};

// --- Scoring + Next schemas ---

// POST /:id/matches/:mid/score
const scoreMatchBody = {
  type: 'object',
  additionalProperties: false,
  required: ['score_a', 'score_b'],
  properties: {
    score_a: { type: 'integer', minimum: 0 },
    score_b: { type: 'integer', minimum: 0 }
  }
};

const scoreMatchResponse = {
  200: matchEntity,          // finished match
  400: badRequestSchema,     // e.g. tie not allowed, invalid state, etc.
  404: notFoundSchema,       // tournament or match not found
  409: conflictSchema        // match already finished
};

// GET /:id/next
const nextMatchResponse = {
  200: matchEntity,          // the next scheduled match
  204: { type: 'null' },     // no scheduled matches remaining
  404: notFoundSchema
};


// Exports

module.exports = {
  // tournaments
  tournamentCreateSchema,
  tournamentEntity,

  // errors
  notFoundSchema,
  conflictSchema,
  badRequestSchema,

  // participants
  participantEntity,
  postParticipantBody,
  postParticipantResponse,
  listParticipantsResponse,
  deleteParticipantResponse,

  // matches
  matchEntity,
  startTournamentResponse,
  listMatchesQuery,
  listMatchesResponse,

  // scoring + next
  scoreMatchBody,
  scoreMatchResponse,
  nextMatchResponse,

  // params 
  idParams,
  idPidParams,
};

