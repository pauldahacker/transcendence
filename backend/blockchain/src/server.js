/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/13 16:28:21 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/13 16:28:54 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const { buildFastify } = require('./app/app');

const PORT = Number(process.env.PORT || 3007); // not exposed yet at this staeg 
const HOST = '0.0.0.0';

async function main() {
  const { app } = buildFastify({ logger: true });

  await app.listen({ host: HOST, port: PORT });
  app.log.info({ port: PORT }, 'Blockchain service listening');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 
