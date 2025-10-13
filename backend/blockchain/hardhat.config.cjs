/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   hardhat.config.cjs                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/13 16:31:28 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/13 23:09:02 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } }
  }
  // No netwroks  now 
};
