/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   repo.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/10 00:42:12 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 13:11:28 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

// a simple repo layer to keep SQL out of  routes 
function repo(db) {
  const stmtInsert = db.prepare(`
    INSERT INTO tournament (owner_user_id, mode, points_to_win, status)
    VALUES (@owner_user_id, @mode, @points_to_win, 'draft')
  `);

  const stmtGet = db.prepare(`
    SELECT id, owner_user_id, mode, points_to_win, status, created_at
    FROM tournament
    WHERE id = ?
  `);

  function createTournament(input) {
    const info = stmtInsert.run({
      owner_user_id: input.owner_user_id ?? null,
      mode: input.mode,
      points_to_win: input.points_to_win,
    });
    return info.lastInsertRowid;
  }

  function getTournamentById(id) {
    return stmtGet.get(id) || null;
  }

  // Bound participant helpers 
  function insertParticipantBound(tournamentId, data) {
    return insertParticipant(db, tournamentId, data);
  }
  function listParticipantsBound(tournamentId) {
    return listParticipants(db, tournamentId);
  }
  function deleteParticipantBound(tournamentId, participantId) {
    return deleteParticipant(db, tournamentId, participantId);
  }

  return {
    createTournament,
    getTournamentById,
    insertParticipant: insertParticipantBound,
    listParticipants: listParticipantsBound,
    deleteParticipant: deleteParticipantBound,
  };
}

// Top-level helpers

function getTournamentForUpdate(db, id) {
  const t = db.prepare('SELECT * FROM tournament WHERE id = ?').get(id);
  if (!t) return { error: 'not_found' };
  return { t };
}

function listParticipantsSimple(db, tournamentId) {
  const rows = db.prepare(`
    SELECT id, display_name FROM tournament_participant
    WHERE tournament_id = ?
    ORDER BY id ASC
  `).all(tournamentId);
  return rows;
}

function clearMatches(db, tournamentId) {
  db.prepare('DELETE FROM match WHERE tournament_id = ?').run(tournamentId);
}

function insertMatch(db, m) {
  const stmt = db.prepare(`
    INSERT INTO match
      (tournament_id, round, order_index, a_participant_id, b_participant_id,
       status, score_a, score_b, winner_participant_id, updated_at)
    VALUES (?, ?, ?, ?, ?, 'scheduled', NULL, NULL, NULL, ?)
  `);
  const now = new Date().toISOString();
  const info = stmt.run(
    m.tournament_id, m.round, m.order_index,
    m.a_participant_id, m.b_participant_id, now
  );
  return info.lastInsertRowid;
}

// top-level particcipant CRUD

function insertParticipant(db, tournamentId, { display_name, is_bot = false }) {
  const t = db.prepare('SELECT id FROM tournament WHERE id = ?').get(tournamentId);
  if (!t) return { error: 'not_found' };

  try {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO tournament_participant (tournament_id, display_name, joined_at, is_bot)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(tournamentId, display_name.trim(), now, is_bot ? 1 : 0);
    return { id: info.lastInsertRowid };
  } catch (e) {
    const code = e && e.code ? String(e.code) : '';
    if (code.startsWith('SQLITE_CONSTRAINT')) return { error: 'conflict' };
    throw e;
  }
}

function listParticipants(db, tournamentId) {
  const t = db.prepare('SELECT id FROM tournament WHERE id = ?').get(tournamentId);
  if (!t) return { error: 'not_found' };
  const rows = db.prepare(`
    SELECT id, tournament_id, display_name, joined_at, is_bot
    FROM tournament_participant
    WHERE tournament_id = ?
    ORDER BY id ASC
  `).all(tournamentId).map(r => ({
    ...r,
    is_bot: !!r.is_bot
  }));
  return { rows };
}

function deleteParticipant(db, tournamentId, participantId) {
  const p = db.prepare(`
    SELECT id FROM tournament_participant
    WHERE id = ? AND tournament_id = ?
  `).get(participantId, tournamentId);
  if (!p) return { error: 'not_found' };
  db.prepare('DELETE FROM tournament_participant WHERE id = ?').run(participantId);
  return { ok: true };
}

function listMatchesByRound(db, tournamentId, round) {
  const t = db.prepare('SELECT id FROM tournament WHERE id = ?').get(tournamentId);
  if (!t) return { error: 'not_found' };
  const stmt = db.prepare(`
    SELECT id, tournament_id, round, order_index,
           a_participant_id, b_participant_id,
           status, score_a, score_b, winner_participant_id, updated_at
    FROM match
    WHERE tournament_id = ? ${round ? 'AND round = ?' : ''}
    ORDER BY round ASC, order_index ASC, id ASC
  `);
  const rows = round ? stmt.all(tournamentId, round) : stmt.all(tournamentId);
  return { rows };
}


function getMatchById(db, tournamentId, matchId) {
  const t = db.prepare('SELECT id, status FROM tournament WHERE id = ?').get(tournamentId);
  if (!t) return { error: 'not_found', kind: 'tournament' };

  const m = db.prepare(`
    SELECT id, tournament_id, round, order_index,
           a_participant_id, b_participant_id,
           status, score_a, score_b, winner_participant_id, updated_at
    FROM match
    WHERE id = ? AND tournament_id = ?
  `).get(matchId, tournamentId);
  if (!m) return { error: 'not_found', kind: 'match' };
  return { match: m, tournament: t };
}

