/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   deploy.cjs                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 14:18:19 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 16:24:54 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const hre = require('hardhat');

async function main() {
  const url = process.env.RPC_URL;
  const pk = process.env.PRIVATE_KEY;

  if (!url || !pk) {
    console.log('[deploy] RPC_URL or PRIVATE_KEY missing — skipping deploy (exit 0).');
    console.log('         Set RPC_URL, PRIVATE_KEY and run: npm run deploy:fuji');
    return; // <- exit 0 on purpose
  }

  // make sure contractss are compiled
  await hre.run('compile');

  console.log('[deploy] deploying TournamentRegistry…');
  const Factory = await hre.ethers.getContractFactory('TournamentRegistry');
  const registry = await Factory.deploy();

  // keep backwards compatible with ethers v5 just in case
  // ethers v6 uses waitForDeployment/getAddress; ethers v5 uses deployed/address
  if (typeof registry.waitForDeployment === 'function') {
    await registry.waitForDeployment();
    const address = await registry.getAddress();
    console.log(`[deploy] TournamentRegistry deployed at: ${address}`);
    console.log(`REGISTRY_ADDRESS=${address}`);
  } else {
    await registry.deployed();
    console.log(`[deploy] TournamentRegistry deployed at: ${registry.address}`);
    console.log(`REGISTRY_ADDRESS=${registry.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[deploy] failed:', err && err.message ? err.message : err);
    process.exit(1);
  });




