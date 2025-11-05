/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   json-safe.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:24:04 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/11/05 20:45:09 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

function jsonSafe(value) {
  if (typeof value === 'bigint') return value.toString(); // safe string
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = jsonSafe(value[k]);
    return out;
  }
  return value;
}

module.exports = { jsonSafe };
