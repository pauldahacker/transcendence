/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   hardhat.config.cjs                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/13 16:31:28 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 16:27:15 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

require('@nomicfoundation/hardhat-toolbox');
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: '0.8.24',
  paths: {
    sources: './contracts',
    // write outpust to parent for /abi endpoint to work properly
    artifacts: './artifacts',
    cache: './cache',
    tests: './tests' // unused so far, we use node test.js at the moment
  },
    networks: (() => {
    const nets = {};
    if (RPC_URL && PRIVATE_KEY) {
      nets.fuji = {
        url: RPC_URL,
        accounts: [PRIVATE_KEY],
      };
    }
    return nets;
  })(),
};
