 # Blockchain on Avalanche Fuji — Operator Checklist

 ## Prereqs
 - Node.js (LTS), npm
 - Wallet with a small amount of **AVAX Fuji** (for gas)
 - **Do not** expose secrets to the frontend or commit them to VCS.

 ## Environment
 Export these **only in your shell** (not in frontend):
 ```bash
 export BLOCKCHAIN_ENABLED=true
 export RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"  # or your provider
export PRIVATE_KEY="0xYOUR_PRIVATE_KEY"                      # dev wallet (0x + 64 hex)
# Sanity-check format (must print "OK 66"):
python - <<'PY'
import os,re
k=os.environ.get("PRIVATE_KEY","")
print("OK" if re.fullmatch(r"0x[0-9a-fA-F]{64}",k) else "BAD", len(k))
PY
# Tip: never use the Unicode ellipsis character (…); paste the full 66-char key. export REGISTRY_ADDRESS="0x...";                             # after deploy
 export INTERNAL_API_KEY="your-internal-key"                  # gateway auth
 ```

 ## Deploy contract to Fuji
 From `backend/blockchain/src`:
 ```bash
 npm ci
 RPC_URL="$RPC_URL" PRIVATE_KEY="$PRIVATE_KEY" npx hardhat run scripts/deploy.cjs --network fuji
 # copy the printed TournamentRegistry address into REGISTRY_ADDRESS
 ```

 ## Verify backend readiness
 Through the **gateway** (never call services directly):
 ```bash
 # 1) Config should show ready=true and network="fuji"
 curl -sk https://localhost/api/blockchain/config \
   -H "x-internal-api-key: $INTERNAL_API_KEY" | jq .

 # 2) ABI endpoint available
 curl -sk https://localhost/api/blockchain/abi/TournamentRegistry \
   -H "x-internal-api-key: $INTERNAL_API_KEY" | jq '.[0]'
 ```
 ### (Optional) Adapter diagnostics
Shows non-secret flags for real-mode readiness:
```bash
make chain-diagnostics
# Expect:
# { "enabled": true, "envPresent": true, "abiReadable": true,
#   "providerOk": true, "walletOk": true, "contractOk": true, "reason": null }
```


 ## Smoke test (record + read final)
 ```bash
 TOURNAMENT_ID=42
 curl -sk https://localhost/api/blockchain/finals \
   -H "x-internal-api-key: $INTERNAL_API_KEY" \
   -H "content-type: application/json" \
   --data "{\"tournament_id\":$TOURNAMENT_ID,\"winner_alias\":\"alice\",\"score_a\":3,\"score_b\":1,\"points_to_win\":3}"
 # → { "txHash": "0x..." }

 curl -sk https://localhost/api/blockchain/finals/$TOURNAMENT_ID \
   -H "x-internal-api-key: $INTERNAL_API_KEY" | jq .
 # On-chain is idempotent; a second POST for the same id will yield HTTP 409 via service guard.
 ```

 ## Notes
 - Network defaults to **"fuji"** when ready.
 - Payload semantics align with the subject: `winner_alias`, `score_a`, `score_b`, `points_to_win`.
 - Keep secrets out of logs/console history; prefer ephemeral shell exports.
 - Only the **API gateway** is public. Health endpoints are open; all business endpoints require gateway auth.

