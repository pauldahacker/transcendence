/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   deploy.cjs                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 14:18:19 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/13 16:32:32 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const hre = require('hardhat');

async function main() {
  const Factory = await hre.ethers.getContractFactory('TournamentRegistry');
  const contract = await Factory.deploy();
  await contract.deployed();
  console.log('TournamentRegistry deployed at:', contract.address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});


