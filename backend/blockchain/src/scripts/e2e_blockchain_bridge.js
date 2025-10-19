/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   e2e_blockchain_bridge.js                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 14:18:19 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 21:04:19 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* eslint-disable no-console */
'use strict';

const https = require('https');
const { URL } = require('url');
const fs = require('fs');

function fetchJSON(url, opts = {}) {
  return fetch(url, {
    ...opts,
    agent: new https.Agent({ rejectUnauthorized: false }), // proxy uses self-signed cert
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
  }).then(async (r) => {
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    if (!r.ok) {
      const e = new Error(`HTTP ${r.status} ${r.statusText}`);
      e.details = json;
      throw e;
    }
    return json;
  });
}

(async () => {
  const iak = process.env.INTERNAL_API_KEY;
  const enabled = process.env.BLOCKCHAIN_REPORT_ENABLED === 'true';
  const apiBase = 'https://localhost/api';

  if (!enabled) {
    console.log('[e2e-bridge] BLOCKCHAIN_REPORT_ENABLED is not true — skipping (exit 0).');
    process.exit(0);
    return;
  }
  if (!iak) {
    console.error('[e2e-bridge] INTERNAL_API_KEY missing');
    process.exit(1);
    return;
  }

  try {
    // 1) Create tournament (draft)
    const t = await fetchJSON(new URL('/tournaments/', apiBase), {
      method: 'POST',
      headers: { 'x-internal-api-key': iak },
      body: JSON.stringify({ name: 'e2e-bridge' }),
    });
    const tid = t.id;
    console.log('[e2e-bridge] tournament id =', tid);

    // 2) Join two participants
    await fetchJSON(new URL(`/tournaments/${tid}/participants`, apiBase), {
      method: 'POST',
      headers: { 'x-internal-api-key': iak },
      body: JSON.stringify({ display_name: 'alice' }),
    });
    await fetchJSON(new URL(`/tournaments/${tid}/participants`, apiBase), {
      method: 'POST',
      headers: { 'x-internal-api-key': iak },
      body: JSON.stringify({ display_name: 'bob' }),
    });

    // 3) Start
    await fetchJSON(new URL(`/tournaments/${tid}/start`, apiBase), {
      method: 'POST',
      headers: { 'x-internal-api-key': iak },
    });

    // 4) Find the only match (round 1)
    const matches = await fetchJSON(new URL(`/tournaments/${tid}/matches?round=1`, apiBase), {
      headers: { 'x-internal-api-key': iak },
    });
    const m = matches[0];

    // 5) Score final (3-1)
    await fetchJSON(new URL(`/tournaments/${tid}/matches/${m.id}/score`, apiBase), {
      method: 'POST',
      headers: { 'x-internal-api-key': iak },
      body: JSON.stringify({ score_a: 3, score_b: 1 }),
    });

    // 6) Read blockchain mock final
    const final = await fetchJSON(new URL(`/blockchain/finals/${tid}`, apiBase), {
      headers: { 'x-internal-api-key': iak },
    });

    console.log('[e2e-bridge] blockchain final:', final);

    // 7) Sanity checks
    if (!final || final.exists !== true) throw new Error('final not recorded on blockchain mock');
    if (!final.winner_alias) throw new Error('missing winner_alias');

    console.log('[e2e-bridge] SUCCESS ✅');
    process.exit(0);
  } catch (err) {
    console.error('[e2e-bridge] FAIL ❌', err && err.message ? err.message : err);
    if (err && err.details) console.error('details:', err.details);
    process.exit(1);
  }
})();

