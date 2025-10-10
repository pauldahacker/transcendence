/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/10 23:02:16 by rzhdanov         ###   ########.fr       */
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

  // Create a temp DB per run so tests are hermetic.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tournaments-test-'));
  const DB_PATH = path.join(tmpDir, 'tournaments.db');

  const optsFastify = {
    logger: false,
    // No TLS needed for inject()
  };

  const { app } = buildFastify(optsFastify, DB_PATH);
  await app.ready();

  const getJson = (res) => {
    try { return res.json(); } catch { return null; }
  };

  try {
    // 0) /health should be up
    {
      const res = await app.inject({ method: 'GET', url: '/health' });
      assert(res.statusCode === 200, `GET /health expected 200, got ${res.statusCode}`);
      const body = getJson(res);
      assert(body && body.status === 'ok', 'GET /health body not ok');
    }

    // 1) /health/db checks DB connectivity
    {
      const res = await app.inject({ method: 'GET', url: '/health/db' });
      assert(res.statusCode === 200, `GET /health/db expected 200, got ${res.statusCode}`);
      const body = getJson(res);
      assert(body && body.status === 'ok', 'GET /health/db body not ok');
    }

    // 2) POST / — happy path create
    let id1;
    {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 11 }
      });
      assert(res.statusCode === 201, `POST / expected 201, got ${res.statusCode}. Body: ${res.body}`);
      const body = getJson(res);
      assert(body && Number.isInteger(body.id) && body.id > 0, 'POST / did not return integer id');
      id1 = body.id;
    }

    // 3) GET /:id — returns the created tournament with expected fields/values
    {
      const res = await app.inject({ method: 'GET', url: `/${id1}` });
      assert(res.statusCode === 200, `GET /:${id1} expected 200, got ${res.statusCode}`);
      const t = getJson(res);
      assert(t && t.id === id1, 'GET /:id wrong id');
      assert(t.mode === 'single_elimination', 'GET /:id wrong mode');
      assert(t.points_to_win === 11, 'GET /:id wrong points_to_win');
      assert(t.status === 'draft', 'GET /:id wrong status (expected draft)');
      assert(typeof t.created_at === 'string' && t.created_at.length > 0, 'GET /:id missing created_at');
      assert(('owner_user_id' in t), 'GET /:id missing owner_user_id');
      assert(t.owner_user_id === null || Number.isInteger(t.owner_user_id), 'owner_user_id must be null or integer');
    }

    // 4) GET /:id — not found
    {
      const res = await app.inject({ method: 'GET', url: '/999999' });
      assert(res.statusCode === 404, `GET /999999 expected 404, got ${res.statusCode}`);
      const body = getJson(res);
      assert(body && body.status === 'not_found', 'GET /999999 wrong body (expected {status:"not_found"})');
    }

    // 5) GET /:id — param validation (min:1)
    {
      const res = await app.inject({ method: 'GET', url: '/0' });
      assert(res.statusCode === 400, `GET /0 expected 400 (params schema), got ${res.statusCode}`);
    }

    // 6) POST / — validation: missing body
    {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: {}
      });
      assert(res.statusCode === 400, `POST / {} expected 400, got ${res.statusCode}`);
    }

    // 7) POST / — validation: invalid mode
    {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'double_elimination', points_to_win: 11 }
      });
      assert(res.statusCode === 400, `POST / invalid mode expected 400, got ${res.statusCode}`);
    }

    // 8) POST / — validation: points_to_win boundaries
    {
      const tooSmall = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 0 }
      });
      assert(tooSmall.statusCode === 400, `POST / points_to_win=0 expected 400, got ${tooSmall.statusCode}`);

      const tooBig = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 22 }
      });
      assert(tooBig.statusCode === 400, `POST / points_to_win=22 expected 400, got ${tooBig.statusCode}`);
    }

    // 9) POST / — owner_user_id validation under current AJV (type coercion ON)
    // Numeric string like "42" is coerced → OK (201).
    {
      const goodNull = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: null }
      });
      assert(goodNull.statusCode === 201, `POST / owner_user_id=null expected 201, got ${goodNull.statusCode}`);

      const goodInt = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: 42 }
      });
      assert(goodInt.statusCode === 201, `POST / owner_user_id=42 expected 201, got ${goodInt.statusCode}`);

      // AJV with coerceTypes allows numeric strings → OK
      const numericString = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: "42" }
      });
      assert(numericString.statusCode === 201, `POST / owner_user_id="42" expected 201 (coerced), got ${numericString.statusCode}`);

      // Truly invalid type should still 400
      const badString = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: "forty-two" }
      });
      assert(badString.statusCode === 400, `POST / owner_user_id="forty-two" expected 400, got ${badString.statusCode}`);
    }

    // 10) Content-Type sanity (basic)
    {
      const res = await app.inject({ method: 'GET', url: `/${id1}` });
      const ct = res.headers['content-type'] || '';
      assert(ct.includes('application/json'), `Expected JSON content-type, got ${ct}`);
    }

    console.log('✅ Tournaments service tests passed');
    await app.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    process.exit(0);
  } catch (err) {
    console.error('❌ Tournaments tests failed:', err.message);
    try { await app.close(); } catch {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    process.exit(1);
  }
})();
