const Database = require('better-sqlite3');

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
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE')
        throw new Error('Username already exists', { cause: { code: 409 } });
      throw error;
    }
  }
}

module.exports = { UsersDatabase };
