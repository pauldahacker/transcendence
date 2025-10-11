/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   TournamentDev.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 18:18:32 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/11 21:35:28 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export function renderTournamentDev(root: HTMLElement) {
  const wrap = document.createElement("div");
  wrap.className =
    "flex flex-col gap-4 p-6 max-w-3xl mx-auto text-gray-100 font-bit";

  wrap.innerHTML = `
    <h1 class="font-honk text-[7vh]">Tournament Dev</h1>

    <div class="flex flex-col gap-2">
      <label class="text-[2.2vh]">JWT (paste here for Bearer auth):</label>
      <input id="jwt" class="px-3 py-2 rounded bg-transparent border-2 border-gray-600 text-[2vh]" placeholder="eyJhbGciOiJI..."/>
    </div>

    <div class="grid grid-cols-2 gap-3 mt-2">
      <button id="btn-health"     class="rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">GET /api/tournaments/health</button>
      <button id="btn-health-db"  class="rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">GET /api/tournaments/health/db</button>
      <button id="btn-create"     class="rounded border-2 border-lime-600 text-lime-400 px-4 py-2 hover:bg-lime-500 hover:text-black">POST /api/tournaments</button>
      <div class="flex gap-2">
        <input id="tid" class="flex-1 px-3 py-2 rounded bg-transparent border-2 border-gray-600" placeholder="tournament id"/>
        <button id="btn-get" class="rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">GET /api/tournaments/:id</button>
      </div>
    </div>

    <pre id="out" class="min-h-[220px] p-3 border-2 border-gray-700 rounded overflow-auto text-[1.8vh]"></pre>

    <a href="#/" class="self-start mt-2 rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">Back Home</a>
  `;

  root.appendChild(wrap);

  const $ = <T extends HTMLElement>(sel: string) => wrap.querySelector(sel) as T;
  const out = $("#out") as HTMLPreElement;
  const jwtInput = $("#jwt") as HTMLInputElement;
  const tidInput = $("#tid") as HTMLInputElement;

  function buildHeaders(): HeadersInit {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const jwt = jwtInput.value.trim();
    if (jwt) h.Authorization = `Bearer ${jwt}`;
    return h;
  }

  async function call(method: string, url: string, body?: any) {
    out.textContent = "…requesting";
    try {
      const res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      out.textContent = `HTTP ${res.status}\n` + (parsed ? JSON.stringify(parsed, null, 2) : text);
      return { res, parsed };
    } catch (e: any) {
      out.textContent = `Request failed: ${e?.message || e}`;
    }
  }

  $("#btn-health")   .addEventListener("click", () => call("GET",  "/api/tournaments/health"));
  $("#btn-health-db").addEventListener("click", () => call("GET",  "/api/tournaments/health/db"));
  $("#btn-create")   .addEventListener("click", () => call("POST", "/api/tournaments", {
    mode: "single_elimination",
    points_to_win: 11
  }));
  $("#btn-get")      .addEventListener("click", () => {
    const tid = Number(tidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) {
      out.textContent = "Please enter a valid positive integer id.";
      return;
    }
    return call("GET", `/api/tournaments/${tid}`);
  });
}
