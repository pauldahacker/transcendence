/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   repo.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/10 00:42:12 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/10 02:21:29 by rzhdanov         ###   ########.fr       */
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

  return { createTournament, getTournamentById };
}

module.exports = { repo };

