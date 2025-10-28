/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   BlockchainDev.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 18:18:32 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/19 20:08:31 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// frontend/src/views/BlockchainDev.ts
export function renderBlockchainDev() {
  const root = document.createElement('div');
  root.style.maxWidth = '720px';
  root.style.margin = '24px auto';
  root.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

  root.innerHTML = `
    <h1>Blockchain Dev</h1>
    <p style="opacity:.8">Calls go through <code>/api/blockchain/*</code>. Paste a JWT or an internal API key.</p>

    <label>JWT (Authorization: Bearer):<br>
      <input id="jwt" placeholder="eyJhbGciOi..." style="width:100%">
    </label>
    <div style="height:8px"></div>
    <label>Internal API Key (x-internal-api-key):<br>
      <input id="iak" placeholder="dev-internal-key" style="width:100%">
    </label>

    <hr>

    <section>
      <h2>/config</h2>
      <button id="btn-config">GET /api/blockchain/config</button>
      <pre id="out-config" style="background:#111;color:#eee;padding:8px;border-radius:6px;white-space:pre-wrap"></pre>
    </section>

    <section>
      <h2>ABI</h2>
      <button id="btn-abi">GET /api/blockchain/abi/TournamentRegistry</button>
      <pre id="out-abi" style="background:#111;color:#eee;padding:8px;border-radius:6px;white-space:pre-wrap"></pre>
    </section>

    <section>
      <h2>Record final (mock/real)</h2>
      <label>Tournament ID <input id="tid" type="number" value="42"></label>
      <label>Winner alias <input id="walias" value="alice"></label>
      <label>Score A <input id="sa" type="number" value="3"></label>
      <label>Score B <input id="sb" type="number" value="1"></label>
      <label>Points to win <input id="ptw" type="number" value="3"></label>
      <button id="btn-post">POST /api/blockchain/finals</button>
      <pre id="out-post" style="background:#111;color:#eee;padding:8px;border-radius:6px;white-space:pre-wrap"></pre>
    </section>

    <section>
      <h2>Read final</h2>
      <label>Tournament ID <input id="tidr" type="number" value="42"></label>
      <button id="btn-get">GET /api/blockchain/finals/:id</button>
      <pre id="out-get" style="background:#111;color:#eee;padding:8px;border-radius:6px;white-space:pre-wrap"></pre>
    </section>
  `;

  document.body.innerHTML = '';
  document.body.appendChild(root);

  const headers = () => {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    const jwt = (document.getElementById('jwt') as HTMLInputElement).value.trim();
    const iak = (document.getElementById('iak') as HTMLInputElement).value.trim();
    if (jwt) h['Authorization'] = `Bearer ${jwt}`;
    if (iak) h['x-internal-api-key'] = iak;
    return h;
  };

  const el = (id: string) => document.getElementById(id)!;

  el('btn-config')!.addEventListener('click', async () => {
    const r = await fetch('/api/blockchain/config', { headers: headers() });
    el('out-config').textContent = await r.text();
  });

  el('btn-abi')!.addEventListener('click', async () => {
    const r = await fetch('/api/blockchain/abi/TournamentRegistry', { headers: headers() });
    el('out-abi').textContent = await r.text();
  });

  el('btn-post')!.addEventListener('click', async () => {
    const body = {
      tournament_id: Number((el('tid') as HTMLInputElement).value),
      winner_alias: (el('walias') as HTMLInputElement).value,
      score_a: Number((el('sa') as HTMLInputElement).value),
      score_b: Number((el('sb') as HTMLInputElement).value),
      points_to_win: Number((el('ptw') as HTMLInputElement).value),
    };
    const r = await fetch('/api/blockchain/finals', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    el('out-post').textContent = await r.text();
  });

  el('btn-get')!.addEventListener('click', async () => {
    const id = Number((el('tidr') as HTMLInputElement).value);
    const r = await fetch(`/api/blockchain/finals/${id}`, { headers: headers() });
    el('out-get').textContent = await r.text();
  });
}
