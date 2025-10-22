import { renderUser, renderStats, renderHistory} from '../renderProfile'
import {
  getUsernameFromToken,
  getUserIdFromToken,
  getUserData,
  UserData,
  UserStats,
  getUserStats,
  setupBIoButton,
  renderLastMatches,
  seedTestMatches,
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
  try {
    stats = await getUserStats(user_id);
    data = await getUserData(user_id);
  } catch (err) {
    console.error("Error fetching user data:", err);
    // token might be valid format but invalid server-side
    localStorage.removeItem("auth_token");
    window.location.hash = "#/login";
    return;
  }

  const medalUrl = new URL("../imgs/trophy.png", import.meta.url).href;
  let avatarUrl = data?.avatar_url && data.avatar_url !== "null" && data.avatar_url.trim() !== "" ? data.avatar_url : new URL("../imgs/avatar.png", import.meta.url).href;
  let displayName = data?.display_name ?? username;
  let bio = data?.bio ?? "default";
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalGames = stats?.total_games ?? wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const rank = 2;
  const tournaments = 3;
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

    <button id="logoutBtn"
      class="fixed bottom-[3vh] right-[3vw] font-bit text-[2.5vh] text-gray-100 border-2 border-gray-100 
            rounded-full px-6 py-2 transition-all duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Logout
    </button>
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
}
