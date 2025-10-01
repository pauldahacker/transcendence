/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   authGuard.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:23:43 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/28 21:51:22 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const { jwtVerify } = require('jose');

module.exports = function authGuard(secret) {
  return async function (req, reply) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'missing_token' });
      return;
    }

    const token = auth.slice('Bearer '.length);
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      // payload.sub should be userId
      req.headers['x-user-id'] = String(payload.sub);
    } catch (err) {
      req.log.error({ err }, 'JWT verification failed');
      reply.code(401).send({ error: 'invalid_token' });
    }
  };
};
