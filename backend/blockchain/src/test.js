/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/17 21:29:13 by rzhdanov         ###   ########.fr       */
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
