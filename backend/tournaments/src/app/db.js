/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   db.js                                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 13:16:08 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const Database = require('better-sqlite3');

class TournamentsDatabase extends Database {
  constructor(filename) {
    super(filename);
    // Run SQLite Pragmas first then create schema safely 
    this.pragma('journal_mode = WAL');
    this.pragma('foreign_keys = ON');
    this.ensureSchema();
    // simple select read to  ensure connectivity
    this.prepare('SELECT 1').get();
    
  }
  
  ensureSchema() {
    this.exec(`
      -- Tournaments (owner_user_id kept for reference, no cross-DB FK)
      CREATE TABLE IF NOT EXISTS tournament (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id    INTEGER NULL,                             -- note: not FK (users DB  is sepaarte)
        mode             TEXT    NOT NULL,                         -- e.g. "single_elimination"
        points_to_win    INTEGER NOT NULL,                         -- game rule snapshot
        status           TEXT    NOT NULL,                         -- draft|active|completed
        created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
        -- FOREIGN KEY (owner_user_id) REFERENCES users_auth(id) ON DELETE SET NULL
      );

      -- Participants (user_id kept for reference, no cross-DB FK)
      CREATE TABLE IF NOT EXISTS tournament_participant (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id    INTEGER NOT NULL,
        user_id          INTEGER NULL,                              -- not FK (users DB is separate)
        display_name     TEXT    NOT NULL,
        is_bot           INTEGER NOT NULL DEFAULT 0,                -- BOOLEAN as 0/1
        joined_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (tournament_id) REFERENCES tournament(id) ON DELETE CASCADE,
        -- FOREIGN KEY (user_id)       REFERENCES users_auth(id) ON DELETE SET NULL,
        UNIQUE (tournament_id, display_name)
      );

      -- Matches (single-elim friendly; stores pairing & result snapshot)
      CREATE TABLE IF NOT EXISTS match (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id           INTEGER NOT NULL,
        a_participant_id        INTEGER, -- removed NOT NULL for testing
        b_participant_id        INTEGER,  -- removed NOT NULL for testing
        round                   INTEGER NOT NULL,                   -- 1..N
        order_index             INTEGER NOT NULL,                   -- position inside round
        status                  TEXT    NOT NULL,                   -- scheduled|in_progress|finished
        score_a                 INTEGER NULL,
        score_b                 INTEGER NULL,
        winner_participant_id   INTEGER NULL,
        updated_at              TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (tournament_id)         REFERENCES tournament(id) ON DELETE CASCADE,
        FOREIGN KEY (a_participant_id)      REFERENCES tournament_participant(id) ON DELETE CASCADE,
        FOREIGN KEY (b_participant_id)      REFERENCES tournament_participant(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_participant_id) REFERENCES tournament_participant(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_match_tournament
        ON match(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_tp_tournament
        ON tournament_participant(tournament_id);
    `);
  }
}

module.exports = { TournamentsDatabase };

