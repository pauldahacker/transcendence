/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   schemas.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/10 02:21:31 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

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
    created_at: { type: 'string' },
  },
};

module.exports = {
  tournamentCreateSchema,
  tournamentEntity,
};
