const Database = require('better-sqlite3');
const { JSONError } = require('./schemas');
const bcrypt = require('bcrypt');

class UsersDatabase extends Database {
  constructor(filename) {
    super(filename);
    this.exec(`
      CREATE TABLE IF NOT EXISTS users_auth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        display_name TEXT UNIQUE,
        avatar_url TEXT DEFAULT 'https://avatar.iran.liara.run/public',
        bio TEXT,
        FOREIGN KEY (user_id) REFERENCES users_auth(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        confirmed BOOLEAN DEFAULT 0,
        FOREIGN KEY (user1_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        UNIQUE(user1_id, user2_id)
      );

      CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        winner_id INTEGER NOT NULL,
        user1_wins BOOLEAN NOT NULL,
        user2_wins BOOLEAN NOT NULL,
        match_date TEXT NOT NULL,
        FOREIGN KEY (user1_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users_auth(id) ON DELETE CASCADE
      );
    `);
  }

  addUser(username, password) {
    try {
      const stmt = this.prepare('INSERT INTO users_auth (username, password, created_at) VALUES (?, ?, datetime(\'now\'))');
      stmt.run(username, bcrypt.hashSync(password, 10));

      const info = this.prepare('SELECT id, username, created_at FROM users_auth WHERE username = ?').get(username);

      const profileStmt = this.prepare('INSERT INTO users_profile (user_id) VALUES (?)');
      profileStmt.run(info.id);

      return info;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error = JSONError('Username already exists', 409, error.code);
      }
      throw error;
    }
  }

  getAllUsers() {
    try {
      const stmt = this.prepare('SELECT id, username, created_at FROM users_auth');
      return stmt.all();
    } catch (error) {
      throw error;
    }
  }

  getUser(username) {
    try {
      const stmt = this.prepare('SELECT * FROM users_auth WHERE username = ?');
      const row = stmt.get(username);
      if (!row) {
        throw JSONError('User not found', 404);
      }
      return row;
    } catch (error) {
      throw error;
    }
  }

  getUserById(user_id) {
    try {
      const stmt = this.prepare('SELECT * FROM users_auth WHERE id = ?');
      const row = stmt.get(user_id);
      if (!row) {
        throw JSONError('User not found', 404);
      }
      return row;
    } catch (error) {
      throw error;
    }
  }

  getProfile(user_id) {
    try {
      const stmt = this.prepare(`
        SELECT ua.username, up.display_name, up.avatar_url, up.bio, ua.created_at
        FROM users_auth ua
        JOIN users_profile up ON ua.id = up.user_id
        WHERE up.user_id = ?
      `);
      const row = stmt.get(user_id);
      if (!row)
        throw JSONError('User not found', 404);

      row.friends = this.prepare(`
        SELECT f.user2_id as friend_user_id
        FROM friends f
        WHERE f.user1_id = ?

        UNION

        SELECT f.user1_id as friend_user_id
        FROM friends f
        WHERE f.user2_id = ?;
      `).all(user_id, user_id).map(row => row.friend_user_id);

      row.stats = this.prepare(`
        SELECT 
          COUNT(*) as total_matches,
          SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN winner_id != ? THEN 1 ELSE 0 END) as losses
        FROM match_history 
        WHERE user1_id = ? OR user2_id = ?
      `).get(user_id, user_id, user_id, user_id);

      return row;
    } catch (error) {
      throw error;
    }
  }

  updateProfile(user_id, { display_name, avatar_url, bio }) {
    try {
      const stmt = this.prepare(`
        UPDATE users_profile
        SET display_name = COALESCE(?, display_name),
            avatar_url = COALESCE(?, avatar_url),
            bio = COALESCE(?, bio)
        WHERE user_id = ?
      `);
      const info = stmt.run(display_name, avatar_url, bio, user_id);
      if (info.changes === 0) {
        throw JSONError('User not found', 404);
      }
      return this.getProfile(user_id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error = JSONError('Display name is already taken', 409, error.code);
      }
      throw error;
    }
  }
}

module.exports = { UsersDatabase };
