const { DB_PATH } = require('./config');
const Database = require('better-sqlite3');

const db = new Database(DB_PATH);

function loadInitialData() {

  const now = new Date().toISOString();

  db.exec(`
    INSERT OR IGNORE INTO users_auth (username, password, created_at) VALUES
      ('alice', 'password123', '${now}'),
      ('bob', 'securepass', '${now}'),
      ('charlie', 'mypassword', '${now}'),
      ('dave', 'passw0rd', '${now}'),
      ('eve', '123456', '${now}');

    INSERT OR IGNORE INTO users_profile (user_id, display_name, bio) VALUES
      ((SELECT id FROM users_auth WHERE username = 'alice'), 'Alice Wonderland', 'Lover of adventures.'),
      ((SELECT id FROM users_auth WHERE username = 'bob'), 'Bob Builder', 'Can we fix it? Yes we can!'),
      ((SELECT id FROM users_auth WHERE username = 'charlie'), 'Charlie Chocolate', 'Sweet and adventurous.'),
      ((SELECT id FROM users_auth WHERE username = 'dave'), 'Dave Grohl', 'Musician and rockstar.'),
      ((SELECT id FROM users_auth WHERE username = 'eve'), 'Eve Online', 'Space explorer.');

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
}

loadInitialData();
db.close();
