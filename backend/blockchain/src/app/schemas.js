/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   schemas.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/16 23:10:41 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// finals POST body validation
const finalsPostSchema = {
  type: 'object',
  required: ['tournament_id', 'winner_alias', 'score_a', 'score_b', 'points_to_win'],
  additionalProperties: false,
  properties: {
    tournament_id: { type: 'integer', minimum: 1 },
    winner_alias: { type: 'string', minLength: 1, maxLength: 64 },
    score_a: { type: 'integer', minimum: 0, maximum: 255 },
    score_b: { type: 'integer', minimum: 0, maximum: 255 },
    points_to_win: { type: 'integer', minimum: 1, maximum: 255 }
  }
};

module.exports = { finalsPostSchema };
