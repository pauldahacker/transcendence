const Database = require('better-sqlite3');
const DB_PATH = 'users.db';

const db = new Database(DB_PATH);

function create() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0
    );
  `);

  return db;
}

function addUser(username, password) {
  try {
    const stmt = db.prepare('INSERT INTO users_auth (username, password, created_at) VALUES (?, ?, datetime(\'now\'))');
    const info = stmt.run(username, password);
    return info;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE')
      throw new Error('Username already exists', { cause: { code: 409 } });
    throw error;
  }
}

module.exports = { create, addUser };
