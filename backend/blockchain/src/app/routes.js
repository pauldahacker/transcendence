/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routes.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/13 23:08:32 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

async function routes(fastify) {
  // service-level open health
  fastify.get('/health', async () => ({ status: 'ok' }));

  // stub for db health check (like in tournaments). maybe I will not need  it
  fastify.get('/health/db', async () => ({ status: 'ok' }));
}

module.exports = routes;
