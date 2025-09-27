/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   db.js                                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/27 01:29:01 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const Database = require('better-sqlite3');

const DB_PATH = process.env.TOURN_DB_PATH || '/var/lib/app/tournaments.db';

function connect() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      points_to_win INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_participant (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      user_id INTEGER NULL,
      display_name TEXT NOT NULL,
      is_bot INTEGER NOT NULL DEFAULT 0,
      UNIQUE (tournament_id, display_name)
    );

    CREATE TABLE IF NOT EXISTS match (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      a_participant_id INTEGER NOT NULL,
      b_participant_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      score_a INTEGER NULL,
      score_b INTEGER NULL,
      winner_participant_id INTEGER NULL
    );

    CREATE INDEX IF NOT EXISTS idx_match_tournament ON match(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_participant(tournament_id);
  `);

  return db;
}

module.exports = { connect };
