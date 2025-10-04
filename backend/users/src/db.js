const Database = require('better-sqlite3');
const { JSONError } = require('./schemas');

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
