import { renderUser, renderStats, renderHistory} from '../renderProfile'
import { getTournamentWins } from '../userUtils';
import { getUserRank } from '@/userUtils/UserRank';
import { deleteUser } from '@/userUtils/DeleteUser';
import {
  getUsernameFromToken,
  getUserIdFromToken,
  getUserData,
  UserData,
  UserStats,
  getUserStats,
  setupBIoButton,
  renderLastMatches,
  logoutUser,
  setupAvatarPopup,
  setupDisplayNameEditor
} from "../userUtils";

export async function renderProfile(root: HTMLElement) {
  const container = document.createElement("div");
  container.className = "flex flex-col items-center justify-start min-h-[400px] min-w-[600px] gap-[3vh] pb-[5vh] h-screen pt-[8vh]";
  
  const token = localStorage.getItem("auth_token");
  if (!token) {
    window.location.hash = "#/login";
    return;
  }
  const user_id = getUserIdFromToken(token);  
  const username = getUsernameFromToken(token);
  if (!username || user_id === null) {
    localStorage.removeItem("auth_token");
    window.location.hash = "#/login";
    return;
  }

  console.log(`Valid token for username: ${username}`);

  
  // If /api/users/{id} fails with 404, clear the token before proceeding
  let data:   UserData;
  let stats:  UserStats;
  let ranks;
  let tournamentWins;
  try {
    stats = await getUserStats(user_id);
    data = await getUserData(user_id);
    ranks = await getUserRank(user_id);
    tournamentWins = await getTournamentWins(user_id);
  } catch (err) {
    console.error("Error fetching user data:", err);
    // token might be valid format but invalid server-side
    localStorage.removeItem("auth_token");
    window.location.hash = "#/login";
    return;
  }

  const medalUrl = new URL("../imgs/trophy.png", import.meta.url).href;
  const trashUrl = new URL("../imgs/trash.png", import.meta.url).href;
  let avatarUrl = data?.avatar_url && data.avatar_url !== "null" && data.avatar_url.trim() !== "" ? data.avatar_url : new URL("../imgs/avatar.png", import.meta.url).href;
  let displayName = data?.display_name ?? username;
  let bio = data?.bio ?? "default";
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalGames = stats?.total_games ?? wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const rank = ranks ? ranks : 0;
  const tournaments = tournamentWins;
  const friends = data?.friends?.length ?? 0;

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble mb-[5vh]">Profile</h1>

    <!-- layout -->
    <div class="flex justify-center items-stretch gap-[5vw] w-[90%] h-[65vh]">
      
      ${renderUser(username, avatarUrl, displayName, bio)}
      ${renderStats(wins, losses, friends,  tournaments, rank, medalUrl)}
      ${renderHistory()}

    <!-- Back Home -->
    <a href="#/"
      class="flex items-center justify-center w-[25vw] h-[7vh] mt-[4vh] mx-auto rounded-full
              border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
              transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Back Home
    </a>

    <div class="fixed bottom-[3vh] right-[3vw] flex gap-4">
      <button id="logoutBtn"
        class="font-bit text-[2.5vh] text-gray-100 border-2 border-gray-100 
              rounded-full px-6 py-2 transition-all duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Logout
      </button>
      
      <div class="relative group">
  <!-- Botón de eliminar -->
  <button id="deleteBtn"
    class="flex items-center gap-2 font-bit text-[2.5vh] text-red-400 border-2 border-red-400 
           rounded-full px-6 py-2 transition-all duration-300 hover:bg-red-400 hover:text-cyan-900">
    <img src="${trashUrl}" alt="Trash icon" class="w-[3vh] h-[3vh]" />
    <span>Delete</span>
  </button>

  <!-- Tooltip -->
  <div class="absolute left-1/2 -translate-x-1/2 bottom-[120%]
              bg-black/70 text-white font-bit text-[1.8vh] rounded-lg 
              px-3 py-1 opacity-0 group-hover:opacity-100 
              transition-opacity duration-200 whitespace-nowrap shadow-lg pointer-events-none">
    Delete account permanently
  </div>
</div>

<!-- Popup de confirmación -->
<div id="deletePopup"
  class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50">
  <div class="bg-cyan-900 border-2 border-gray-100 rounded-2xl p-8 w-[350px] text-center shadow-xl">
    <p class="font-bit text-gray-100 text-[2.5vh] mb-6">Are you sure?</p>
    <div class="flex justify-center gap-6">
      <button id="cancelDelete"
        class="font-bit text-[2.2vh] text-gray-100 border-2 border-gray-100 
               rounded-full px-6 py-2 transition-all duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Cancel
      </button>
      <button id="confirmDelete"
        class="font-bit text-[2.2vh] text-red-400 border-2 border-red-400 
               rounded-full px-6 py-2 transition-all duration-300 hover:bg-red-400 hover:text-cyan-900">
        Delete
      </button>
    </div>
  </div>
</div>

    </div>
    </div>
  `;
  root.appendChild(container);

//--Win Rate Bar
const progressBar = container.querySelector(".bg-green-400");
  if (progressBar instanceof HTMLElement)
    progressBar.style.width = `${winRate}%`;
//--Avatar Button
  setupAvatarPopup(user_id);
//--Display name editor
  setupDisplayNameEditor(user_id, data.display_name || username);
//--Bio button
  setupBIoButton(user_id, bio);
//--Match history
  //seedTestMatches(1, 2);
  renderLastMatches(user_id);
//--Logout button
  const logoutBtn = container.querySelector("#logoutBtn");
  logoutBtn?.addEventListener("click", () => {logoutUser()});


document.getElementById("deleteBtn")!.addEventListener("click", () => {
  document.getElementById("deletePopup")!.classList.remove("hidden");
});

document.getElementById("cancelDelete")!.addEventListener("click", () => {
  document.getElementById("deletePopup")!.classList.add("hidden");
});

document.getElementById("confirmDelete")!.addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("auth_token");
	  if (!token) throw new Error("No auth token found");
    const userId = getUserIdFromToken(token);
    if (!userId) throw new Error("No userid token found");
    await deleteUser(userId);            // llama a tu API DELETE /api/users/:id
    window.location.href = "/#";         // redirige al home
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("An error occurred while deleting your account.");
  }
});
}