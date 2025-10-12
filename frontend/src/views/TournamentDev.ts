/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   TournamentDev.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/11 18:18:32 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/10/12 17:15:25 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export function renderTournamentDev(root: HTMLElement) {
  const wrap = document.createElement("div");
  wrap.className =
    "flex flex-col gap-4 p-6 max-w-3xl mx-auto text-gray-100 font-bit";

  wrap.innerHTML = `
    <h1 class="font-honk text-[7vh]">Tournament Dev</h1>

    <!-- JWT -->
    <label class="text-[2.2vh]">JWT (paste here for Bearer auth):</label>
    <input id="jwt" class="w-full px-3 py-2 rounded bg-transparent border-2 border-gray-600 text-[2vh]" placeholder="eyJhbGciOiJI..."/>

    <!-- Tournament id -->
    <label class="text-[2vh] mt-2">Tournament id:</label>
    <input id="tid" class="w-full px-3 py-2 rounded bg-transparent border-2 border-gray-600" placeholder="e.g. 1"/>

    <!-- Health -->
    <button id="btn-health"
      class="w-full rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">
      GET /api/tournaments/health
    </button>

    <button id="btn-health-db"
      class="w-full rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">
      GET /api/tournaments/health/db
    </button>

    <!-- Create tournament -->
    <button id="btn-create"
      class="w-full rounded border-2 border-lime-600 text-lime-400 px-4 py-2 hover:bg-lime-500 hover:text-black">
      POST /api/tournaments
    </button>

    <!-- Get tournament -->
    <button id="btn-get"
      class="w-full rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">
      GET /api/tournaments/:id
    </button>

    <!-- Participants -->
    <label class="text-[2vh] mt-2">Participant alias (display_name):</label>
    <input id="alias" class="w-full px-3 py-2 rounded bg-transparent border-2 border-gray-600" placeholder="e.g. Alice"/>

    <button id="btn-join"
      class="w-full rounded border-2 border-lime-600 text-lime-400 px-4 py-2 hover:bg-lime-500 hover:text-black">
      POST /api/tournaments/:id/participants
    </button>

    <button id="btn-list"
      class="w-full rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">
      GET /api/tournaments/:id/participants
    </button>

    <label class="text-[2vh] mt-2">Participant id (for delete):</label>
    <input id="pid" class="w-full px-3 py-2 rounded bg-transparent border-2 border-gray-600" placeholder="e.g. 7"/>

    <button id="btn-del"
      class="w-full rounded border-2 border-red-600 text-red-400 px-4 py-2 hover:bg-red-500 hover:text-black">
      DELETE /api/tournaments/:id/participants/:pid
    </button>

    <!-- Matches -->
    <button id="btn-start"
      class="w-full rounded border-2 border-emerald-600 text-emerald-400 px-4 py-2 hover:bg-emerald-500 hover:text-black">
      POST /api/tournaments/:id/start
    </button>

    <label class="text-[2vh] mt-2">Round (optional for listing matches):</label>
    <input id="round" class="w-full px-3 py-2 rounded bg-transparent border-2 border-gray-600" placeholder="e.g. 1"/>

    <button id="btn-matches"
      class="w-full rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">
      GET /api/tournaments/:id/matches?round=N
    </button>

    <button id="btn-next"
      class="w-full rounded border-2 border-purple-600 text-purple-300 px-4 py-2 hover:bg-purple-500 hover:text-black">
      GET /api/tournaments/:id/next
    </button>

    <!-- Output -->
    <pre id="out" class="min-h-[260px] p-3 border-2 border-gray-700 rounded overflow-auto text-[1.8vh]"></pre>

    <a href="#/" class="self-start mt-2 rounded border-2 border-gray-200 px-4 py-2 hover:bg-gray-100 hover:text-cyan-900">Back Home</a>
  `;

  root.appendChild(wrap);

  // Refs
  const $ = <T extends HTMLElement>(sel: string) => wrap.querySelector(sel) as T;
  const out = $("#out") as HTMLPreElement;
  const jwtInput = $("#jwt") as HTMLInputElement;
  const tidInput = $("#tid") as HTMLInputElement;
  const aliasInput = $("#alias") as HTMLInputElement;
  const pidInput = $("#pid") as HTMLInputElement;
  const roundInput = $("#round") as HTMLInputElement;

  function buildHeaders(hasBody: boolean): HeadersInit {
    const h: Record<string, string> = {};
    const jwt = jwtInput.value.trim();
    if (jwt) h.Authorization = `Bearer ${jwt}`;
    if (hasBody) h["Content-Type"] = "application/json";
    return h;
  }

  async function call(method: string, url: string, body?: any) {
    out.textContent = "…requesting";
    try {
      const res = await fetch(url, {
        method,
        headers: buildHeaders(!!body),
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

  // Buttons
  $("#btn-health")   .addEventListener("click", () => call("GET",  "/api/tournaments/health"));
  $("#btn-health-db").addEventListener("click", () => call("GET",  "/api/tournaments/health/db"));
  $("#btn-create")   .addEventListener("click", () => call("POST", "/api/tournaments", {
    mode: "single_elimination",
    points_to_win: 11
  }));
  $("#btn-get")      .addEventListener("click", () => {
    const tid = Number(tidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Please enter a valid positive integer id.";
    return call("GET", `/api/tournaments/${tid}`);
  });

  $("#btn-join")!.addEventListener("click", () => {
    const tid = Number(tidInput.value);
    const alias = aliasInput.value.trim();
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Enter a valid tournament id.";
    if (!alias) return out.textContent = "Enter alias (display_name).";
    return call("POST", `/api/tournaments/${tid}/participants`, { display_name: alias });
  });

  $("#btn-list")!.addEventListener("click", () => {
    const tid = Number(tidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Enter a valid tournament id.";
    return call("GET", `/api/tournaments/${tid}/participants`);
  });

  $("#btn-del")!.addEventListener("click", () => {
    const tid = Number(tidInput.value);
    const pid = Number(pidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Enter a valid tournament id.";
    if (!Number.isInteger(pid) || pid <= 0) return out.textContent = "Enter a valid participant id.";
    return call("DELETE", `/api/tournaments/${tid}/participants/${pid}`);
  });

  $("#btn-start")!.addEventListener("click", () => {
    const tid = Number(tidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Enter a valid tournament id.";
    return call("POST", `/api/tournaments/${tid}/start`);
  });

  $("#btn-matches")!.addEventListener("click", () => {
    const tid = Number(tidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Enter a valid tournament id.";
    const r = roundInput.value.trim();
    const q = r ? `?round=${encodeURIComponent(r)}` : "";
    return call("GET", `/api/tournaments/${tid}/matches${q}`);
  });

  $("#btn-next")!.addEventListener("click", () => {
    const tid = Number(tidInput.value);
    if (!Number.isInteger(tid) || tid <= 0) return out.textContent = "Enter a valid tournament id.";
    return call("GET", `/api/tournaments/${tid}/next`);
  });
}