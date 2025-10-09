/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/10 02:14:26 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });

(async () => {
  const { buildFastify } = require('./app/app');

  // Make a throwaway DB file per run
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tournaments-test-'));
  const DB_PATH = path.join(tmpDir, 'tournaments.db');

  const optsFastify = {
    logger: false,
    https: {
      // inject() doesn’t hit TLS, but Fastify still expects https opts if server was built with them.
      // We omit https entirely for in-process tests by not passing it here.
    }
  };

  const { app } = buildFastify(optsFastify, DB_PATH);
  await app.ready();

  try {
    // 1) health/db
    {
      const res = await app.inject({ method: 'GET', url: '/health/db' });
      assert(res.statusCode === 200, `health/db expected 200, got ${res.statusCode}`);
      const body = res.json();
      assert(body && body.status === 'ok', 'health/db body not ok');
    }

    // 2) create tournament (valid)
    let createdId;
    {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        payload: { mode: 'single_elimination', points_to_win: 11 },
        headers: { 'content-type': 'application/json' },
      });
      assert(res.statusCode === 201, `POST / expected 201, got ${res.statusCode}. Body: ${res.body}`);
      const body = res.json();
      assert(body && Number.isInteger(body.id) && body.id > 0, 'POST / did not return integer id');
      createdId = body.id;
    }

    // 3) get tournament by id (exists)
    {
      const res = await app.inject({ method: 'GET', url: `/${createdId}` });
      assert(res.statusCode === 200, `GET /:id expected 200, got ${res.statusCode}`);
      const body = res.json();
      assert(body.id === createdId, 'GET /:id returned wrong id');
      assert(body.mode === 'single_elimination', 'GET /:id wrong mode');
      assert(body.points_to_win === 11, 'GET /:id wrong points_to_win');
      assert(body.status === 'draft', 'GET /:id wrong status');
      assert(typeof body.created_at === 'string', 'GET /:id missing created_at');
    }

    // 4) get tournament by id (not found)
    {
      const res = await app.inject({ method: 'GET', url: `/999999` });
      assert(res.statusCode === 404, `GET /999999 expected 404, got ${res.statusCode}`);
      const body = res.json();
      assert(body && body.status === 'not_found', 'GET /999999 wrong body');
    }

    // 5) validation: points_to_win out of range -> 400
    {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        payload: { mode: 'single_elimination', points_to_win: 999 },
        headers: { 'content-type': 'application/json' },
      });
      assert(res.statusCode === 400, `POST / (bad value) expected 400, got ${res.statusCode}`);
    }

    console.log('✅ Tournaments unit tests passed');
    await app.close();
    // Cleanup DB file
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    process.exit(0);
  } catch (err) {
    console.error('❌ Step 4 tests failed:', err.message);
    try { await app.close(); } catch {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    process.exit(1);
  }
})();
