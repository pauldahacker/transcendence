/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 23:29:49 by rzhdanov         ###   ########.fr       */
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
  // repo-level participants API
  const {
    insertParticipant,
    listParticipants,
    deleteParticipant,
    listParticipantsSimple
  } = require('./app/repo');

  // Create a temp DB per run so tests are hermetic.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tournaments-test-'));
  const DB_PATH = path.join(tmpDir, 'tournaments.db');

  const optsFastify = { logger: false };

  const { app, db } = buildFastify(optsFastify, DB_PATH);
  await app.ready();

  const getJson = (res) => {
    try { return res.json(); } catch { return null; }
  };

  try {
    // ---------------------------
    // Service health checks
    // ---------------------------
    {
      const res = await app.inject({ method: 'GET', url: '/health' });
      assert(res.statusCode === 200, `GET /health expected 200, got ${res.statusCode}`);
      const body = getJson(res);
      assert(body && body.status === 'ok', 'GET /health body not ok');
    }

    {
      const res = await app.inject({ method: 'GET', url: '/health/db' });
      assert(res.statusCode === 200, `GET /health/db expected 200, got ${res.statusCode}`);
      const body = getJson(res);
      assert(body && body.status === 'ok', 'GET /health/db body not ok');
    }

    // ---------------------------
    // Tournaments: POST /  + GET /:id
    // ---------------------------
    let tid;
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
      tid = body.id;
    }

    {
      const res = await app.inject({ method: 'GET', url: `/${tid}` });
      assert(res.statusCode === 200, `GET /:${tid} expected 200, got ${res.statusCode}`);
      const t = getJson(res);
      assert(t && t.id === tid, 'GET /:id wrong id');
      assert(t.mode === 'single_elimination', 'GET /:id wrong mode');
      assert(t.points_to_win === 11, 'GET /:id wrong points_to_win');
      assert(t.status === 'draft', 'GET /:id wrong status');
      assert(typeof t.created_at === 'string' && t.created_at.length > 0, 'GET /:id missing created_at');
      assert(('owner_user_id' in t), 'GET /:id missing owner_user_id');
      assert(t.owner_user_id === null || Number.isInteger(t.owner_user_id), 'owner_user_id must be null or integer');
    }

    // Not found + param validation
    {
      const res404 = await app.inject({ method: 'GET', url: '/999999' });
      assert(res404.statusCode === 404, `GET /999999 expected 404, got ${res404.statusCode}`);
      const body = getJson(res404);
      assert(body && body.status === 'not_found', 'GET /999999 wrong body');

      const res400 = await app.inject({ method: 'GET', url: '/0' });
      assert(res400.statusCode === 400, `GET /0 expected 400, got ${res400.statusCode}`);
    }

    // POST / validation cases
    {
      const missing = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: {}
      });
      assert(missing.statusCode === 400, `POST / {} expected 400, got ${missing.statusCode}`);

      const badMode = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'double_elimination', points_to_win: 11 }
      });
      assert(badMode.statusCode === 400, `POST / invalid mode expected 400, got ${badMode.statusCode}`);

      const tooSmall = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 0 }
      });
      assert(tooSmall.statusCode === 400, `POST / points_to_win=0 expected 400, got ${tooSmall.statusCode}`);

      const tooBig = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 22 }
      });
      assert(tooBig.statusCode === 400, `POST / points_to_win=22 expected 400, got ${tooBig.statusCode}`);

      // AJV with coerceTypes → numeric string OK
      const numericString = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: "42" }
      });
      assert(numericString.statusCode === 201, `POST / owner_user_id="42" expected 201 (coerced), got ${numericString.statusCode}`);

      // Truly invalid type
      const badString = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: "forty-two" }
      });
      assert(badString.statusCode === 400, `POST / owner_user_id="forty-two" expected 400, got ${badString.statusCode}`);
    }

    // ---------------------------
    // Participants (repo-level tests)
    // ---------------------------
    {
      // Empty list initially
      const list0 = listParticipants(db, tid);
      assert(!list0.error, `listParticipants error: ${list0.error}`);
      assert(Array.isArray(list0.rows) && list0.rows.length === 0, 'Expected 0 participants initially');

      // Insert first participant
      const p1 = insertParticipant(db, tid, { display_name: 'Alice', is_bot: false });
      assert(!p1.error && Number.isInteger(p1.id), `insertParticipant Alice failed: ${p1.error || 'no id'}`);

      // Insert second participant (bot)
      const p2 = insertParticipant(db, tid, { display_name: 'Bot_1', is_bot: true });
      assert(!p2.error && Number.isInteger(p2.id), `insertParticipant Bot_1 failed: ${p2.error || 'no id'}`);

      // List should have 2, with booleans normalized
      const list2 = listParticipants(db, tid);
      assert(!list2.error && list2.rows.length === 2, `Expected 2 participants, got ${list2.rows.length}`);
      const alice = list2.rows.find(r => r.display_name === 'Alice');
      const bot1  = list2.rows.find(r => r.display_name === 'Bot_1');
      assert(alice && bot1, 'Participants not found after insert');
      assert(alice.is_bot === false && bot1.is_bot === true, 'is_bot normalization failed');

      // Unique constraint on (tournament_id, display_name)
      const dupe = insertParticipant(db, tid, { display_name: 'Alice' });
      assert(dupe.error === 'conflict', `Expected conflict on duplicate display_name, got ${dupe.error}`);

      // Delete: wrong tournament or id → not_found
      const nf1 = deleteParticipant(db, 999999, p1.id);
      assert(nf1.error === 'not_found', 'Expected not_found on wrong tournament');
      const nf2 = deleteParticipant(db, tid, 999999);
      assert(nf2.error === 'not_found', 'Expected not_found on wrong participant');

      // Delete valid, then list = 1
      const delOk = deleteParticipant(db, tid, p1.id);
      assert(delOk.ok === true, 'Expected ok on delete');
      const list1 = listParticipants(db, tid);
      assert(list1.rows.length === 1 && list1.rows[0].id === p2.id, 'Delete did not remove the right record');
    }

    // ---------------------------
    // Participants (HTTP routes)
    // ---------------------------
    {
      // Use a fresh tournament so these tests don't interfere with repo-level ones.
      let tid2;
      {
        const res = await app.inject({
          method: 'POST',
          url: '/',
          headers: { 'content-type': 'application/json' },
          payload: { mode: 'single_elimination', points_to_win: 11 }
        });
        assert(res.statusCode === 201, `POST / (tid2) expected 201, got ${res.statusCode}`);
        tid2 = getJson(res).id;
      }

      // Join → 201 { id }
      let pid;
      {
        const res = await app.inject({
          method: 'POST',
          url: `/${tid2}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: 'Alice' }
        });
        assert(res.statusCode === 201, `POST /:id/participants expected 201, got ${res.statusCode}`);
        const body = getJson(res);
        assert(body && Number.isInteger(body.id) && body.id > 0, 'POST /:id/participants did not return integer id');
        pid = body.id;
      }

      // List → contains Alice
      {
        const res = await app.inject({ method: 'GET', url: `/${tid2}/participants` });
        assert(res.statusCode === 200, `GET /:id/participants expected 200, got ${res.statusCode}`);
        const arr = getJson(res);
        assert(Array.isArray(arr) && arr.length === 1, 'GET /:id/participants should have 1 item');
        assert(arr[0].display_name === 'Alice' && arr[0].is_bot === false, 'Participant fields mismatch');
      }

      // Duplicate alias → 409
      {
        const res = await app.inject({
          method: 'POST',
          url: `/${tid2}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: 'Alice' }
        });
        assert(res.statusCode === 409, `Duplicate alias should return 409, got ${res.statusCode}`);
      }

      // Unknown tournament → 404
      {
        const res = await app.inject({ method: 'GET', url: '/999999/participants' });
        assert(res.statusCode === 404, `Unknown tournament list should return 404, got ${res.statusCode}`);
      }

      // Delete existing → 204
      {
        const res = await app.inject({ method: 'DELETE', url: `/${tid2}/participants/${pid}` });
        assert(res.statusCode === 204, `DELETE /:id/participants/:pid expected 204, got ${res.statusCode}`);
      }

      // List again → empty
      {
        const res = await app.inject({ method: 'GET', url: `/${tid2}/participants` });
        assert(res.statusCode === 200, `GET /:id/participants after delete expected 200, got ${res.statusCode}`);
        const arr = getJson(res);
        assert(Array.isArray(arr) && arr.length === 0, 'Participants should be empty after delete');
      }

      // Delete non-existent → 404
      {
        const res = await app.inject({ method: 'DELETE', url: `/${tid2}/participants/999999` });
        assert(res.statusCode === 404, `DELETE unknown participant should return 404, got ${res.statusCode}`);
      }
    }

    // Content-Type sanity (basic)
    {
      const res = await app.inject({ method: 'GET', url: `/${tid}` });
      const ct = res.headers['content-type'] || '';
      assert(ct.includes('application/json'), `Expected JSON content-type, got ${ct}`);
    }

    // ---------------------------
    // Repo helper listParticipantsSimple after HTTP joins
    // ---------------------------
    {
      // fresh tournament
      const res = await app.inject({
        method: 'POST',
        url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 11 }
      });
      assert(res.statusCode === 201, `POST / (simple) expected 201, got ${res.statusCode}`);
      const tidSimple = getJson(res).id;

      // join two participants via HTTP routes
      for (const name of ['A', 'B']) {
        const j = await app.inject({
          method: 'POST',
          url: `/${tidSimple}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: name }
        });
        assert(j.statusCode === 201, `join ${name} failed with ${j.statusCode}`);
      }

      // repo helper should observe 2 rows in insertion order
      const rows = listParticipantsSimple(db, tidSimple);
      assert(Array.isArray(rows) && rows.length === 2, `listParticipantsSimple expected 2, got ${rows.length}`);
      assert(rows[0].display_name === 'A' && rows[1].display_name === 'B', 'names/order mismatch in listParticipantsSimple');
    }
    // ---------------------------
    // Start tournament + list matches
    // ---------------------------
    {
      // fresh tournament with 4 participants
      const resT = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 11 }
      });
      assert(resT.statusCode === 201, `POST / (start) expected 201, got ${resT.statusCode}`);
      const tid3 = getJson(resT).id;

      for (const name of ['A','B','C','D']) {
        const p = await app.inject({
          method: 'POST', url: `/${tid3}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: name }
        });
        assert(p.statusCode === 201, `join ${name} failed`);
      }

      // start → 200 { status:"active", rounds:2, matches_created:2 }
      const start = await app.inject({ method: 'POST', url: `/${tid3}/start` });
      assert(start.statusCode === 200, `POST /:id/start expected 200, got ${start.statusCode}`);
      const sbody = getJson(start);
      assert(sbody.status === 'active' && sbody.rounds === 2 && sbody.matches_created === 2, 'start payload mismatch');

      // list round 1 → two scheduled matches ordered
      const r1 = await app.inject({ method: 'GET', url: `/${tid3}/matches?round=1` });
      assert(r1.statusCode === 200, `GET /:id/matches?round=1 expected 200, got ${r1.statusCode}`);
      const m1 = getJson(r1);
      assert(Array.isArray(m1) && m1.length === 2, 'round 1 should have 2 matches');
      assert(m1.every(x => x.status === 'scheduled' && x.round === 1), 'round 1 match fields mismatch');

      // starting again → 409
      const startAgain = await app.inject({ method: 'POST', url: `/${tid3}/start` });
      assert(startAgain.statusCode === 409, `second start should return 409, got ${startAgain.statusCode}`);

      // power-of-two check → create 3-participant tournament
      const resT4 = await app.inject({
        method: 'POST', url: '/',
        headers: { 'content-type': 'application/json' },
        payload: { mode: 'single_elimination', points_to_win: 11 }
      });
      const tid4 = getJson(resT4).id;
      for (const name of ['X','Y','Z']) {
        await app.inject({
          method: 'POST', url: `/${tid4}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: name }
        });
      }
      const startBad = await app.inject({ method: 'POST', url: `/${tid4}/start` });
      assert(startBad.statusCode === 400, `start with 3 participants should 400, got ${startBad.statusCode}`);
    }
    // ---------------------------
    // Blockchain reporter safety (feature-flagged, non-blocking)
    // ---------------------------
    {
      const prev = process.env.BLOCKCHAIN_REPORT_ENABLED;
      process.env.BLOCKCHAIN_REPORT_ENABLED = 'true';
      try {
        // Create a tiny (2 players) tournament and finish it.
        const createRes = await app.inject({
          method: 'POST',
          url: '/',
          headers: { 'content-type': 'application/json' },
          payload: { mode: 'single_elimination', points_to_win: 11 }
        });
        assert(createRes.statusCode === 201, `POST / (reporter) expected 201, got ${createRes.statusCode}`);
        const tidR = getJson(createRes).id;

        // join two participants via HTTP routes
        for (const name of ['alice', 'bob']) {
          const j = await app.inject({
            method: 'POST',
            url: `/${tidR}/participants`,
            headers: { 'content-type': 'application/json' },
            payload: { display_name: name }
          });
          assert(j.statusCode === 201, `join ${name} failed with ${j.statusCode}`);
        }

        // start (single-elim) -> 200
        const startR = await app.inject({ method: 'POST', url: `/${tidR}/start` });
        assert(startR.statusCode === 200, `POST /:${tidR}/start expected 200, got ${startR.statusCode}`);

        // fetch the only match (round 1)
        const matchesRes = await app.inject({ method: 'GET', url: `/${tidR}/matches?round=1` });
        assert(matchesRes.statusCode === 200, `GET /:${tidR}/matches?round=1 expected 200, got ${matchesRes.statusCode}`);
        const [m] = getJson(matchesRes);
        assert(m && Number.isInteger(m.id), 'round 1 match not found');

        // score the final (3-1). The reporter runs (flagged) but must not affect HTTP success.
        const scoreRes = await app.inject({
          method: 'POST',
          url: `/${tidR}/matches/${m.id}/score`,
          headers: { 'content-type': 'application/json' },
          payload: { score_a: 3, score_b: 1 }
        });

        assert(
          scoreRes.statusCode === 200 || scoreRes.statusCode === 204,
          `score final expected 200/204, got ${scoreRes.statusCode}`
        );
        // Optional: sanity-check returned match when 200
        if (scoreRes.statusCode === 200) {
          const scored = getJson(scoreRes);
          assert(scored && scored.status === 'finished', 'expected finished match after scoring');
        }
      } finally {
        // restore flag for the rest of the suite/process
        process.env.BLOCKCHAIN_REPORT_ENABLED = prev;
      }
    // ---------------------------
    // Blockchain reporter timeout + retry (non-blocking, fast return)
    // ---------------------------
    {
      // Save current env to restore later
      const prev = {
        flag: process.env.BLOCKCHAIN_REPORT_ENABLED,
        base: process.env.BLOCKCHAIN_API_BASE,
        timeout: process.env.BLOCKCHAIN_REPORT_TIMEOUT_MS,
        retries: process.env.BLOCKCHAIN_REPORT_RETRIES,
        backoff: process.env.BLOCKCHAIN_REPORT_BACKOFF_MS,
      };

      // Enable reporter, but point at an unreachable port and keep it fast
      process.env.BLOCKCHAIN_REPORT_ENABLED = 'true';
      process.env.BLOCKCHAIN_API_BASE = 'https://localhost:9';  // unreachable
      process.env.BLOCKCHAIN_REPORT_TIMEOUT_MS = '200';          // short per-attempt timeout
      process.env.BLOCKCHAIN_REPORT_RETRIES = '1';               // 1 retry (total 2 attempts)
      process.env.BLOCKCHAIN_REPORT_BACKOFF_MS = '100';          // small backoff

      const { reportFinalIfEnabled } = require('./app/blockchainReporter');

      const start = Date.now();
      // Should swallow errors and return quickly even if unreachable
      await reportFinalIfEnabled({
        tournament_id: 555001,
        winner_alias: 'quick-check',
        score_a: 3,
        score_b: 1,
        points_to_win: 3,
      }, console);
      const elapsed = Date.now() - start;

      // 2 attempts * 200ms + small backoff/jitter < ~1s; keep a generous ceiling
      assert(elapsed < 2000, `reporter took too long (${elapsed}ms), expected < 2000ms`);

      // Restore env
      process.env.BLOCKCHAIN_REPORT_ENABLED = prev.flag;
      process.env.BLOCKCHAIN_API_BASE = prev.base;
      process.env.BLOCKCHAIN_REPORT_TIMEOUT_MS = prev.timeout;
      process.env.BLOCKCHAIN_REPORT_RETRIES = prev.retries;
      process.env.BLOCKCHAIN_REPORT_BACKOFF_MS = prev.backoff;
    }
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


// 'use strict';

// const fs = require('fs');
// const os = require('os');
// const path = require('path');

// // ---------------------------
// // Tiny runner + counters
// // ---------------------------
// const TEST_TOTALS = { tests: 0, passed: 0, failed: 0 };
// let CURRENT_BLOCK = TEST_TOTALS;

// const setCurrentBlock = (stats) => { CURRENT_BLOCK = stats || TEST_TOTALS; };
// const getTotals = () => TEST_TOTALS;

// const assert = (cond, msg = 'Assertion failed') => {
//   CURRENT_BLOCK.tests++; TEST_TOTALS.tests++;
//   if (!cond) {
//     CURRENT_BLOCK.failed++; TEST_TOTALS.failed++;
//     const err = new Error(msg);
//     err._isAssertionFailure = true;
//     throw err;
//   }
//   CURRENT_BLOCK.passed++; TEST_TOTALS.passed++;
// };

// async function runBlock(name, fn) {
//   const stats = { name, tests: 0, passed: 0, failed: 0 };
//   setCurrentBlock(stats);
//   console.log(`\n▶ ${name}`);
//   try {
//     await fn();
//   } catch (err) {
//     if (!err._isAssertionFailure) throw err; // real, unexpected error → bubble up
//   } finally {
//     console.log(
//       `• ${name}: ${stats.passed}/${stats.tests} passed` +
//       (stats.failed ? ` — ${stats.failed} failed` : '')
//     );
//   }
// }

// async function finishSuite({ app, tmpDir }) {
//   const tot = getTotals();
//   console.log(
//     `\n✅ Total: ${tot.passed}/${tot.tests} tests passed` +
//     (tot.failed ? ` — ${tot.failed} failed` : '')
//   );
//   process.exitCode = tot.failed ? 1 : 0;

//   try { await app.close(); } catch {}
//   try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

//   // Mirror original behavior: exit explicitly
//   process.exit(process.exitCode);
// }

// // ---------------------------

// process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });

// (async () => {
//   const { buildFastify } = require('./app/app');
//   const {
//     insertParticipant,
//     listParticipants,
//     deleteParticipant,
//     listParticipantsSimple
//   } = require('./app/repo');

//   // Temp DB per run (hermetic)
//   const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tournaments-test-'));
//   const DB_PATH = path.join(tmpDir, 'tournaments.db');

//   const optsFastify = { logger: false };
//   const { app, db } = buildFastify(optsFastify, DB_PATH);
//   await app.ready();

//   const getJson = (res) => {
//     try { return res.json(); } catch { return null; }
//   };

//   try {
//     let tid; // shared across a few blocks

//     await runBlock('Service health checks', async () => {
//       {
//         const res = await app.inject({ method: 'GET', url: '/health' });
//         assert(res.statusCode === 200, `GET /health expected 200, got ${res.statusCode}`);
//         const body = getJson(res);
//         assert(body && body.status === 'ok', 'GET /health body not ok');
//       }
//       {
//         const res = await app.inject({ method: 'GET', url: '/health/db' });
//         assert(res.statusCode === 200, `GET /health/db expected 200, got ${res.statusCode}`);
//         const body = getJson(res);
//         assert(body && body.status === 'ok', 'GET /health/db body not ok');
//       }
//     });

//     await runBlock('Tournaments: POST / + GET /:id', async () => {
//       {
//         const res = await app.inject({
//           method: 'POST',
//           url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 11 }
//         });
//         assert(res.statusCode === 201, `POST / expected 201, got ${res.statusCode}. Body: ${res.body}`);
//         const body = getJson(res);
//         assert(body && Number.isInteger(body.id) && body.id > 0, 'POST / did not return integer id');
//         tid = body.id;
//       }
//       {
//         const res = await app.inject({ method: 'GET', url: `/${tid}` });
//         assert(res.statusCode === 200, `GET /:${tid} expected 200, got ${res.statusCode}`);
//         const t = getJson(res);
//         assert(t && t.id === tid, 'GET /:id wrong id');
//         assert(t.mode === 'single_elimination', 'GET /:id wrong mode');
//         assert(t.points_to_win === 11, 'GET /:id wrong points_to_win');
//         assert(t.status === 'draft', 'GET /:id wrong status');
//         assert(typeof t.created_at === 'string' && t.created_at.length > 0, 'GET /:id missing created_at');
//         assert(('owner_user_id' in t), 'GET /:id missing owner_user_id');
//         assert(t.owner_user_id === null || Number.isInteger(t.owner_user_id), 'owner_user_id must be null or integer');
//       }
//       // Not found + param validation
//       {
//         const res404 = await app.inject({ method: 'GET', url: '/999999' });
//         assert(res404.statusCode === 404, `GET /999999 expected 404, got ${res404.statusCode}`);
//         const body = getJson(res404);
//         assert(body && body.status === 'not_found', 'GET /999999 wrong body');

//         const res400 = await app.inject({ method: 'GET', url: '/0' });
//         assert(res400.statusCode === 400, `GET /0 expected 400, got ${res400.statusCode}`);
//       }
//       // POST / validation cases
//       {
//         const missing = await app.inject({
//           method: 'POST', url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: {}
//         });
//         assert(missing.statusCode === 400, `POST / {} expected 400, got ${missing.statusCode}`);

//         const badMode = await app.inject({
//           method: 'POST', url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'double_elimination', points_to_win: 11 }
//         });
//         assert(badMode.statusCode === 400, `POST / invalid mode expected 400, got ${badMode.statusCode}`);

//         const tooSmall = await app.inject({
//           method: 'POST', url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 0 }
//         });
//         assert(tooSmall.statusCode === 400, `POST / points_to_win=0 expected 400, got ${tooSmall.statusCode}`);

//         const tooBig = await app.inject({
//           method: 'POST', url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 22 }
//         });
//         assert(tooBig.statusCode === 400, `POST / points_to_win=22 expected 400, got ${tooBig.statusCode}`);

//         // AJV with coerceTypes → numeric string OK
//         const numericString = await app.inject({
//           method: 'POST', url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: "42" }
//         });
//         assert(numericString.statusCode === 201, `POST / owner_user_id="42" expected 201 (coerced), got ${numericString.statusCode}`);

//         // Truly invalid type
//         const badString = await app.inject({
//           method: 'POST', url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 7, owner_user_id: "forty-two" }
//         });
//         assert(badString.statusCode === 400, `POST / owner_user_id="forty-two" expected 400, got ${badString.statusCode}`);
//       }
//     });

//     await runBlock('Participants (repo-level tests)', async () => {
//       // Empty list initially
//       const list0 = listParticipants(db, tid);
//       assert(!list0.error, `listParticipants error: ${list0.error}`);
//       assert(Array.isArray(list0.rows) && list0.rows.length === 0, 'Expected 0 participants initially');

//       // Insert first participant
//       const p1 = insertParticipant(db, tid, { display_name: 'Alice', is_bot: false });
//       assert(!p1.error && Number.isInteger(p1.id), `insertParticipant Alice failed: ${p1.error || 'no id'}`);

//       // Insert second participant (bot)
//       const p2 = insertParticipant(db, tid, { display_name: 'Bot_1', is_bot: true });
//       assert(!p2.error && Number.isInteger(p2.id), `insertParticipant Bot_1 failed: ${p2.error || 'no id'}`);

//       // List should have 2, with booleans normalized
//       const list2 = listParticipants(db, tid);
//       assert(!list2.error && list2.rows.length === 2, `Expected 2 participants, got ${list2.rows.length}`);
//       const alice = list2.rows.find(r => r.display_name === 'Alice');
//       const bot1  = list2.rows.find(r => r.display_name === 'Bot_1');
//       assert(alice && bot1, 'Participants not found after insert');
//       assert(alice.is_bot === false && bot1.is_bot === true, 'is_bot normalization failed');

//       // Unique constraint on (tournament_id, display_name)
//       const dupe = insertParticipant(db, tid, { display_name: 'Alice' });
//       assert(dupe.error === 'conflict', `Expected conflict on duplicate display_name, got ${dupe.error}`);

//       // Delete: wrong tournament or id → not_found
//       const nf1 = deleteParticipant(db, 999999, p1.id);
//       assert(nf1.error === 'not_found', 'Expected not_found on wrong tournament');
//       const nf2 = deleteParticipant(db, tid, 999999);
//       assert(nf2.error === 'not_found', 'Expected not_found on wrong participant');

//       // Delete valid, then list = 1
//       const delOk = deleteParticipant(db, tid, p1.id);
//       assert(delOk.ok === true, 'Expected ok on delete');
//       const list1 = listParticipants(db, tid);
//       assert(list1.rows.length === 1 && list1.rows[0].id === p2.id, 'Delete did not remove the right record');
//     });

//     await runBlock('Participants (HTTP routes)', async () => {
//       // Use a fresh tournament so these tests don't interfere with repo-level ones.
//       let tid2;
//       {
//         const res = await app.inject({
//           method: 'POST',
//           url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 11 }
//         });
//         assert(res.statusCode === 201, `POST / (tid2) expected 201, got ${res.statusCode}`);
//         tid2 = getJson(res).id;
//       }

//       // Join → 201 { id }
//       let pid;
//       {
//         const res = await app.inject({
//           method: 'POST',
//           url: `/${tid2}/participants`,
//           headers: { 'content-type': 'application/json' },
//           payload: { display_name: 'Alice' }
//         });
//         assert(res.statusCode === 201, `POST /:id/participants expected 201, got ${res.statusCode}`);
//         const body = getJson(res);
//         assert(body && Number.isInteger(body.id) && body.id > 0, 'POST /:id/participants did not return integer id');
//         pid = body.id;
//       }

//       // List → contains Alice
//       {
//         const res = await app.inject({ method: 'GET', url: `/${tid2}/participants` });
//         assert(res.statusCode === 200, `GET /:id/participants expected 200, got ${res.statusCode}`);
//         const arr = getJson(res);
//         assert(Array.isArray(arr) && arr.length === 1, 'GET /:id/participants should have 1 item');
//         assert(arr[0].display_name === 'Alice' && arr[0].is_bot === false, 'Participant fields mismatch');
//       }

//       // Duplicate alias → 409
//       {
//         const res = await app.inject({
//           method: 'POST',
//           url: `/${tid2}/participants`,
//           headers: { 'content-type': 'application/json' },
//           payload: { display_name: 'Alice' }
//         });
//         assert(res.statusCode === 409, `Duplicate alias should return 409, got ${res.statusCode}`);
//       }

//       // Unknown tournament → 404
//       {
//         const res = await app.inject({ method: 'GET', url: '/999999/participants' });
//         assert(res.statusCode === 404, `Unknown tournament list should return 404, got ${res.statusCode}`);
//       }

//       // Delete existing → 204
//       {
//         const res = await app.inject({ method: 'DELETE', url: `/${tid2}/participants/${pid}` });
//         assert(res.statusCode === 204, `DELETE /:id/participants/:pid expected 204, got ${res.statusCode}`);
//       }

//       // List again → empty
//       {
//         const res = await app.inject({ method: 'GET', url: `/${tid2}/participants` });
//         assert(res.statusCode === 200, `GET /:id/participants after delete expected 200, got ${res.statusCode}`);
//         const arr = getJson(res);
//         assert(Array.isArray(arr) && arr.length === 0, 'Participants should be empty after delete');
//       }

//       // Delete non-existent → 404
//       {
//         const res = await app.inject({ method: 'DELETE', url: `/${tid2}/participants/999999` });
//         assert(res.statusCode === 404, `DELETE unknown participant should return 404, got ${res.statusCode}`);
//       }
//     });

//     await runBlock('Content-Type sanity (basic)', async () => {
//       const res = await app.inject({ method: 'GET', url: `/${tid}` });
//       const ct = res.headers['content-type'] || '';
//       assert(ct.includes('application/json'), `Expected JSON content-type, got ${ct}`);
//     });

//     await runBlock('Repo helper listParticipantsSimple after HTTP joins', async () => {
//       // fresh tournament
//       const res = await app.inject({
//         method: 'POST',
//         url: '/',
//         headers: { 'content-type': 'application/json' },
//         payload: { mode: 'single_elimination', points_to_win: 11 }
//       });
//       assert(res.statusCode === 201, `POST / (simple) expected 201, got ${res.statusCode}`);
//       const tidSimple = getJson(res).id;

//       // join two participants via HTTP routes
//       for (const name of ['A', 'B']) {
//         const j = await app.inject({
//           method: 'POST',
//           url: `/${tidSimple}/participants`,
//           headers: { 'content-type': 'application/json' },
//           payload: { display_name: name }
//         });
//         assert(j.statusCode === 201, `join ${name} failed with ${j.statusCode}`);
//       }

//       // repo helper should observe 2 rows in insertion order
//       const rows = listParticipantsSimple(db, tidSimple);
//       assert(Array.isArray(rows) && rows.length === 2, `listParticipantsSimple expected 2, got ${rows.length}`);
//       assert(rows[0].display_name === 'A' && rows[1].display_name === 'B', 'names/order mismatch in listParticipantsSimple');
//     });

//     await runBlock('Start tournament + list matches', async () => {
//       // fresh tournament with 4 participants  
//       const resT = await app.inject({
//         method: 'POST', url: '/',  
//         headers: { 'content-type': 'application/json' },
//         payload: { mode: 'single_elimination', points_to_win: 11 }
//       });
//       assert(resT.statusCode === 201, `POST / (start) expected 201, got ${resT.statusCode}`);
//       const tid3 = getJson(resT).id;

//       for (const name of ['A','B','C','D']) {
//         const p = await app.inject({
//           method: 'POST', url: `/${tid3}/participants`,  
//           headers: { 'content-type': 'application/json' },
//           payload: { display_name: name }
//         });
//         assert(p.statusCode === 201, `join ${name} failed`);
//       }

//       // start → 200 { status:"active", rounds:2, matches_created:2 }
//       const start = await app.inject({ method: 'POST', url: `/${tid3}/start` });
//       assert(start.statusCode === 200, `POST /:id/start expected 200, got ${start.statusCode}`);
//       const sbody = getJson(start);
//       assert(sbody.status === 'active' && sbody.rounds === 2 && sbody.matches_created === 2, 'start payload mismatch');

//       // list round 1 → two scheduled matches ordered
//       const r1 = await app.inject({ method: 'GET', url: `/${tid3}/matches?round=1` });
//       assert(r1.statusCode === 200, `GET /:id/matches?round=1 expected 200, got ${r1.statusCode}`);
//       const m1 = getJson(r1);
//       assert(Array.isArray(m1) && m1.length === 2, 'round 1 should have 2 matches');
//       assert(m1.every(x => x.status === 'scheduled' && x.round === 1), 'round 1 match fields mismatch');

//       // starting again → 409
//       const startAgain = await app.inject({ method: 'POST', url: `/${tid3}/start` });
//       assert(startAgain.statusCode === 409, `second start should return 409, got ${startAgain.statusCode}`);

//       // power-of-two check → create 3-participant tournament
//       const resT4 = await app.inject({
//         method: 'POST', url: '/',  
//         headers: { 'content-type': 'application/json' },
//         payload: { mode: 'single_elimination', points_to_win: 11 }
//       });
//       const tid4 = getJson(resT4).id;
//       for (const name of ['X','Y','Z']) {
//         await app.inject({
//           method: 'POST', url: `/${tid4}/participants`,  
//           headers: { 'content-type': 'application/json' },
//           payload: { display_name: name }
//         });
//       }
//       const startBad = await app.inject({ method: 'POST', url: `/${tid4}/start` });
//       assert(startBad.statusCode === 400, `start with 3 participants should 400, got ${startBad.statusCode}`);
//     });

//     await runBlock('Blockchain reporter safety (feature-flagged, non-blocking)', async () => {
//       const prev = process.env.BLOCKCHAIN_REPORT_ENABLED;  
//       process.env.BLOCKCHAIN_REPORT_ENABLED = 'true';
//       try {
//         // Create a tiny (2 players) tournament and finish it.  
//         const createRes = await app.inject({
//           method: 'POST',  
//           url: '/',
//           headers: { 'content-type': 'application/json' },
//           payload: { mode: 'single_elimination', points_to_win: 11 }
//         });
//         assert(createRes.statusCode === 201, `POST / (reporter) expected 201, got ${createRes.statusCode}`);
//         const tidR = getJson(createRes).id;

//         // join two participants via HTTP routes
//         for (const name of ['alice', 'bob']) {
//           const j = await app.inject({
//             method: 'POST',  
//             url: `/${tidR}/participants`,
//             headers: { 'content-type': 'application/json' },
//             payload: { display_name: name }
//           });
//           assert(j.statusCode === 201, `join ${name} failed with ${j.statusCode}`);
//         }

//         // start (single-elim) -> 200
//         const startR = await app.inject({ method: 'POST', url: `/${tidR}/start` });
//         assert(startR.statusCode === 200, `POST /:${tidR}/start expected 200, got ${startR.statusCode}`);

//         // fetch the only match (round 1)
//         const matchesRes = await app.inject({ method: 'GET', url: `/${tidR}/matches?round=1` });
//         assert(matchesRes.statusCode === 200, `GET /:${tidR}/matches?round=1 expected 200, got ${matchesRes.statusCode}`);
//         const [m] = getJson(matchesRes);
//         assert(m && Number.isInteger(m.id), 'round 1 match not found');

//         // score the final (3-1). The reporter runs (flagged) but must not affect HTTP success.
//         const scoreRes = await app.inject({
//           method: 'POST',  
//           url: `/${tidR}/matches/${m.id}/score`,
//           headers: { 'content-type': 'application/json' },
//           payload: { score_a: 3, score_b: 1 }
//         });

//         assert(
//           scoreRes.statusCode === 200 || scoreRes.statusCode === 204,  
//           `score final expected 200/204, got ${scoreRes.statusCode}`
//         );
//         if (scoreRes.statusCode === 200) {
//           const scored = getJson(scoreRes);  
//           assert(scored && scored.status === 'finished', 'expected finished match after scoring');
//         }
//       } finally {
//         process.env.BLOCKCHAIN_REPORT_ENABLED = prev; // restore flag  
//       }
//     });

//     console.log('\n✅ Tournaments service tests completed');

//     await finishSuite({ app, tmpDir }); // prints totals, cleans up, exits
//   } catch (err) {
//     console.error('❌ Tournaments tests failed:', err && err.message ? err.message : err);  
//     process.exitCode = 1;
//     try { await finishSuite({ app, tmpDir }); } catch {}
//   }
// })();

