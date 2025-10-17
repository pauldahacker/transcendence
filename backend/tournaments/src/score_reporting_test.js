/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   score_reporting_test.js                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/14 17:32:53 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */


'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

// Helper: (re)load app with a fresh require graph and given env flag
async function loadApp(DB_PATH, { reportGuestAsZero = true } = {}) {
  // set env BEFORE requiring modules that read it at module scope
  process.env.REPORT_GUEST_AS_ZERO = reportGuestAsZero ? 'true' : 'false';
  process.env.API_PORT = process.env.API_PORT || '3004';
  process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'test-internal-key';

  // blow caches for tournaments app tree to force re-evaluation of module-scope flags
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.sep + 'backend' + path.sep + 'tournaments' + path.sep)) {
      delete require.cache[k];
    }
  }

  const { buildFastify } = require('./app/app'); //
  const optsFastify = { logger: false };
  const { app, db } = buildFastify(optsFastify, DB_PATH);
  await app.ready();
  return { app, db };
}

// Minimal “Response-like” object for our fetch mock
function okRes(status = 201) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => '',
    json: async () => ({}),
  };
}

// tiny util
const getJson = (res) => { try { return res.json(); } catch { return null; } };

// --- NEW: small runner util to ensure every test reports its result
async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return { name, ok: true };
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
    return { name, ok: false, error: err };
  }
}

