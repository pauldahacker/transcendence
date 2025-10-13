/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   e_2_e_tournament.js                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 14:18:19 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 16:07:37 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */


'use strict';
/**
 * End-to-end manual tests for the Tournaments service via the API Gateway.
 *
 * Usage (from repo root or backend/tournaments):
 *   INTERNAL_API_KEY=... node scripts/tournaments_test.js
 *
 * You can also override:
 *   BASE=https://localhost/api/tournaments
 *
 * The script exits with code 0 on success and 1 on failure.
 */
'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE = process.env.BASE || 'https://localhost/api/tournaments';
const KEY = process.env.INTERNAL_API_KEY;
if (!KEY) {
  console.error('❌ INTERNAL_API_KEY env var is required');
  process.exit(1);
}

const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red   = (s) => `\x1b[31m${s}\x1b[0m`;
const gray  = (s) => `\x1b[90m${s}\x1b[0m`;
const bold  = (s) => `\x1b[1m${s}\x1b[0m`;

let FAILURES = 0;
let TESTS = 0;

function section(title) { console.log('\n' + bold(cyan('# ' + title))); }
async function runTest(name, fn) {
  TESTS++; const start = Date.now();
  try { await fn(); console.log(`  ✅ ${green(name)} ${gray(`(${Date.now()-start}ms)`)}`); }
  catch (err) { FAILURES++; console.error(`  ❌ ${red(name)} ${gray(`(${Date.now()-start}ms)`)}\n     ↳ ${red(err && err.message ? err.message : err)}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function safeJSON(s) { try { return JSON.parse(s); } catch { return null; } }

async function http(method, path, { body, expectStatus } = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'x-internal-api-key': KEY };
  let payload;
  if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const maybeJson = ct.includes('application/json') ? safeJSON(text) : text;
  if (expectStatus && res.status !== expectStatus) { throw new Error(`${method} ${path} expected ${expectStatus}, got ${res.status}. Body: ${text}`); }
  const headersObj = {}; res.headers.forEach((v, k) => { headersObj[k] = v; });
  return { status: res.status, headers: headersObj, body: maybeJson };
}

(async function main() {
  console.log(bold('▶ Tournaments E2E (verbose)')); console.log('  BASE =', BASE);

  section('Health checks');
  await runTest('GET /health returns ok', async () => {
    const h = await http('GET', '/health', { expectStatus: 200 });
    assert(h.body && h.body.status === 'ok', 'health not ok');
  });
  await runTest('GET /health/db returns ok', async () => {
    const hd = await http('GET', '/health/db', { expectStatus: 200 });
    assert(hd.body && hd.body.status === 'ok', 'health/db not ok');
  });

  section('Happy path (4 players → final)');
  let TID, MID1, MID2, MIDF;
  await runTest('Create draft tournament', async () => {
    const c = await http('POST', '', { body: { mode: 'single_elimination', points_to_win: 11 }, expectStatus: 201 });
    TID = c.body.id; assert(Number.isInteger(TID) && TID > 0, 'create did not return id');
  });
  await runTest('Verify draft tournament', async () => {
    const g = await http('GET', `/${TID}`, { expectStatus: 200 });
    assert(g.body.status === 'draft', 'tournament not draft after create');
  });
  await runTest('Join 4 aliases', async () => {
    for (const name of ['A','B','C','D']) {
      await http('POST', `/${TID}/participants`, { body: { display_name: name }, expectStatus: 201 });
    }
    const lp = await http('GET', `/${TID}/participants`, { expectStatus: 200 });
    assert(Array.isArray(lp.body) && lp.body.length === 4, 'expected 4 participants');
  });
  await runTest('Start tournament (power-of-two)', async () => {
    const s = await http('POST', `/${TID}/start`, { expectStatus: 200 });
    assert(s.body.status === 'active' && s.body.rounds === 2 && s.body.matches_created === 2, 'start payload mismatch');
  });

  await runTest('Next returns a round-1 scheduled match', async () => {
    const n1 = await http('GET', `/${TID}/next`, { expectStatus: 200 });
    assert(n1.body && n1.body.round === 1 && n1.body.status === 'scheduled', 'next should point to round-1');
  });  

  await runTest('List round 1 has two scheduled matches', async () => {
    const r1 = await http('GET', `/${TID}/matches?round=1`, { expectStatus: 200 });
    assert(Array.isArray(r1.body) && r1.body.length === 2, 'round 1 should have 2 matches');
    MID1 = r1.body[0].id; MID2 = r1.body[1].id;
  });
  await runTest('Score round 1 match #1', async () => {
    await http('POST', `/${TID}/matches/${MID1}/score`, { body: { score_a: 11, score_b: 7 }, expectStatus: 200 });
  });
  await runTest('Re-scoring a finished match returns 409', async () => {
    const again = await http('POST', `/${TID}/matches/${MID1}/score`, {
      body: { score_a: 11, score_b: 7 }
    });
    assert(again.status === 409, 're-scoring a finished match should 409');
  });
  await runTest('Score round 1 match #2', async () => {
    await http('POST', `/${TID}/matches/${MID2}/score`, { body: { score_a: 11, score_b: 9 }, expectStatus: 200 });
  });
  await runTest('Next points to the final after R1 finishes', async () => {
    const n2 = await http('GET', `/${TID}/next`, { expectStatus: 200 });
    const r2 = await http('GET', `/${TID}/matches?round=2`, { expectStatus: 200 });
    assert(Array.isArray(r2.body) && r2.body.length === 1, 'final not found');
    assert(n2.body.id === r2.body[0].id, 'next should point to the final');
  });
  await runTest('Final (round 2) exists with both slots', async () => {
    const r2 = await http('GET', `/${TID}/matches?round=2`, { expectStatus: 200 });
    assert(Array.isArray(r2.body) && r2.body.length === 1, 'final (round 2) not present');
    assert(r2.body[0].a_participant_id != null && r2.body[0].b_participant_id != null, 'final slots not filled');
    MIDF = r2.body[0].id;
  });
  await runTest('Score final and tournament becomes completed', async () => {
    await http('POST', `/${TID}/matches/${MIDF}/score`, { body: { score_a: 11, score_b: 8 }, expectStatus: 200 });
    const done = await http('GET', `/${TID}`, { expectStatus: 200 });
    assert(done.body.status === 'completed', 'tournament should be completed after final');
  });
  await runTest('Next returns 204 when tournament is completed', async () => {
    const nNone = await http('GET', `/${TID}/next`);
    assert(nNone.status === 204, 'expected 204 when no matches remain');
  });
  section('Error cases');
  await runTest('Unknown tournament /next returns 404', async () => {
    const nf = await http('GET', '/999999/next');
    assert(nf.status === 404, 'GET /999999/next should 404');
  });
  await runTest('Duplicate alias returns 409', async () => {
    const c = await http('POST', '', { body: { mode: 'single_elimination', points_to_win: 11 }, expectStatus: 201 });
    const tid = c.body.id;
    await http('POST', `/${tid}/participants`, { body: { display_name: 'Alice' }, expectStatus: 201 });
    const dup = await http('POST', `/${tid}/participants`, { body: { display_name: 'Alice' } });
    assert(dup.status === 409, 'duplicate alias should 409');
  });
  await runTest('Non-power-of-two start returns 400', async () => {
    const c = await http('POST', '', { body: { mode: 'single_elimination', points_to_win: 11 }, expectStatus: 201 });
    const tid = c.body.id;
    for (const name of ['X','Y','Z']) {
      await http('POST', `/${tid}/participants`, { body: { display_name: name }, expectStatus: 201 });
    }
    const bad = await http('POST', `/${tid}/start`);
    assert(bad.status === 400, 'start with 3 participants should 400');
  });
  await runTest('Starting twice returns 409', async () => {
    const c = await http('POST', '', { body: { mode: 'single_elimination', points_to_win: 11 }, expectStatus: 201 });
    const tid = c.body.id;
    for (const n of ['A','B']) {
      await http('POST', `/${tid}/participants`, { body: { display_name: n }, expectStatus: 201 });
    }
    await http('POST', `/${tid}/start`, { expectStatus: 200 });
    const again = await http('POST', `/${tid}/start`);
    assert(again.status === 409, 'starting twice should 409');
  });
  await runTest('Tie score returns 400', async () => {
    const c = await http('POST', '', { body: { mode: 'single_elimination', points_to_win: 11 }, expectStatus: 201 });
    const tid = c.body.id;
    for (const n of ['A','B']) {
      await http('POST', `/${tid}/participants`, { body: { display_name: n }, expectStatus: 201 });
    }
    await http('POST', `/${tid}/start`, { expectStatus: 200 });
    const r1 = await http('GET', `/${tid}/matches?round=1`, { expectStatus: 200 });
    const mid = r1.body[0].id;
    const tie = await http('POST', `/${tid}/matches/${mid}/score`, { body: { score_a: 10, score_b: 10 } });
    assert(tie.status === 400, 'tie should 400');
  });
  await runTest('Unknown tournament and bad params are handled', async () => {
    const nf1 = await http('GET', '/999999'); assert(nf1.status === 404, 'GET unknown tournament should 404');
    const bad = await http('GET', '/0');      assert(bad.status === 400,  'GET id=0 should 400');
    const nf2 = await http('GET', '/999999/matches?round=1'); assert(nf2.status === 404, 'matches unknown tournament should 404');
  });

  const summary = `${TESTS - FAILURES}/${TESTS} tests passed`;
  if (FAILURES === 0) { console.log('\n' + bold(green('✅ All E2E checks passed. ' + summary))); process.exit(0); }
  else { console.error('\n' + bold(red(`❌ E2E checks failed: ${FAILURES} failing. ${summary}`))); process.exit(1); }
})().catch((err) => {
  console.error('❌ E2E runner error:', err && err.message ? err.message : err);
  process.exit(1);
});
