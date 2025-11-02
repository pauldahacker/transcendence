const { DB_PATH } = require('./config');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database(DB_PATH);

function loadInitialData() {

  const now = new Date().toISOString();

  db.exec(`
    INSERT OR IGNORE INTO users_auth (username, password, created_at) VALUES
      ('alice1', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('bob123', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('charlie', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('dave123', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('eve1234', '${bcrypt.hashSync('password', 10)}', '${now}');

    INSERT OR IGNORE INTO users_profile (user_id, display_name, bio, is_active) VALUES
      ((SELECT id FROM users_auth WHERE username = 'alice1'), 'Alice W', 'Lover of adv.', 0),
      ((SELECT id FROM users_auth WHERE username = 'bob123'), 'Bob Bldr', 'Can we fix?', 0),
      ((SELECT id FROM users_auth WHERE username = 'charlie'), 'Charlie', 'Sweet and adv.', 0),
      ((SELECT id FROM users_auth WHERE username = 'dave123'), 'Dave G', 'Musician.', 0),
      ((SELECT id FROM users_auth WHERE username = 'eve1234'), 'Eve On', 'Space exp.', 0);

    INSERT OR IGNORE INTO friends (a_friend_id, b_friend_id, requested_by_id, created_at, confirmed) VALUES
      ((SELECT id FROM users_auth WHERE username = 'alice1'), (SELECT id FROM users_auth WHERE username = 'bob123'), (SELECT id FROM users_auth WHERE username = 'alice1'), '${now}', 1),
      ((SELECT id FROM users_auth WHERE username = 'alice1'), (SELECT id FROM users_auth WHERE username = 'charlie'), (SELECT id FROM users_auth WHERE username = 'charlie'), '${now}', 1),
      ((SELECT id FROM users_auth WHERE username = 'bob123'), (SELECT id FROM users_auth WHERE username = 'dave123'), (SELECT id FROM users_auth WHERE username = 'bob123'), '${now}', 0),
      ((SELECT id FROM users_auth WHERE username = 'charlie'), (SELECT id FROM users_auth WHERE username = 'eve1234'), (SELECT id FROM users_auth WHERE username = 'eve1234'), '${now}', 1);

    INSERT OR IGNORE INTO match_history (tournament_id, match_id, match_date, a_participant_id, b_participant_id, a_participant_score, b_participant_score, winner_id, loser_id) VALUES
      (1, 101, '${now}', (SELECT id FROM users_auth WHERE username = 'alice1'), (SELECT id FROM users_auth WHERE username = 'bob123'), 21, 15, 
        (SELECT id FROM users_auth WHERE username = 'alice1'), (SELECT id FROM users_auth WHERE username = 'bob123')),
      (1, 102, '${now}', (SELECT id FROM users_auth WHERE username = 'charlie'), (SELECT id FROM users_auth WHERE username = 'dave123'), 18, 21, 
        (SELECT id FROM users_auth WHERE username = 'dave123'), (SELECT id FROM users_auth WHERE username = 'charlie')),
      (2, 201, '${now}', (SELECT id FROM users_auth WHERE username = 'eve1234'), (SELECT id FROM users_auth WHERE username = 'alice1'), 22, 20, 
        (SELECT id FROM users_auth WHERE username = 'eve1234'), (SELECT id FROM users_auth WHERE username = 'alice1'));
  `);

  console.log('Initial data loaded successfully.');
  console.log('Users: alice1, bob123, charlie, dave123, eve1234 (password for all: "password")');
}

loadInitialData();
db.close();
