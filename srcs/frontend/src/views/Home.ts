// Home view
// Minimal, framework-agnostic auth panel that talks to the backend through lib/api.ts
import {
  signup,
  login,
  logout,
  getMe,
  isAuthenticated,
  displayName,
  pingAuth,
  setAccessToken,
} from "../lib/api";

type State = {
  me: null | { id: string; email: string; display_name?: string | null };
  loading: boolean;
  error: string | null;
  info: string | null;
};

const tpl = (s: State) => `
  <section class="home px-4 py-6 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">ft_transcendence</h1>
    <div class="rounded-lg border p-4 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-gray-500">Status</div>
          <div class="font-medium">${s.me ? "Authenticated" : "Anonymous"}</div>
        </div>
        <div class="text-sm">${s.me ? `Hello, <b>${displayName(s.me as any)}</b>` : "Not logged in"}</div>
      </div>
      ${s.error ? `<div class="mt-3 text-sm text-red-600">${s.error}</div>` : ""}
      ${s.info ? `<div class="mt-3 text-sm text-green-700">${s.info}</div>` : ""}
    </div>

    <form id="auth-form" class="rounded-lg border p-4 grid gap-2" onsubmit="return false;">
      <label class="text-sm">Display name
        <input id="display-name" type="text" required minlength="3" maxlength="20"
               class="w-full border rounded px-2 py-1" placeholder="e.g. player_one" />
      </label>    
      <label class="text-sm">Email
        <input id="email" type="email" required class="w-full border rounded px-2 py-1" placeholder="you@example.com" />
      </label>
      <label class="text-sm">Password
        <input id="password" type="password" required class="w-full border rounded px-2 py-1" placeholder="••••••••" />
      </label>
      <div class="flex gap-2">
        <button id="btn-signup" type="button" class="border rounded px-3 py-1">Sign up</button>
        <button id="btn-login" type="button" class="border rounded px-3 py-1">Log in</button>
        <button id="btn-logout" type="button" class="border rounded px-3 py-1">Log out</button>
      </div>
      <div class="text-xs text-gray-500 mt-1">We store your access token in localStorage (<code>auth.accessToken</code>).</div>
    </form>

    <div class="mt-6 text-sm">
      <button id="btn-health" type="button" class="underline">Check backend health</button>
      <span id="health-result" class="ml-2"></span>
    </div>
  </section>
`;

export async function mount(root: HTMLElement) {
  const state: State = { me: null, loading: true, error: null, info: null };
  const render = () => {
    root.innerHTML = tpl(state);
  };

  // First paint
  render();

  // Try to load the current user if we have a token
  if (isAuthenticated()) {
    try {
      state.me = await getMe();
    } catch (e: any) {
      state.error = `Token invalid or expired (${e?.status || "?"}). Please log in again.`;
      setAccessToken(null);
    }
  }
  state.loading = false;
  render();

  // --- Event delegation: one listener survives re-renders ---
  let wired = false;
  function wireDelegatedEvents() {
    if (wired) return;
    wired = true;

    root.addEventListener("click", async (ev) => {
      const el = ev.target as HTMLElement | null;
      if (!el) return;

      // Helper to query current inputs from the *current* DOM
      const emailInput = () => root.querySelector<HTMLInputElement>("#email");
      const passwordInput = () => root.querySelector<HTMLInputElement>("#password");

      // SIGN UP
      if (el.id === "btn-signup") {
        state.error = null;
        state.info = null;
        try {
          const displayName = (root.querySelector<HTMLInputElement>("#display-name")?.value || "").trim();
          const email = emailInput()?.value.trim() || "";
          const password = passwordInput()?.value || "";
          // if (!email || !password) throw new Error("Email and password are required.");
          // await signup({ email, password });
          if (!displayName || displayName.length < 3) throw new Error("Display name is required (3–20 chars).");
          if (!email || !password) throw new Error("Email and password are required.");
          await signup({ email, password, displayName });
          state.me = await getMe();
          state.info = "Signed up successfully.";
        } catch (e: any) {
          state.error = e?.message || "Sign up failed.";
        }
        render();
        return;
      }

      // LOG IN
      if (el.id === "btn-login") {
        state.error = null;
        state.info = null;
        try {
          const email = emailInput()?.value.trim() || "";
          const password = passwordInput()?.value || "";
          if (!email || !password) throw new Error("Email and password are required.");
          const res: any = await login({ email, password });
          if (res?.error === "2fa_required") {
            state.info = "2FA code required — UI not implemented yet. Try again with code once we add the prompt.";
          }
          state.me = await getMe();
          state.info = state.info || "Logged in.";
        } catch (e: any) {
          state.error = e?.message || "Login failed.";
        }
        render();
        return;
      }

      // LOG OUT
      if (el.id === "btn-logout") {
        state.error = null;
        state.info = null;
        try {
          await logout();
          state.me = null;
          state.info = "Logged out.";
        } catch {
          state.me = null;
          state.info = "Token cleared.";
        }
        render();
        return;
      }

      // HEALTH CHECK
      if (el.id === "btn-health") {
        const out = root.querySelector("#health-result")!;
        out.textContent = "…";
        try {
          const h = await pingAuth();
          out.textContent = `auth: ${h.status}`;
        } catch (e: any) {
          out.textContent = `error: ${e?.status || "?"}`;
        }
        return;
      }
    });
  }

  wireDelegatedEvents();
}

// Back-compat for the router
export function renderHome(root: HTMLElement) {
  return mount(root);
}

export default { mount };



// export function renderHome(root: HTMLElement) {
//   const container = document.createElement("div");
//   container.className =
//     "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[2vh] pb-[5vh] h-screen mx-auto my-auto";

//   container.innerHTML = `
//     <h1 class="font-honk text-[20vh] animate-wobble">Pong</h1>

//     <div class="relative group flex items-center">
//       <a href="#/1player" 
//         class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
//                border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
//                transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
//         1 player
//       </a>
//       <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
//                    text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
//         Play against an AI opponent
//       </span>
//     </div>

//     <div class="relative group flex items-center">
//       <a href="#/2players" 
//         class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
//                border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
//                transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
//         2 players
//       </a>
//       <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
//                    text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
//         Play against a friend on the same keyboard
//       </span>
//     </div>

//     <div class="relative group flex items-center">
//       <a href="#/tournament" 
//         class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
//                border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
//                transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
//         Tournament
//       </a>
//       <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
//                    text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
//         Play a local tournament (1–4 players)
//       </span>
//     </div>

//     <div class="relative group flex items-center">
//       <a href="#/game3d" 
//         class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
//                border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
//                transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
//         Pong 3D
//       </a>
//       <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
//                    text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
//         Pong 3D!
//       </span>
//     </div>
//   `;

//   root.appendChild(container);
// }
