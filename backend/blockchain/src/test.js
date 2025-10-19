/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 20:54:38 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const path = require('path');
const util = require('util');

const assert = (c, m) => { if (!c) throw new Error(m); };

// Force HTTPS certs for local test (no HTTP fallback)
process.env.SSL_KEY_PATH  = process.env.SSL_KEY_PATH  || path.join(__dirname, '..', 'dev-certs', 'key.pem');
process.env.SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '..', 'dev-certs', 'cert.pem');

const { buildFastify } = require('./app/app');

process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });

const pretty = (v) => {
  try { return util.inspect(v, { depth: 3, colors: true, maxArrayLength: 20 }); }
  catch { return String(v); }
};

const counters = { total: 0, passed: 0, failed: 0 };

function tally(result) {
  counters.total += 1;
  if (result && result.ok) counters.passed += 1;
  else counters.failed += 1;
}

async function runTest(name, fn) {
  const start = Date.now();
  process.stdout.write(`• ${name} … `);
  try {
    await fn();
    const ms = Date.now() - start;
    console.log(`OK (${ms} ms)`);
    return { ok: true };
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`FAIL (${ms} ms)`);
    console.error(`  ↳ ${err.message || err}`);
    if (err.details) {
      console.error('  details:', pretty(err.details));
    }
    return { ok: false };
  }
}

