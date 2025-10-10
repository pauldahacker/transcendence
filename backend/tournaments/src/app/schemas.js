/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   schemas.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/10 23:05:28 by rzhdanov         ###   ########.fr       */
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

// Common error shapes for response schemas for routes

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

// Exports

module.exports = {
  // tournaments
  tournamentCreateSchema,
  tournamentEntity,
  // errors
  notFoundSchema,
  conflictSchema,
  // participants
  participantEntity,
  postParticipantBody,
  postParticipantResponse,
  listParticipantsResponse,
  deleteParticipantResponse,
};


