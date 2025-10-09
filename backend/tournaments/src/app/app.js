/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/09 22:13:17 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';
const Fastify = require('fastify');
const routes = require('./routes');

function buildFastify(opts) {
  const app = Fastify(opts);

  // Keep auth plugins aligned with API/users (needed later; harmless now)
  app.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET });
  app.register(require('@fastify/auth'));

  app.after(() => {
    routes(app);
  });

  return { app };
}

module.exports = { buildFastify };
