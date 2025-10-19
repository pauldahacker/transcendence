/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chain.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/17 22:03:44 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 15:34:30 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

// mock store for finals in memory
const _store = new Map();

function isEnabled() {
  return process.env.BLOCKCHAIN_ENABLED === 'true';
}

/**
 * a mock record stores the final inn memory and returns a mock transcation hash
 * will switch to calling a real contract after everything is enabled and configured 
 *
 * @param {Object} p
 * @param {number} p.tournament_id
 * @param {string} p.winner_alias
 * @param {number} p.score_a
 * @param {number} p.score_b
 * @param {number} p.points_to_win
 * @returns {Promise<{ txHash: string }>}
 */
async function recordFinal(p) {
  const id = Number(p.tournament_id);
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('bad_tournament_id');
    err.code = 'BAD_ID';
    throw err;
  }
  // guard for idempotency
  if (_store.has(id)) {
    const err = new Error('already_recorded');
    err.code = 'ALREADY_RECORDED';
    throw err;
  }
  _store.set(id, {
    winner_alias: String(p.winner_alias),
    score_a: Number(p.score_a),
    score_b: Number(p.score_b),
    points_to_win: Number(p.points_to_win),
  });
  // for the moment we always return a mock transaction hash 
  // (even if BLOCKCHAIN_ENABLED is true).
  // whe real-chain calls is wired this behaviour will be changed
  return { txHash: `0xmock_${id}_${Date.now()}` };
}

/**
 * Mock read: returns stored final or null.
 * Later, when enabled, will read from the chain.
 *
 * @param {number} tournamentId
 * @returns {Promise<null | { winner_alias:string, score_a:number, score_b:number, points_to_win:number }>}
 */
async function getFinal(tournamentId) {
  const id = Number(tournamentId);
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('bad_tournament_id');
    err.code = 'BAD_ID';
    throw err;
  }
  return _store.get(id) || null;
}

module.exports = { isEnabled, recordFinal, getFinal, _store };
