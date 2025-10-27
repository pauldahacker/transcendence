import { fetchUsers } from "@/userUtils/FetchUsers";
import { getUserIdFromToken } from "@/userUtils/TokenUtils";
import { sendFriendRequest } from "./sendFriendRequest";
import { fetchFriends } from "./fetchFriends";
import { removeFriend } from "./removeFriend";

type FriendRelation = {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  confirmed: boolean;
  requested_by_id: number;
};

export function initSearchButton() {
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) searchBtn.addEventListener("click", searchBtnPopup);
}

export async function searchBtnPopup() {
  const popup = document.createElement("div");
  popup.id = "searchPopup";
  popup.className = `
    fixed inset-0 bg-black/60 flex items-center justify-center z-50
  `;

  popup.innerHTML = `
    <div id="searchBox" 
         class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[40vw] text-center shadow-xl">
      <h2 class="text-3xl font-bit text-white mb-4">Search Users</h2>
      <input id="searchInputPopup" type="text"
          placeholder="Type a username..."
          class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]
                 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
      <div id="searchResults" 
           class="mt-4 text-left text-white font-bit text-[1.8vh] max-h-[30vh] overflow-y-auto"></div>
      <p id="searchMessage" 
         class="mt-3 text-center font-bit text-[1.6vh] transition-all duration-300"></p>
      <button id="closeSearchPopup"
          class="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-bit text-[1.8vh]">
          Close
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  // Close button and escape handler
  document.getElementById("closeSearchPopup")?.addEventListener("click", () => popup.remove());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.contains(popup)) popup.remove();
  });

  popup.addEventListener("click", (e) => {
    const box = document.getElementById("searchBox");
    if (!box) return; // popup already closed
    if (!box.contains(e.target as Node)) popup.remove();
  });

  const input = document.getElementById("searchInputPopup") as HTMLInputElement;
  const results = document.getElementById("searchResults")!;

  // Fetch all users
  let users: { id: number; username: string; avatar_url?: string; display_name?: string; is_active: boolean }[] = [];
  try {
    users = await fetchUsers();
  } catch (err) {
    console.error(err);
    results.innerHTML = `<p class="text-red-400">Failed to load users</p>`;
    return;
  }

  function showMessage(text: string, type: "error" | "success" | "info" = "info") {
    const message = popup.querySelector("#searchMessage") as HTMLElement | null;
    if (!message || !popup.isConnected) return; // popup closed

    message.textContent = text;
    message.classList.remove("text-red-400", "text-green-400", "text-gray-300");
    message.classList.add(
      type === "error"
        ? "text-red-400"
        : type === "success"
        ? "text-green-400"
        : "text-gray-300"
    );

    if (text) {
      setTimeout(() => {
        if (message.isConnected && message.textContent === text) {
          message.textContent = "";
        }
      }, 3000);
    }
  }

  // Friend button behavior
  function attachFriendButtons() {
    const token = localStorage.getItem("auth_token");
    const currentUserId = token ? getUserIdFromToken(token) : 0;
  
    const buttons = results.querySelectorAll("button[data-userid]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const button = e.currentTarget as HTMLButtonElement;
        const userId = parseInt(button.getAttribute("data-userid") || "0", 10);
  
        const friends = await fetchFriends("all") as FriendRelation[];
        const relation = friends.find(f => f.id === userId);
  
        try {
          if (!relation) {
            // Send friend request
            const res = await sendFriendRequest(userId);
            button.textContent = "Pending"; // show "Pending" because request is sent
            button.disabled = true;
            button.className = "bg-gray-600 text-white text-[1.5vh] px-3 py-1 rounded";
            showMessage(res.message, "success");
          } else if (relation.confirmed) {
            // Remove friend
            const res = await removeFriend(userId);
            button.textContent = "+ Add"; // show "+ Add" because user unfriended
            button.disabled = false;
            button.className = "bg-cyan-700 hover:bg-cyan-600 text-white text-[1.5vh] px-3 py-1 rounded";
            showMessage(res.message, "success");
          } else if (relation.requested_by_id !== currentUserId) {
            // Accept friend request
            const res = await sendFriendRequest(userId);
            button.textContent = "Unfriend"; // now they are friends, so show "Unfriend"
            button.className = "bg-red-600 hover:bg-red-500 text-white text-[1.5vh] px-3 py-1 rounded";
            showMessage(res.message, "success");
          }
        } catch (err) {
          showMessage((err as Error).message, "error");
        }
      });
    });
  }

  async function renderList(filter = "") {
    const query = filter.toLowerCase();
    const token = localStorage.getItem("auth_token");
    const currentUserId = token ? getUserIdFromToken(token) : 0;
  
    const friends: FriendRelation[] = await fetchFriends("all");
  
    const filtered = users
      .filter(u => u.username.toLowerCase().includes(query))
      .filter(u => u.id !== currentUserId)
      .map(u => {
        const relation = friends.find(f => f.id === u.id);
        return { ...u, relation };
      });
  
    const friendEntries = filtered.filter(u => u.relation?.confirmed);
    const otherEntries = filtered.filter(u => !u.relation?.confirmed);
  
    function renderUserRow(u: any) {
      let btnText = "+ Add";
      let btnClass = "bg-cyan-700 hover:bg-cyan-600";
      let disabled = false;
  
      if (u.relation) {
        if (u.relation.confirmed) {
          btnText = "Unfriend";
          btnClass = "bg-red-600 hover:bg-red-500";
        } else if (u.relation.requested_by_id === currentUserId) {
          btnText = "Pending";
          btnClass = "bg-gray-600";
          disabled = true;
        } else {
          btnText = "Accept";
          btnClass = "bg-green-600 hover:bg-green-500";
        }
      }
  
      const dotClass = u.is_active ? "bg-green-500" : "bg-gray-600";
  
      return `
        <div class="flex items-center justify-between p-2 hover:bg-cyan-800 rounded transition-colors duration-150">
          <div class="flex items-center gap-2">
            <img src="${u.avatar_url || '/default-avatar.png'}"
                class="w-6 h-6 rounded-full border border-cyan-700" />
            <span class="w-3 h-3 ${dotClass} rounded-full inline-block"></span>
            <span>${u.username}</span>
          </div>
          <button data-userid="${u.id}"
            class="${btnClass} text-white text-[1.5vh] px-3 py-1 rounded"
            ${disabled ? "disabled" : ""}>
            ${btnText}
          </button>
        </div>`;
    }
  
    // Combine Friends + Users sections
    results.innerHTML = `
      ${friendEntries.length
        ? `<h3 class="text-white text-[2vh] mb-2 mt-2">Friends</h3>
           ${friendEntries.map(renderUserRow).join("")}`
        : ""
      }
      ${otherEntries.length
        ? `<h3 class="text-white text-[2vh] mb-2 mt-4">Users</h3>
           ${otherEntries.map(renderUserRow).join("")}`
        : (!friendEntries.length
            ? `<p class='text-gray-400 mt-2'>No users found</p>`
            : "")
      }
    `;
  
    attachFriendButtons();
  }  

  renderList();
  input.addEventListener("input", () => renderList(input.value));
}
