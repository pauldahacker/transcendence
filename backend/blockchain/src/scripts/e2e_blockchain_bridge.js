/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   e2e_blockchain_bridge.js                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 14:18:19 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 22:33:29 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const https = require('https');

function reqJSON(method, path, body, headers = {}) {
  const opts = {
    method,
    hostname: 'localhost',
    port: 443,
    path,
    rejectUnauthorized: false, // dev certs
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: json, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    console.error('[bridge] INTERNAL_API_KEY missing');
    process.exit(2);
  }

  const tid = Math.floor(Math.random() * 1e6) + 1;

  const post = await reqJSON(
    'POST',
    '/api/blockchain/finals',
    { tournament_id: tid, winner_alias: 'bridge-smoke', score_a: 3, score_b: 1, points_to_win: 3 },
    { 'x-internal-api-key': key }
  );

  if (post.status !== 201 || !post.body || typeof post.body.txHash !== 'string') {
    console.error('[bridge] POST /finals failed', post);
    process.exit(3);
  }

  const get = await reqJSON(
    'GET',
    `/api/blockchain/finals/${tid}`,
    null,
    { 'x-internal-api-key': key }
  );

  if (get.status !== 200 || !get.body || get.body.winner_alias !== 'bridge-smoke') {
    console.error('[bridge] GET /finals/:id failed', get);
    process.exit(4);
  }

  console.log('[bridge] ok:', { tid, txHash: post.body.txHash });
  process.exit(0);
})().catch((e) => {
  console.error('[bridge] crashed:', e && e.message ? e.message : e);
  process.exit(1);
});
