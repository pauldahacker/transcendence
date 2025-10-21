/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chain.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/17 22:03:44 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/21 21:32:05 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

'use strict';

const fs = require('fs');
const path = require('path');
let ethers; // lazy require to avoid loading if unused

// mock store for finals in memory
const _store = new Map();

function isEnabled() {
  return process.env.BLOCKCHAIN_ENABLED === 'true';
}
// /**
//  * a mock record stores the final inn memory and returns a mock transcation hash
//  * will switch to calling a real contract after everything is enabled and configured 
//  *
//  * @param {Object} p
//  * @param {number} p.tournament_id
//  * @param {string} p.winner_alias
//  * @param {number} p.score_a
//  * @param {number} p.score_b
//  * @param {number} p.points_to_win
//  * @returns {Promise<{ txHash: string }>}
//  */

// cache for provider/signer/contract to avoid re-init each call
let _cache = null;

// try to init ethers and contract when enabled . retunrs null\ if not ready.
function _getContractIfReady() {
  if (!isEnabled()) return null;

  const RPC_URL = process.env.RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;

  if (!RPC_URL || !PRIVATE_KEY || !REGISTRY_ADDRESS) return null;

  try {
    if (!ethers) {
      // lazy load
      // eslint-disable-next-line global-require
      ethers = require('ethers');
    }
    if (_cache?.address === REGISTRY_ADDRESS && _cache?.url === RPC_URL) {
      return _cache.contract;
    }

    // load ABI from artifacts  (safe, same path as /abi endpoint)
    // const abiPath = path.join(__dirname, '..', '..', 'artifacts', 'contracts', 'TournamentRegistry.sol', 'TournamentRegistry.json');
    // const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;

    const { abi } = require('../artifacts/contracts/TournamentRegistry.sol/TournamentRegistry.json');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(REGISTRY_ADDRESS, abi, signer);

    _cache = { url: RPC_URL, address: REGISTRY_ADDRESS, contract };
    return contract;
  } catch (e) {
    // if anything fails ( e.g.  bad env or rmissing artifcats) will stay in mock mode
    return null;
  }
}

//store final result on chain (real mode) or in memory (mock mode )

async function recordFinal(p) {
  const id = Number(p.tournament_id);
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('bad_tournament_id');
    err.code = 'BAD_ID';
    throw err;
  }

  const c = _getContractIfReady();
  if (c) {
    // real mode -  call contract, assuming solidity signature matches these fields
    // function recordFinal(uint256 tournamentId, string winnerAlias, uint8 scoreA, uint8 scoreB, uint8 pointsToWin)
    const tx = await c.recordFinal(
      id,
      String(p.winner_alias),
      Number(p.score_a),
      Number(p.score_b),
      Number(p.points_to_win)
    );
    const receipt = await tx.wait();
    return { txHash: receipt?.hash || tx.hash };
  }

  // mock mode (current behaviour)
  if (_store.has(id)) {
    const err = new Error('already_recorded');
    err.code = 'ALREADY_RECORDED';
    throw err;
  }
  _store.set(id, {
    winner_alias: String(p.winner_alias),
    score_a: Number(p.score_a),
    score_b: Number(p.score_b),
    points_to_win: Number(p.points_to_win),
  });
  return { txHash: `0xmock_${id}_${Date.now()}` };
}

//read final result froim chain (real mode) or  memory (mock mode )

async function getFinal(tournamentId) {
  const id = Number(tournamentId);
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('bad_tournament_id');
    err.code = 'BAD_ID';
    throw err;
  }

  const c = _getContractIfReady();
  if (c) {
    // real mode: assume getFinal returns tuple [winner, a, b, toWin, exists]
    const res = await c.getFinal(id);
    // ethers v6 returns arrays with named props if ABI has names, so normalize preemtively 
    const winner_alias = res.winnerAlias ?? res[0];
    const score_a = Number(res.scoreA ?? res[1]);
    const score_b = Number(res.scoreB ?? res[2]);
    const points_to_win = Number(res.pointsToWin ?? res[3]);
    const exists = Boolean(res.exists ?? res[4] ?? false);
    if (!exists) return null;
    return { winner_alias, score_a, score_b, points_to_win };
  }

  // mock mode:
  return _store.get(id) || null;
}

module.exports = { isEnabled, recordFinal, getFinal, _store };

// --- diagnostics helper (no secrets) ---
async function diagnostics() {
  const out = {
    enabled: isEnabled(),
    envPresent: Boolean(process.env.RPC_URL && process.env.PRIVATE_KEY && process.env.REGISTRY_ADDRESS),
    abiReadable: false, providerOk: false, walletOk: false, contractOk: false,
    reason: null
  };
  if (!out.enabled || !out.envPresent) return out;
  try {
    // removing absolute require 
    // const abiPath = path.join(__dirname, '..', '..', 'artifacts', 'contracts', 'TournamentRegistry.sol', 'TournamentRegistry.json');
    // const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;
    // out.abiReadable = Array.isArray(abi);

    // load ABI via relative require (robust in container)
    const { abi } = require('../artifacts/contracts/TournamentRegistry.sol/TournamentRegistry.json');
    out.abiReadable = Array.isArray(abi);

    // lazy load ethers
    if (!ethers) ethers = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    await provider.getBlockNumber(); // lightweight call
    out.providerOk = true;
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    // cheap wallet check
    await wallet.getAddress();
    out.walletOk = true;
    const c = new ethers.Contract(process.env.REGISTRY_ADDRESS, abi, wallet);
    // do a harmless static call to ensure ABI/address shape (id 0 expected to exist=false)
    try { await c.getFinal.staticCall(0).catch(() => {}); } catch {}
    out.contractOk = true;
  } catch (e) {
    out.reason = e && e.message ? e.message : String(e);
  }
  return out;
}
module.exports.diagnostics = diagnostics;
