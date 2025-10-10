/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   repo.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/10 00:42:12 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 01:50:20 by rzhdanov         ###   ########.fr       */
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
       status, score_a, score_b, winner_participant_id, created_at)
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
};
