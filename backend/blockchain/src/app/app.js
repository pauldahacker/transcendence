/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/13 23:07:50 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const fs = require('fs');
const fastifyFactory = require('fastify');
const routes = require('./routes');

function buildFastify(opts = {}) {
  const keyPath = process.env.SSL_KEY_PATH || '/app/certs/key.pem';
  const certPath = process.env.SSL_CERT_PATH || '/app/certs/cert.pem';

  if (!fs.existsSync(keyPath)) {
    throw new Error(`SSL cert file not found: ${keyPath}. Set SSL_KEY_PATH.`);
  }
  if (!fs.existsSync(certPath)) {
    throw new Error(`SSL cert file not found: ${certPath}. Set SSL_CERT_PATH.`);
  }

  const app = fastifyFactory({
    logger: opts.logger ?? false,
    http2: true,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  });

  app.register(routes, { prefix: '/' });
  return { app };
}

module.exports = { buildFastify };