function getNextScheduledMatch(db, tournamentId) {
  const t = db.prepare('SELECT id FROM tournament WHERE id = ?').get(tournamentId);
  if (!t) return { error: 'not_found' };

  const m = db.prepare(`
    SELECT id, tournament_id, round, order_index,
           a_participant_id, b_participant_id,
           status, score_a, score_b, winner_participant_id, updated_at
    FROM match
    WHERE tournament_id = ? AND status = 'scheduled'
    ORDER BY round ASC, order_index ASC, id ASC
    LIMIT 1
  `).get(tournamentId);
  if (!m) return { none: true };
  return { match: m };
}

// Internal: insert container match for (round, order_index) if missing
function _ensureNextContainerMatch(db, tournamentId, round, orderIndex) {
  let container = db.prepare(`
    SELECT id, a_participant_id, b_participant_id FROM match
    WHERE tournament_id = ? AND round = ? AND order_index = ?
  `).get(tournamentId, round, orderIndex);
  if (container) return container;

  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO match
      (tournament_id, round, order_index,
       a_participant_id, b_participant_id,
       status, score_a, score_b, winner_participant_id,
       updated_at)
    VALUES (?, ?, ?, NULL, NULL, 'scheduled', NULL, NULL, NULL, ?)
  `).run(tournamentId, round, orderIndex, now);

  container = db.prepare(`
    SELECT id, a_participant_id, b_participant_id FROM match WHERE id = ?
  `).get(info.lastInsertRowid);
  return container;
}

function finishMatchAndAdvance(db, tournamentId, matchId, scoreA, scoreB) {
  const tx = db.transaction(() => {
    // Load match + ensure tournament is active
    const tRow = db.prepare(`SELECT id, status FROM tournament WHERE id = ?`).get(tournamentId);
    if (!tRow) return { error: 'not_found', kind: 'tournament' };
    if (tRow.status !== 'active') return { error: 'bad_request', message: 'tournament_not_active' };

    const m = db.prepare(`
      SELECT id, tournament_id, round, order_index,
             a_participant_id, b_participant_id,
             status, score_a, score_b, winner_participant_id,
             updated_at
      FROM match
      WHERE id = ? AND tournament_id = ?
    `).get(matchId, tournamentId); 
    if (!m) return { error: 'not_found', kind: 'match' };

    if (m.status === 'finished') return { error: 'conflict', message: 'match_already_finished' };
    if (m.status !== 'scheduled' && m.status !== 'in_progress') {
      return { error: 'bad_request', message: 'invalid_match_state' };
    }

    if (scoreA === scoreB) return { error: 'bad_request', message: 'tie_not_allowed' };
    const winnerId = scoreA > scoreB ? m.a_participant_id : m.b_participant_id;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE match
      SET status = 'finished',
          score_a = ?, score_b = ?,
          winner_participant_id = ?,
          updated_at = ?
      WHERE id = ?
    `).run(scoreA, scoreB, winnerId, now, m.id);

    // Determine if there is a next round container (unless this was the final)
    const isFinalRound = db.prepare(`
      SELECT COUNT(*) AS c FROM match
      WHERE tournament_id = ? AND round = ?
    `).get(tournamentId, m.round).c === 1;

    if (!isFinalRound) {
      const nextRound = m.round + 1;
      const nextIndex = Math.floor(m.order_index / 2);

      // Ensure container exists
      const container = _ensureNextContainerMatch(db, tournamentId, nextRound, nextIndex);

      // Place winner into A if current order_index even, else B
      const placeIntoA = (m.order_index % 2) === 0;

      if (placeIntoA && container.a_participant_id == null) {
        db.prepare(`UPDATE match SET a_participant_id = ?, updated_at = ? WHERE id = ?`)
          .run(winnerId, now, container.id);
      } else if (!placeIntoA && container.b_participant_id == null) {
        db.prepare(`UPDATE match SET b_participant_id = ?, updated_at = ? WHERE id = ?`)
          .run(winnerId, now, container.id);
      } else {
        // If the slot is already filled, we leave it as-is (e.g., concurrent finish)
      }
    } else {
      // This was the final: tournament completed when no more sched/in_progress matches remain
      const remaining = db.prepare(`
        SELECT COUNT(*) AS c FROM match
        WHERE tournament_id = ? AND status IN ('scheduled','in_progress')
      `).get(tournamentId).c;
      if (remaining === 0) {
        db.prepare(`UPDATE tournament SET status = 'completed' WHERE id = ?`).run(tournamentId);
      }
    }

    // Return the finished match (fresh)
    const finished = db.prepare(`
      SELECT id, tournament_id, round, order_index,
             a_participant_id, b_participant_id,
             status, score_a, score_b, winner_participant_id,
             updated_at
      FROM match WHERE id = ?
    `).get(m.id);

    return { match: finished };
  });

  return tx();
}

module.exports.getMatchById = getMatchById;
module.exports.getNextScheduledMatch = getNextScheduledMatch;
module.exports.finishMatchAndAdvance = finishMatchAndAdvance;


module.exports = {
  // factory
  repo,

  // participant ops
  insertParticipant,
  listParticipants,
  deleteParticipant,

  // bracket helpers
  getTournamentForUpdate,
  listParticipantsSimple,
  clearMatches,
  insertMatch,

  // queries
  listMatchesByRound,
  getMatchById,
  getNextScheduledMatch,

  // scoring/advancement
  finishMatchAndAdvance,
};
