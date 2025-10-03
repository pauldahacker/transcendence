/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   db.js                                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/26 05:26:38 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.USERS_DB_PATH || '/var/lib/app/users.db';

function connect() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
      -- display_name added via migration below
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      exp INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users_users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
  `);

  // MIGRATION: add display_name column if missing
  const hasDisplay = db
    .prepare(`PRAGMA table_info(users_users)`)
    .all()
    .some((c) => c.name === 'display_name');

  if (!hasDisplay) {
    db.exec(`ALTER TABLE users_users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''`);
  }

  // Unique index on display_name for non-empty values (enforce app-side too)
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_display_name_unique
    ON users_users(display_name)
    WHERE display_name <> '';
  `);

  return db;
}

module.exports = { connect };
