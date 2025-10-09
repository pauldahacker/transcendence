/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/09 23:45:08 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

function routes(app, db) {
  app.get('/health', async (_req, reply) => {
    return reply.send({ status: 'ok' });
  }); 

// simple SELECT to check if db is connected properlly 
  app.get('/health/db', async (_req, reply) => {
    try {
      db.prepare('SELECT 1').get();
      return reply.send({ status: 'ok' });
    } catch (err) {
      request?.log?.error?.(err);
      return reply.code(500).send({ status: 'error' });
    }
  });
}
module.exports = routes;
