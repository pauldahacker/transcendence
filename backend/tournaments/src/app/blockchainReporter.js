/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   blockchainReporter.js                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/17 11:25:26 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const https = require('https');
const { URL } = require('url');

// a small fetch wrapper allowing an https.Agent override
async function doFetch(url, opts) {
  // passthrough to global fetch, with agent if provided
  // opts.agent should be an https.Agent when using self-signed certs in dev
  return fetch(url, opts);
}

/**
 * Report tournament final to blockchain service via API gateway.
 * Safe: returns void, swallows errors, no-ops if disabled.
 *
 * @param {Object} p
 * @param {number} p.tournament_id
 * @param {string} p.winner_alias
 * @param {number} p.score_a
 * @param {number} p.score_b
 * @param {number} p.points_to_win
 */
async function reportFinalIfEnabled(p, log = console) {
  try {
    if (process.env.BLOCKCHAIN_REPORT_ENABLED !== 'true') return; // feature flag off

    const {
      INTERNAL_API_KEY,
      BLOCKCHAIN_API_BASE,
      API_PORT,
      INTERNAL_DEV_SKIP_TLS_VERIFY
    } = process.env;

    if (!INTERNAL_API_KEY) {
      log.warn?.('[blockchainReporter] INTERNAL_API_KEY is missing; skipping report');
      return;
    }

    // Default  to API gateway inside the docker netwokr
    const base = BLOCKCHAIN_API_BASE || (API_PORT ? `https://api:${API_PORT}` : 'https://api:3000');

    const target = new URL('/api/blockchain/finals', base).toString();

    // avoid TLS verify if necessary (for slef signed certs in dev mode)
    const agent = new https.Agent({
      rejectUnauthorized: INTERNAL_DEV_SKIP_TLS_VERIFY === 'true' ? false : true,
    });

    const res = await doFetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-api-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        tournament_id: p.tournament_id,
        winner_alias: p.winner_alias,
        score_a: p.score_a,
        score_b: p.score_b,
        points_to_win: p.points_to_win,
      }),
      // pass the agent to handle self-signed certs
      agent,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      log.warn?.('[blockchainReporter] non-2xx response', { status: res.status, text });
      return;
    }

    // optional: read transaction hash for logs
    const body = await res.json().catch(() => ({}));
    log.info?.('[blockchainReporter] reported final', { tournament_id: p.tournament_id, txHash: body.txHash });
  } catch (err) {
    // disregard errors not to  impact the tournament flow
    log.error?.('[blockchainReporter] report failure', { err: err && err.message ? err.message : err });
  }
}

module.exports = { reportFinalIfEnabled };
