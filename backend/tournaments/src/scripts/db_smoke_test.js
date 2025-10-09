/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   db_smoke_test.js                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/10 00:08:36 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/10 00:38:05 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';
/**
 * Minimal, hard-failing smoke test for tournaments DB schema.
 * Run inside the tournaments container:
 *   docker compose exec tournaments node scripts/db_smoke_test.js
 */
const Database = require('better-sqlite3');

function assert(cond, msg) {
  if (!cond) {
    console.error('❌', msg);
    process.exit(1);
  }
}

const DB_PATH = process.env.DB_PATH || '/app/db/tournaments.db';
const db = new Database(DB_PATH);

// 1) foreign_keys must be ON
const fk = db.pragma('foreign_keys', { simple: true });
assert(fk === 1, `PRAGMA foreign_keys expected 1, got ${fk}`);

// 2) tables exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table'
`).all().map(r => r.name);
['tournament','tournament_participant','match'].forEach(t =>
  assert(tables.includes(t), `Missing table: ${t}`)
);

// 3) key columns + defaults
function tableInfo(name) {
  return db.prepare(`PRAGMA table_info(${name})`).all();
}
const tCols = tableInfo('tournament');
const tpCols = tableInfo('tournament_participant');
const mCols = tableInfo('match');

function hasCol(cols, name, type, notnull) {
  const c = cols.find(x => x.name === name);
  return c && (!type || c.type === type) && (notnull == null || c.notnull === (notnull ? 1 : 0));
}
assert(hasCol(tCols, 'id', 'INTEGER'), 'tournament.id missing/invalid');
assert(hasCol(tCols, 'created_at', 'TEXT', true), 'tournament.created_at missing/invalid');

assert(hasCol(tpCols, 'display_name', 'TEXT', true), 'tournament_participant.display_name missing/invalid');
assert(hasCol(tpCols, 'joined_at', 'TEXT', true), 'tournament_participant.joined_at missing/invalid');

assert(hasCol(mCols, 'tournament_id', 'INTEGER', true), 'match.tournament_id missing/invalid');
assert(hasCol(mCols, 'round', 'INTEGER', true), 'match.round missing/invalid');
assert(hasCol(mCols, 'order_index', 'INTEGER', true), 'match.order_index missing/invalid');
assert(hasCol(mCols, 'updated_at', 'TEXT', true), 'match.updated_at missing/invalid');

// 4) indexes
const idx = db.prepare(`
  SELECT name, tbl_name, sql
  FROM sqlite_master
  WHERE type='index' AND tbl_name IN ('tournament','tournament_participant','match')
`).all();

function hasIndex(name) {
  return idx.some(i => i.name === name);
}
assert(hasIndex('idx_match_tournament'), 'Missing index idx_match_tournament');
assert(hasIndex('idx_tp_tournament'), 'Missing index idx_tp_tournament');

// unique on (tournament_id, display_name)
const tpUnique = idx.find(i => i.tbl_name === 'tournament_participant' && i.sql == null);
// If sql is null and name starts with sqlite_autoindex for that table, uniqueness exists.
assert(
  tpUnique && /^sqlite_autoindex_tournament_participant_/i.test(tpUnique.name),
  'Missing UNIQUE(tournament_id, display_name) on tournament_participant'
);

console.log('✅ tournaments DB schema looks OK');
process.exit(0);