(async () => {
  const { app } = buildFastify({ logger: false });
  await app.ready();

  try {
    // Test: GET /health 200 + {status: "ok"}
    const t1 = await runTest('GET /health returns 200 and ok body', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();
      if (res.statusCode !== 200) {
        const err = new Error(`Expected 200, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      if (!body || body.status !== 'ok') {
        const err = new Error(`Expected body.status === "ok"`);
        err.details = { body };
        throw err;
      }
    });
    tally(t1);

    // Test: GET /health/db 200 + {status: "ok"}
    const t2 = await runTest('GET /health/db returns 200 and ok body', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/db' });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();
      if (res.statusCode !== 200) {
        const err = new Error(`Expected 200, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      if (!body || body.status !== 'ok') {
        const err = new Error(`Expected body.status === "ok"`);
        err.details = { body };
        throw err;
      }
    });
    tally(t2);
  // Test: GET /abi/TournamentRegistry returns ABI array
    const t3 = await runTest('GET /abi/TournamentRegistry returns ABI array', async () => {
      const res = await app.inject({ method: 'GET', url: '/abi/TournamentRegistry' });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();
      if (res.statusCode !== 200) {
        const err = new Error(`Expected 200, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      assert(Array.isArray(body), 'ABI response should be an array');
      assert(body.length > 0, 'ABI should not be empty');
      assert(body.some((e) => e && typeof e.type === 'string'), 'ABI entries must include `type`');
    });
    tally(t3);
    // Test: POST /finals happy path -> 201 + txHash
    const t4 = await runTest('POST /finals -> 201 + txHash', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/finals',
        payload: {
          tournament_id: 42,
          winner_alias: 'champ',
          score_a: 3,
          score_b: 1,
          points_to_win: 3
        }
      });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();
      if (res.statusCode !== 201) {
        const err = new Error(`Expected 201, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      assert(body && typeof body.txHash === 'string' && body.txHash.startsWith('0xmock_'),
        'txHash should be a string starting with 0xmock_');
    });
    tally(t4);
    // Test: POST /finals missing field -> 400
    const t5 = await runTest('POST /finals missing winner_alias -> 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/finals',
        payload: {
          tournament_id: 42,
          score_a: 3,
          score_b: 1,
          points_to_win: 3
        }
      });
      if (res.statusCode !== 400) {
        const body = (() => { try { return res.json(); } catch { return res.body; } })();
        const err = new Error(`Expected 400, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
    });
    tally(t5);

    // Test: GET /finals/:id after POST -> 200 with fields
    const t6 = await runTest('GET /finals/:id after POST -> 200 with result', async () => {
      // ensure there is a stored result
      await app.inject({
        method: 'POST',
        url: '/finals',
        payload: { tournament_id: 7, winner_alias: 'alice', score_a: 3, score_b: 1, points_to_win: 3 }
      });

      const res = await app.inject({ method: 'GET', url: '/finals/7' });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();

      if (res.statusCode !== 200) {
        const err = new Error(`Expected 200, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      assert(body.exists === true, 'expected exists=true');
      assert(body.winner_alias === 'alice', 'winner_alias mismatch');
      assert(body.score_a === 3 && body.score_b === 1 && body.points_to_win === 3, 'scores mismatch');
    });
    tally(t6);
    // Test: GET /finals/:id unknown -> 404
    const t7 = await runTest('GET /finals/:unknown -> 404', async () => {
      const res = await app.inject({ method: 'GET', url: '/finals/99999' });
      if (res.statusCode !== 404) {
        const body = (() => { try { return res.json(); } catch { return res.body; } })();
        const err = new Error(`Expected 404, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
    });
    tally(t7);
  
    // Test: GET /config default -> disabled
    const t8 = await runTest('GET /config returns diagnostics (disabled by default)', async () => {
      const res = await app.inject({ method: 'GET', url: '/config' });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();
      if (res.statusCode !== 200) {
        const err = new Error(`Expected 200, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      assert(typeof body.enabled === 'boolean', '`enabled` should be boolean');
      assert(Object.prototype.hasOwnProperty.call(body, 'network'), '`network` missing');
      assert(Object.prototype.hasOwnProperty.call(body, 'registryAddress'), '`registryAddress` missing');
    });
    tally(t8);

    // Test: GET /config with env -> reflects enabled/network/address
    const t9 = await runTest('GET /config reflects env values', async () => {
      // spin a separate instance to avoid cross-test env confusion
      const { buildFastify } = require('./app/app');
      const prevEnabled = process.env.BLOCKCHAIN_ENABLED;
      const prevNet = process.env.BLOCKCHAIN_NETWORK;
      const prevAddr = process.env.REGISTRY_ADDRESS;
      process.env.BLOCKCHAIN_ENABLED = 'true';
      process.env.BLOCKCHAIN_NETWORK = 'fuji';
      process.env.REGISTRY_ADDRESS = '0x0000000000000000000000000000000000000001';

      const { app: app2 } = buildFastify({ logger: false });
      await app2.ready();

      try {
        const res = await app2.inject({ method: 'GET', url: '/config' });
        const body = (() => { try { return res.json(); } catch { return res.body; } })();
        if (res.statusCode !== 200) {
          const err = new Error(`Expected 200, got ${res.statusCode}`);
          err.details = { statusCode: res.statusCode, body };
          throw err;
        }
        assert(body.enabled === true, 'expected enabled=true');
        assert(body.network === 'fuji', 'expected network=fuji');
        assert(body.registryAddress === '0x0000000000000000000000000000000000000001', 'registryAddress mismatch');
      } finally {
        process.env.BLOCKCHAIN_ENABLED = prevEnabled;
        process.env.BLOCKCHAIN_NETWORK = prevNet;
        process.env.REGISTRY_ADDRESS = prevAddr;
        await app2.close();
      }
    });
    tally(t9);

    // ---- chain adapter unit tests (disabled-mode mock) ----
    const { isEnabled, recordFinal, getFinal, _store } = require('./app/chain');

    const t10 = await runTest('chain.isEnabled returns boolean', async () => {
      const b = isEnabled();
      assert(typeof b === 'boolean', 'isEnabled() must return a boolean');
    });
    tally(t10);

    const t11 = await runTest('chain.recordFinal stores and returns mock tx', async () => {
      _store.clear();
      const res = await recordFinal({ tournament_id: 123, winner_alias: 'alice', score_a: 3, score_b: 1, points_to_win: 3 });
      assert(res && typeof res.txHash === 'string' && res.txHash.startsWith('0xmock_'), 'expected mock txHash');
      const got = await getFinal(123);
      assert(got && got.winner_alias === 'alice', 'expected stored winner_alias');
      assert(got.score_a === 3 && got.score_b === 1 && got.points_to_win === 3, 'expected stored scores');
    });
    tally(t11);

    const t12 = await runTest('chain.getFinal returns null when missing', async () => {
      _store.clear();
      const got = await getFinal(999);
      assert(got === null, 'expected null for missing final');
    });
    tally(t12);

    // POST /finals idempotency: second call -> 409
    const t13 = await runTest('POST /finals twice -> 201 then 409', async () => {
      const first = await app.inject({
        method: 'POST',
        url: '/finals',
        payload: { tournament_id: 321, winner_alias: 'alice', score_a: 3, score_b: 1, points_to_win: 3 }
      });
      if (first.statusCode !== 201) {
        const body = (() => { try { return first.json(); } catch { return first.body; } })();
        const err = new Error(`Expected 201, got ${first.statusCode}`);
        err.details = { body };
        throw err;
      }
      const second = await app.inject({
        method: 'POST',
        url: '/finals',
        payload: { tournament_id: 321, winner_alias: 'alice', score_a: 3, score_b: 1, points_to_win: 3 }
      });
      if (second.statusCode !== 409) {
        const body = (() => { try { return second.json(); } catch { return second.body; } })();
        const err = new Error(`Expected 409, got ${second.statusCode}`);
        err.details = { body };
        throw err;
      }
    });
    tally(t13);

    // Adapter-level: recordFinal throws ALREADY_RECORDED
    const t14 = await runTest('adapter: recordFinal throws on duplicate', async () => {
      const { _store, recordFinal } = require('./app/chain');
      _store.clear();
      await recordFinal({ tournament_id: 999, winner_alias: 'x', score_a: 1, score_b: 0, points_to_win: 1 });
      let threw = false;
      try {
        await recordFinal({ tournament_id: 999, winner_alias: 'x', score_a: 1, score_b: 0, points_to_win: 1 });
      } catch (e) {
        threw = (e && e.code === 'ALREADY_RECORDED');
      }
      assert(threw, 'expected ALREADY_RECORDED');
    });
    tally(t14);
  
    const t15 = await runTest('adapter real-mode (skipped if env missing)', async () => {
      if (process.env.BLOCKCHAIN_ENABLED !== 'true' ||
          !process.env.RPC_URL || !process.env.PRIVATE_KEY || !process.env.REGISTRY_ADDRESS) {
        // skip silently
        return;
      }
      const { recordFinal, getFinal } = require('./app/chain');
      const tid = Math.floor(Math.random() * 1e6) + 1;
      const rec = await recordFinal({ tournament_id: tid, winner_alias: 'smoke', score_a: 3, score_b: 1, points_to_win: 3 });
      assert(rec && typeof rec.txHash === 'string' && rec.txHash.startsWith('0x'), 'expected real txHash');
      const got = await getFinal(tid);
      assert(got && got.winner_alias === 'smoke', 'expected on-chain value');
    });
    tally(t15);

    // /config shows mode/mock + ready=false by default
    const t16 = await runTest('GET /config -> mode=mock, ready=false by default', async () => {
      const res = await app.inject({ method: 'GET', url: '/config' });
      const body = (() => { try { return res.json(); } catch { return res.body; } })();
      if (res.statusCode !== 200) {
        const err = new Error(`Expected 200, got ${res.statusCode}`);
        err.details = { statusCode: res.statusCode, body };
        throw err;
      }
      assert(body.mode === 'mock', 'expected mode=mock');
      assert(body.ready === false, 'expected ready=false');
    });
    tally(t16);
    
    // /config shows mode=real + ready=true when flag and creds exist
    const t17 = await runTest('GET /config -> mode=real, ready=true when enabled + env present', async () => {
      const { buildFastify } = require('./app/app');
      const prev = {
        enabled: process.env.BLOCKCHAIN_ENABLED,
        url: process.env.RPC_URL,
        pk: process.env.PRIVATE_KEY,
        addr: process.env.REGISTRY_ADDRESS,
        net: process.env.BLOCKCHAIN_NETWORK,
      };
      process.env.BLOCKCHAIN_ENABLED = 'true';
      process.env.RPC_URL = prev.url || 'https://example.invalid'; // bogus is fine for config computation
      process.env.PRIVATE_KEY = prev.pk || '0x' + '11'.repeat(32);
      process.env.REGISTRY_ADDRESS = prev.addr || '0x0000000000000000000000000000000000000001';
      // process.env.BLOCKCHAIN_NETWORK = prev.net || 'fuji';
      process.env.BLOCKCHAIN_NETWORK = 'fuji';
      const { app: app2 } = buildFastify({ logger: false });
      await app2.ready();

      try {
        const res = await app2.inject({ method: 'GET', url: '/config' });
        const body = (() => { try { return res.json(); } catch { return res.body; } })();
        if (res.statusCode !== 200) {
          const err = new Error(`Expected 200, got ${res.statusCode}`);
          err.details = { statusCode: res.statusCode, body };
          throw err;
        }
        assert(body.enabled === true, 'expected enabled=true');
        assert(body.mode === 'real', 'expected mode=real');
        assert(body.ready === true, 'expected ready=true');
        assert(body.network === 'fuji', 'expected network=fuji');
        assert(typeof body.registryAddress === 'string' && body.registryAddress.length > 0, 'expected registryAddress string');
      } finally {
        process.env.BLOCKCHAIN_ENABLED = prev.enabled;
        process.env.RPC_URL = prev.url;
        process.env.PRIVATE_KEY = prev.pk;
        process.env.REGISTRY_ADDRESS = prev.addr;
        process.env.BLOCKCHAIN_NETWORK = prev.net;
        await app2.close();
      }
    });
    tally(t17);

    if (counters.failed === 0) {
      console.log(`✅ blockchain ${counters.passed} of ${counters.total} service tests passed`);
      await app.close();
      process.exit(0);
    } else {
      console.error(`❌ ${counters.failed} test(s) of ${counters.total} failed`);
      await app.close();
      process.exit(1);
    }
  } catch (outer) {
    console.error('❌ blockchain tests crashed:', outer && outer.message ? outer.message : outer);
    try { await app.close(); } catch {}
    process.exit(1);
  }
})();