(async () => {
  process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });

  // Create temp DB per run
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tournaments-reporting-'));
  const DB_PATH = path.join(tmpDir, 'tournaments.db');

  // Capture all “reports” made to Users API
  const reports = [];
  const originalFetch = global.fetch;

  // Mock global fetch to capture payload sent to Users via gateway
  global.fetch = async (url, init) => {
    try {
      const body = init && init.body ? JSON.parse(init.body) : null;
      reports.push({ url, headers: init?.headers || {}, body });
      return okRes(201);
    } catch {
      return okRes(500);
    }
  };

  const results = [];

  try {
    // -------------------------
    // Case 1: user vs user → both real IDs get reported
    // -------------------------
    results.push(await runTest('Case 1: user vs user → both real IDs get reported', async () => {
      const { app } = await loadApp(DB_PATH, { reportGuestAsZero: true });
      try {
        reports.length = 0;

        // Create tournament
        let tid;
        {
          const res = await app.inject({
            method: 'POST', url: '/',
            headers: { 'content-type': 'application/json' },
            payload: { mode: 'single_elimination', points_to_win: 11 }
          });
          if (res.statusCode !== 201) throw new Error(`create 201, got ${res.statusCode}`);
          tid = getJson(res).id;
        }

        // Join A (user_id 101) and B (user_id 202)
        {
          const join = (display_name, user_id) => app.inject({
            method: 'POST', url: `/${tid}/participants`,
            headers: { 'content-type': 'application/json' },
            payload: { display_name, user_id }
          });
          if ((await join('A', 101)).statusCode !== 201) throw new Error('join A failed');
          if ((await join('B', 202)).statusCode !== 201) throw new Error('join B failed');
        }

        // Start (1 match in R1)
        if ((await app.inject({ method: 'POST', url: `/${tid}/start` })).statusCode !== 200)
          throw new Error('start failed');

        // Get R1 match id
        let mid;
        {
          const res = await app.inject({ method: 'GET', url: `/${tid}/matches?round=1` });
          if (res.statusCode !== 200) throw new Error('list matches failed');
          const arr = getJson(res);
          if (!Array.isArray(arr) || arr.length !== 1) throw new Error('expected 1 match in R1');
          mid = arr[0].id;
        }

        // Score 11-7 (A beats B)
        {
          const res = await app.inject({
            method: 'POST', url: `/${tid}/matches/${mid}/score`,
            headers: { 'content-type': 'application/json' },
            payload: { score_a: 11, score_b: 7 }
          });
          if (res.statusCode !== 200) throw new Error(`score 200, got ${res.statusCode}`);
          // Should report exactly once
          if (reports.length !== 1) throw new Error(`expected 1 report, got ${reports.length}`);
          const p = reports[0].body;
          if (p.winner_id === 0 || p.loser_id === 0) throw new Error('no zero IDs in user-vs-user');
        }
      } finally {
        await app.close();
      }
    }));

    // -------------------------
    // Case 2: user vs guest → report with 0 for guest (flag ON)
    // -------------------------
    results.push(await runTest('Case 2: user vs guest → report with 0 for guest (flag ON)', async () => {
      const { app } = await loadApp(DB_PATH, { reportGuestAsZero: true });
      try {
        reports.length = 0;

        // Create tournament
        let tid;
        {
          const res = await app.inject({
            method: 'POST', url: '/',
            headers: { 'content-type': 'application/json' },
            payload: { mode: 'single_elimination', points_to_win: 11 }
          });
          if (res.statusCode !== 201) throw new Error('create failed');
          tid = getJson(res).id;
        }

        // Join A (user) and B (guest)
        {
          const resA = await app.inject({
            method: 'POST', url: `/${tid}/participants`,
            headers: { 'content-type': 'application/json' },
            payload: { display_name: 'A', user_id: 303 }
          });
          const resB = await app.inject({
            method: 'POST', url: `/${tid}/participants`,
            headers: { 'content-type': 'application/json' },
            payload: { display_name: 'GuestB' } // no user_id
          });
          if (resA.statusCode !== 201 || resB.statusCode !== 201) throw new Error('join failed');
        }

        // Start
        if ((await app.inject({ method: 'POST', url: `/${tid}/start` })).statusCode !== 200)
          throw new Error('start failed');

        // Get match id
        const arr = getJson(await app.inject({ method: 'GET', url: `/${tid}/matches?round=1` }));
        const mid = arr[0].id;

        // Score 5-11 (guest beats user) → should still report with 0 for guest winner
        {
          const res = await app.inject({
            method: 'POST', url: `/${tid}/matches/${mid}/score`,
            headers: { 'content-type': 'application/json' },
            payload: { score_a: 5, score_b: 11 }
          });
          if (res.statusCode !== 200) throw new Error(`score 200, got ${res.statusCode}`);
          if (reports.length !== 1) throw new Error(`expected 1 report, got ${reports.length}`);
          const p = reports[0].body;
          const has303 = [p.winner_id, p.loser_id].includes(303);
          const hasZero = [p.winner_id, p.loser_id].includes(0);
          if (!has303 || !hasZero) throw new Error('payload must include real user id 303 and 0 for guest');
        }
      } finally {
        await app.close();
      }
    }));

    // -------------------------
    // Case 3: user vs guest → flag OFF → no report
    // -------------------------
    results.push(await runTest('Case 3: user vs guest → flag OFF → no report', async () => {
      const { app } = await loadApp(DB_PATH, { reportGuestAsZero: false });
      try {
        reports.length = 0;

        // Create, join (user + guest), start
        let tid;
        {
          const res = await app.inject({
            method: 'POST', url: '/',
            headers: { 'content-type': 'application/json' },
            payload: { mode: 'single_elimination', points_to_win: 11 }
          });
          tid = getJson(res).id;
        }

        await app.inject({
          method: 'POST', url: `/${tid}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: 'UserX', user_id: 404 }
        });
        await app.inject({
          method: 'POST', url: `/${tid}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: 'GuestY' }
        });

        await app.inject({ method: 'POST', url: `/${tid}/start` });

        const arr = getJson(await app.inject({ method: 'GET', url: `/${tid}/matches?round=1` }));
        const mid = arr[0].id;

        const res = await app.inject({
          method: 'POST', url: `/${tid}/matches/${mid}/score`,
          headers: { 'content-type': 'application/json' },
          payload: { score_a: 11, score_b: 9 }
        });
        if (res.statusCode !== 200) throw new Error(`score 200, got ${res.statusCode}`);
        if (reports.length !== 0) throw new Error(`expected 0 reports with flag OFF, got ${reports.length}`);
      } finally {
        await app.close();
      }
    }));

    // -------------------------
    // Case 4: guest vs guest → no report
    // -------------------------
    results.push(await runTest('Case 4: guest vs guest → no report', async () => {
      const { app } = await loadApp(DB_PATH, { reportGuestAsZero: true });
      try {
        reports.length = 0;

        // Create, join (guest + guest), start
        let tid;
        {
          const res = await app.inject({
            method: 'POST', url: '/',
            headers: { 'content-type': 'application/json' },
            payload: { mode: 'single_elimination', points_to_win: 11 }
          });
          tid = getJson(res).id;
        }

        await app.inject({
          method: 'POST', url: `/${tid}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: 'G1' }
        });
        await app.inject({
          method: 'POST', url: `/${tid}/participants`,
          headers: { 'content-type': 'application/json' },
          payload: { display_name: 'G2' }
        });

        await app.inject({ method: 'POST', url: `/${tid}/start` });

        const arr = getJson(await app.inject({ method: 'GET', url: `/${tid}/matches?round=1` }));
        const mid = arr[0].id;

        const res = await app.inject({
          method: 'POST', url: `/${tid}/matches/${mid}/score`,
          headers: { 'content-type': 'application/json' },
          payload: { score_a: 11, score_b: 3 }
        });
        if (res.statusCode !== 200) throw new Error(`score 200, got ${res.statusCode}`);
        if (reports.length !== 0) throw new Error(`expected 0 reports for guest vs guest, got ${reports.length}`);
      } finally {
        await app.close();
      }
    }));

    // Summary + exit
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) {
      console.log('🎉 All tournaments reporting tests passed');
    } else {
      console.error(`\n${failed.length} test(s) failed:`);
      for (const f of failed) console.error(` - ${f.name}`);
    }

    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    process.exit(failed.length === 0 ? 0 : 1);
  } catch (err) {
    console.error('❌ Test runner crashed:', err.message);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    process.exit(1);
  } finally {
    // restore fetch
    global.fetch = originalFetch;
  }
})();


