/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/09 23:33:15 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';
const Fastify = require('fastify');
const routes = require('./routes');
// const { config } = require('./config');
const { TournamentsDatabase } = require('./db');

function buildFastify(opts, dbPath) {
  const app = Fastify(opts);
  const db = new TournamentsDatabase(dbPath);
  //small guard for missing jwt secret
  if (!process.env.JWT_SECRET) {
    app.log.error('Missing JWT_SECRET');
    throw new Error('Missing JWT_SECRET');
}

  app.after(() => {
    routes(app, db);
  });

  return { app, db };
}

module.exports = { buildFastify };
