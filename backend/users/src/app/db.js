const Database = require('better-sqlite3');
const { JSONError } = require('./schemas');


// Major module: Standard user management, authentication and users across tour-
// naments.
// ◦Users can securely subscribe to the website.
// ◦Registered users can securely log in.
// ◦Users can select a unique display name to participate in tournaments.
// ◦Users can update their information.
// ◦Users can upload an avatar, with a default option if none is provided.
// ◦Users can add others as friends and view their online status.
// ◦User profiles display stats, such as wins and losses.
// ◦Each user has a Match History including 1v1 games, dates, and relevant
// details, accessible to logged-in users.

class UsersDatabase extends Database {
  constructor(filename) {
    super(filename);
    this.exec(`
      CREATE TABLE IF NOT EXISTS users_auth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS users_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        display_name TEXT UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        FOREIGN KEY (user_id) REFERENCES users_auth(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      );

      CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        opponent_id INTEGER NOT NULL,
        result TEXT NOT NULL,
        match_date TEXT NOT NULL,
        details TEXT,
        FOREIGN KEY (user_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        FOREIGN KEY (opponent_id) REFERENCES users_auth(id) ON DELETE CASCADE
      );
    `);
  }

  addUser(username, password) {
    try {
      const stmt = this.prepare('INSERT INTO users_auth (username, password, created_at) VALUES (?, ?, datetime(\'now\'))');
      const info = stmt.run(username, password);
      return info;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error = JSONError('Username already exists', 409, error.code);
      }
      throw error;
    }
  }

  getUser(username) {
    try {
      const stmt = this.prepare('SELECT password FROM users_auth WHERE username = ?');
      const row = stmt.get(username);
      if (!row) {
        throw JSONError('User not found', 404);
      }
      return row.password;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { UsersDatabase };
