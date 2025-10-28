const { DB_PATH } = require('./config');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database(DB_PATH);

function loadInitialData() {

  const now = new Date().toISOString();

  db.exec(`
    INSERT OR IGNORE INTO users_auth (username, password, created_at) VALUES
      ('alice', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('bob', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('charlie', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('dave', '${bcrypt.hashSync('password', 10)}', '${now}'),
      ('eve', '${bcrypt.hashSync('password', 10)}', '${now}');

    INSERT OR IGNORE INTO users_profile (user_id, display_name, bio, is_active) VALUES
      ((SELECT id FROM users_auth WHERE username = 'alice'), 'Alice Wonderland', 'Lover of adventures.', 0),
      ((SELECT id FROM users_auth WHERE username = 'bob'), 'Bob Builder', 'Can we fix it? Yes we can!', 0),
      ((SELECT id FROM users_auth WHERE username = 'charlie'), 'Charlie Chocolate', 'Sweet and adventurous.', 0),
      ((SELECT id FROM users_auth WHERE username = 'dave'), 'Dave Grohl', 'Musician and rockstar.', 0),
      ((SELECT id FROM users_auth WHERE username = 'eve'), 'Eve Online', 'Space explorer.', 0);

    INSERT OR IGNORE INTO friends (a_friend_id, b_friend_id, requested_by_id, created_at, confirmed) VALUES
      ((SELECT id FROM users_auth WHERE username = 'alice'), (SELECT id FROM users_auth WHERE username = 'bob'), (SELECT id FROM users_auth WHERE username = 'alice'), '${now}', 1),
      ((SELECT id FROM users_auth WHERE username = 'alice'), (SELECT id FROM users_auth WHERE username = 'charlie'), (SELECT id FROM users_auth WHERE username = 'charlie'), '${now}', 1),
      ((SELECT id FROM users_auth WHERE username = 'bob'), (SELECT id FROM users_auth WHERE username = 'dave'), (SELECT id FROM users_auth WHERE username = 'bob'), '${now}', 0),
      ((SELECT id FROM users_auth WHERE username = 'charlie'), (SELECT id FROM users_auth WHERE username = 'eve'), (SELECT id FROM users_auth WHERE username = 'eve'), '${now}', 1);

    INSERT OR IGNORE INTO match_history (tournament_id, match_id, match_date, a_participant_id, b_participant_id, a_participant_score, b_participant_score, winner_id, loser_id) VALUES
      (1, 101, '${now}', (SELECT id FROM users_auth WHERE username = 'alice'), (SELECT id FROM users_auth WHERE username = 'bob'), 21, 15, 
        (SELECT id FROM users_auth WHERE username = 'alice'), (SELECT id FROM users_auth WHERE username = 'bob')),
      (1, 102, '${now}', (SELECT id FROM users_auth WHERE username = 'charlie'), (SELECT id FROM users_auth WHERE username = 'dave'), 18, 21, 
        (SELECT id FROM users_auth WHERE username = 'dave'), (SELECT id FROM users_auth WHERE username = 'charlie')),
      (2, 201, '${now}', (SELECT id FROM users_auth WHERE username = 'eve'), (SELECT id FROM users_auth WHERE username = 'alice'), 22, 20, 
        (SELECT id FROM users_auth WHERE username = 'eve'), (SELECT id FROM users_auth WHERE username = 'alice'));
  `);

  console.log('Initial data loaded successfully.');
  console.log('Users: alice, bob, charlie, dave, eve (password for all: "password")');
}

loadInitialData();
db.close();
