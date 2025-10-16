/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/16 21:31:15 by rzhdanov         ###   ########.fr       */
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

  let failed = 0;

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
    if (!t1.ok) failed++;

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
    if (!t2.ok) failed++;
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
    if (!t3.ok) failed++;

    if (failed === 0) {
      console.log('✅ blockchain service tests passed');
      await app.close();
      process.exit(0);
    } else {
      console.error(`❌ ${failed} test(s) failed`);
      await app.close();
      process.exit(1);
    }
  } catch (outer) {
    console.error('❌ blockchain tests crashed:', outer && outer.message ? outer.message : outer);
    try { await app.close(); } catch {}
    process.exit(1);
  }
})();
