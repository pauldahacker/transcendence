import { fetchFriendRequests } from "./fetchFriendRequests";
import { respondFriendRequest } from "./respondFriendRequest";

export function initNewsButton() {
  document.getElementById("newsBtn")?.addEventListener("click", showNewsPopup);
}

async function showNewsPopup() {
  const popup = document.createElement("div");
  popup.className = "fixed inset-0 bg-black/60 flex items-center justify-center z-50";
  
  popup.innerHTML = `
    <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[35vw] shadow-xl text-center">
      <h2 class="text-3xl font-bit text-white mb-4">Friend Requests</h2>
      <div id="requestsList" class="text-left text-white font-bit text-[2vh] max-h-[30vh] overflow-y-auto"></div>
      <button id="closeNewsPopup" class="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-bit">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("closeNewsPopup")?.addEventListener("click", () => popup.remove());
  popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.remove();
  });

  const list = document.getElementById("requestsList")!;
  list.innerHTML = "Loading...";

  try {
    const requests = await fetchFriendRequests();
    if (!requests.length) {
      list.innerHTML = `<p class="text-gray-300">No pending requests.</p>`;
      return;
    }

    list.innerHTML = requests.map((r: any) => `
      <div class="flex justify-between items-center p-2 hover:bg-cyan-800 rounded">
        <div class="flex gap-3 items-center">
          <img src="${r.avatar_url || '/default-avatar.png'}" class="w-8 h-8 rounded-full" />
          <span>${r.display_name || r.username}</span>
        </div>
        <div class="flex gap-2">
          <button class="bg-green-600 px-2 py-1 rounded" data-action="accept" data-id="${r.id}">✓</button>
          <button class="bg-red-600 px-2 py-1 rounded" data-action="reject" data-id="${r.id}">✕</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const el = e.currentTarget as HTMLElement;
        const requestedById = Number(el.getAttribute("data-id"));
        const accept = el.getAttribute("data-action") === "accept";

        await respondFriendRequest(requestedById, accept);
        el.closest("div")?.remove();
      })
    );
  } catch {
    list.innerHTML = `<p class="text-red-400">Failed to fetch requests</p>`;
  }
}
