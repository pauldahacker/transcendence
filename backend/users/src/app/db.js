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
        avatar_url TEXT,
        bio TEXT DEFAULT 'Hey! this is me, and I haven''t updated my bio yet...',
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users_auth(id) ON DELETE CASCADE
      );

      CREATE TRIGGER IF NOT EXISTS set_random_avatar
        AFTER INSERT ON users_profile
        FOR EACH ROW
        BEGIN
          UPDATE users_profile
          SET avatar_url = 'https://api.dicebear.com/9.x/bottts-neutral/svg?size=200&seed=' || hex(randomblob(8))
          WHERE id = NEW.id;
      END;

      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        a_friend_id INTEGER NOT NULL,
        b_friend_id INTEGER NOT NULL,
        requested_by_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        confirmed BOOLEAN DEFAULT 0,
        
        FOREIGN KEY (a_friend_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        FOREIGN KEY (b_friend_id) REFERENCES users_auth(id) ON DELETE CASCADE,
        UNIQUE(a_friend_id, b_friend_id)
      );

      CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        match_id INTEGER NOT NULL,
        match_date TEXT NOT NULL,
        a_participant_id INTEGER,
        b_participant_id INTEGER,
        a_participant_score INTEGER NOT NULL,
        b_participant_score INTEGER NOT NULL,
        winner_id INTEGER,
        loser_id INTEGER
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
      if (!row) throw JSONError('User not found', 404);
      return row;
    } catch (error) {
      throw error;
    }
  }

  getUserById(user_id) {
    try {
      const stmt = this.prepare('SELECT * FROM users_auth WHERE id = ?');
      const row = stmt.get(user_id);
      if (!row) throw JSONError('User not found', 404);
      return row;
    } catch (error) {
      throw error;
    }
  }

  getUserFriends(user_id, filter='all') {
    try {
      const stmt = this.prepare(`
        SELECT ua.id, ua.username, up.display_name, up.avatar_url, f.confirmed, f.requested_by_id
        FROM users_auth ua
        JOIN users_profile up ON ua.id = up.user_id
        JOIN (
          SELECT f.b_friend_id as friend_user_id, f.confirmed, f.requested_by_id
          FROM friends f
          WHERE f.a_friend_id = ?

          UNION

          SELECT f.a_friend_id as friend_user_id, f.confirmed, f.requested_by_id
          FROM friends f
          WHERE f.b_friend_id = ?
        ) f ON ua.id = f.friend_user_id
      `);

      if (filter === 'all') {
        return stmt.all(user_id, user_id);
      } else if (filter === 'confirmed') {
        return stmt.all(user_id, user_id).filter(friend => friend.confirmed);
      } else if (filter === 'pending') {
        return stmt.all(user_id, user_id).filter(friend => !friend.confirmed);
      } else if (filter === 'requested') {
        return stmt.all(user_id, user_id).filter(friend => !friend.confirmed && friend.requested_by_id === user_id);
      } else {
        throw JSONError('Invalid filter value', 400);
      }
      
    } catch (error) {
      throw error;
    }
  }

  getUserMatchHistory(user_id) {
    try {
      const stmt = this.prepare(`
        SELECT 
          tournament_id,
          match_id,
          match_date,
          CASE 
            WHEN a_participant_id = ? THEN (SELECT username FROM users_auth WHERE id = b_participant_id)
            ELSE (SELECT username FROM users_auth WHERE id = a_participant_id)
          END as opponent_username,
          CASE 
            WHEN a_participant_id = ? THEN a_participant_score
            ELSE b_participant_score
          END as user_score,
          CASE 
            WHEN a_participant_id = ? THEN b_participant_score
            ELSE a_participant_score
          END as opponent_score,
          CASE 
            WHEN winner_id = ? THEN 'win'
            ELSE 'loss'
          END as result
        FROM match_history
        WHERE a_participant_id = ? OR b_participant_id = ?
        ORDER BY match_date DESC
        LIMIT 10
      `);
      return stmt.all(user_id, user_id, user_id, user_id, user_id, user_id);
    } catch (error) {
      throw error;
    }
  }

  getUserStats(user_id) {
    try {
      const stmt = this.prepare(`
        SELECT 
          COUNT(*) as total_matches,
          SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN winner_id != ? THEN 1 ELSE 0 END) as losses
        FROM match_history 
        WHERE a_participant_id = ? OR b_participant_id = ?
      `);
      return stmt.get(user_id, user_id, user_id, user_id);
    } catch (error) {
      throw error;
    }
  }

  getProfile(user_id) {
    try {
      const stmt = this.prepare(`
        SELECT ua.username, up.display_name, up.avatar_url, up.bio, ua.created_at, up.is_active
        FROM users_auth ua
        JOIN users_profile up ON ua.id = up.user_id
        WHERE up.user_id = ?
      `);
      const row = stmt.get(user_id);

      if (!row) throw JSONError('User not found', 404);
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
      if (info.changes === 0) throw JSONError('User not found', 404);
      return this.getProfile(user_id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error = JSONError('Display name is already taken', 409, error.code);
      }
      throw error;
    }
  }

  deleteUser(user_id) {
    try {
      const stmt = this.prepare('DELETE FROM users_auth WHERE id = ?');
      const info = stmt.run(user_id);

      if (info.changes === 0) throw JSONError('User not found', 404);
    } catch (error) {
      throw error;
    }
  }

  getMatchResult(id) {
    try {
      const stmt = this.prepare('SELECT tournament_id, match_id, match_date, a_participant_id, b_participant_id, a_participant_score, b_participant_score, winner_id, loser_id FROM match_history WHERE id = ?');
      const row = stmt.get(id);
      if (!row) throw JSONError('Match result not found', 404);
      return row;
    } catch (error) {
      throw error;
    }
  }

  addMatchResult(match) {
    try {
      if (match.a_participant_id === 0 && match.b_participant_id === 0)
        throw JSONError('Both participants are bots', 400);

      const stmt = this.prepare(`
        INSERT INTO match_history (tournament_id, match_id, match_date, a_participant_id, b_participant_id, a_participant_score, b_participant_score, winner_id, loser_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        match.tournament_id,
        match.match_id,
        match.match_date,
        match.a_participant_id,
        match.b_participant_id,
        match.a_participant_score,
        match.b_participant_score,
        match.winner_id,
        match.loser_id
      );
      return this.getMatchResult(info.lastInsertRowid);
    } catch (error) {
      throw error;
    }
  }

  manageFriendRequest(a_friend_id, b_friend_id) {
    try {
      b_friend_id = parseInt(b_friend_id);
      if (a_friend_id === b_friend_id) {
        throw JSONError('Cannot send friend request to oneself', 400);
      }
      const checkStmt = this.prepare(`
        SELECT * FROM friends 
        WHERE (a_friend_id = ? AND b_friend_id = ?) 
           OR (b_friend_id = ? AND a_friend_id = ?)
      `);
      const existingRequest = checkStmt.get(a_friend_id, b_friend_id, a_friend_id, b_friend_id);

      if (existingRequest) {
        if (existingRequest.confirmed) {
          throw JSONError('You are already friends', 400);
        } else if (existingRequest.requested_by_id === a_friend_id) {
          throw JSONError('Friend request already sent', 409);
        } else {
          const updateStmt = this.prepare(`
            UPDATE friends 
            SET confirmed = 1 
            WHERE (a_friend_id = ? AND b_friend_id = ?) 
               OR (b_friend_id = ? AND a_friend_id = ?)
          `);
          updateStmt.run(a_friend_id, b_friend_id, a_friend_id, b_friend_id);
          return { message: 'Friend request accepted'};
        }
      } else {
        const insertStmt = this.prepare(`
          INSERT INTO friends (a_friend_id, b_friend_id, requested_by_id, created_at) 
          VALUES (?, ?, ?, datetime('now'))
        `);
        insertStmt.run(a_friend_id, b_friend_id, a_friend_id);
        return { message: 'Friend request sent' };
      }
    } catch (error) {
      throw error;
    }
  }

  setSessionState(username, is_active) {
    try {
      const stmt = this.prepare(`
        UPDATE users_profile
        SET is_active = ?
        WHERE user_id = (SELECT id FROM users_auth WHERE username = ?)
      `);
      const info = stmt.run(is_active ? 1 : 0, username);
      if (info.changes === 0) throw JSONError('User not found', 404);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { UsersDatabase };
