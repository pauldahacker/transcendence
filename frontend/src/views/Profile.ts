import { getUsernameFromToken, getUserIdFromToken, isUserLoggedIn } from "@/userUtils/TokenUtils";
import { getUserData, UserData, UserStats, getUserStats, getUserDataFromName } from "@/userUtils/UserStats";
import { updateBio, setupBIoButton } from "@/userUtils/UserBio";
import { renderLastMatches, seedTestMatches} from "@/userUtils/UserMatches"; 
import { logoutUser } from "@/userUtils/LogoutUser";
import { setupAvatarPopup } from "@/userUtils/UserAvatar";
import { setupDisplayNameEditor } from "@/userUtils/DisplayName";

const token = localStorage.getItem("auth_token");
export async function renderProfile(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col items-center justify-start min-h-[400px] min-w-[600px] gap-[3vh] pb-[5vh] h-screen pt-[8vh]";
  const token = localStorage.getItem("auth_token");
  
  // added this to go to login if the token is invalid
  if (!token) {
    window.location.hash = "#/login";
    return;
  }
const user_id = getUserIdFromToken(token);

const username = getUsernameFromToken(token);
if (!username || user_id === null) {
  // Invalid / corrupted token (e.g. user deleted)
  localStorage.removeItem("auth_token");
  window.location.hash = "#/login";
  return;
}

console.log(`Valid token for username: ${username}`);

//let data: UserData | null = null;
// if (token) {
//   const decoded = getUsernameFromToken(token);
//   console.log(`token: ${token} || username ${decoded}`);
//   if (decoded) {
//     username = decoded;
//   }
// }

const medalUrl = new URL("../imgs/trophy.png", import.meta.url).href;
const editUrl = new URL("../imgs/edit.png", import.meta.url).href;
// const data : UserData = await getUserDataFromName(username);
const stats : UserStats = await getUserStats(user_id);
  
  // If /api/users/{id} fails with 404, clear the token before proceeding
  let data: UserData;
  try {
    data = await getUserDataFromName(username);
  } catch (err) {
    console.error("Error fetching user data:", err);
    // token might be valid format but invalid server-side
    localStorage.removeItem("auth_token");
    window.location.hash = "#/login";
    return;
  }

  let avatarUrl = data?.avatar_url && data.avatar_url !== "null" && data.avatar_url.trim() !== ""
    ? data.avatar_url : new URL("../imgs/avatar.png", import.meta.url).href;

  let bio = data?.bio ?? "default";
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalGames = stats?.total_games ?? wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
  console.log("avatar_url del backend:", data?.avatar_url);
  console.log("avatarUrl calculado:", avatarUrl);

  const rank = 2;
  const tournaments = 3;
  const friends = data?.friends?.length ?? 0;

  container.innerHTML = `
  <h1 class="font-honk text-[10vh] animate-wobble mb-[5vh]">Profile</h1>

  <!-- Wrapper for layout -->
  <div class="flex justify-center items-stretch gap-[5vw] w-[90%] h-[65vh]">

    <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 rounded-3xl p-[3vh] shadow-xl w-[30vw] h-full">
      <!--USERNAME-->
      <h2 class="font-bit text-[4vh] text-gray-100">${username}</h2>
      <!-- AVATAR -->
      <div id="avatarWrapper" class="relative group cursor-pointer mb-[2vh]">
        <img id="avatarImg" src="${avatarUrl}" alt="User Avatar" class="w-[25vh] h-[25vh] rounded-full border-4 border-cyan-500 shadow-[0_0_15px_#00ffff] object-cover">
        <div class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span class="font-bit text-[2.2vh] text-white select-none">
            Change avatar
          </span>
        </div>
      </div>

    <!-- Hidden POPUP -->
    <div id="avatarModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[30vw] shadow-2xl">
        <h3 class="font-bit text-[2.5vh] text-white mb-4 text-center">Change Avatar</h3>
        <input id="avatarUrlInput" type="text" class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]"
          placeholder="Enter your new avatar image URL..."
        />
        <div class="flex justify-end mt-4 gap-2">
          <button id="confirmAvatar" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
            Save
          </button>
          <button id="resetAvatar" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
            Reset to default
          </button>
        </div>
      </div>
    </div>

      <!-- DISPLAY NAME -->
      <div class="flex items-center gap-2 mt-[1vh]">
        <span id="currentDisplayName" class="font-bit text-[3vh] text-cyan-200">${data.display_name || username}</span>
          <div id="editNameWrapper" class="relative group cursor-pointer">
            <img src="${editUrl}" alt="edit" class="w-[2.5vh] h-[2.5vh] inline-block transition-opacity duration-200">
              <!-- hover tooltip -->
              <div class="absolute left-1/2 -translate-x-1/2 bottom-[120%]
                bg-black/70 text-white font-bit text-[1.8vh] rounded-lg 
                px-3 py-1 opacity-0 group-hover:opacity-100 
                transition-opacity duration-200 whitespace-nowrap shadow-lg">
                  Change display name
              </div>
          </div>
      </div>

      <!-- Hidden popup for editing name -->
      <div id="namePopup" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[30vw] shadow-2xl">
          <h3 class="font-bit text-[2.5vh] text-white mb-4 text-center">Edit Display Name</h3>
            <input id="nameInput" type="text" class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]"
              placeholder="Enter your new display name..." />
          <div class="flex justify-end mt-4">
            <button id="updateNameBtn" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
              Update
            </button>
          </div>
        </div>
      </div>
      
      <!-- BIO -->
      <div class="flex items-center gap-2 mt-[1vh]">
      <p id="currentBio"
      class="font-bit text-[1.5vh] text-gray-300 text-center w-[80%] whitespace-normal overflow-hidden [overflow-wrap:anywhere] [word-break:normal]">
          ${bio}
      </p>
          <div id="editBioWrapper" class="relative group cursor-pointer">
            <img src="${editUrl}" alt="edit" class="w-[2.5vh] h-[2.5vh] inline-block transition-opacity duration-200">
              <!-- hover tooltip (same style as display name) -->
              <div class="absolute left-1/2 -translate-x-1/2 bottom-[120%]
                bg-black/70 text-white font-bit text-[1.8vh] rounded-lg 
                px-3 py-1 opacity-0 group-hover:opacity-100 
                transition-opacity duration-200 whitespace-nowrap shadow-lg">
                  Change bio
              </div>
          </div>
      </div>


      <!-- hidden popup -->
      <div id="bioPopup" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[30vw] shadow-2xl">
          <h3 class="font-bit text-[2.5vh] text-white mb-4 text-center">Edit Bio</h3>
          <input id="bioInput" type="text" class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]"
                 placeholder="Enter your new bio..." />
          <div class="flex justify-end mt-4">
            <button id="updateBioBtn" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
              Update bio
            </button>
          </div>
        </div>
      </div>
  
    </div>

    <!-- MIDDLE COLUMN -->
    <div class="flex flex-col gap-[3vh] w-[30vw] h-full">

      <!-- TOP: Game Stats -->
      <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 
                  rounded-3xl p-[3vh] shadow-xl flex-1">
        <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Game Stats</h3>
        <div class="flex justify-between w-full px-[2vw] font-bit text-[2.5vh]">
          <span class="text-green-400">Wins: ${wins}</span>
          <span class="text-red-400">Losses: ${losses}</span>
        </div>
        <div class="mt-[2vh] w-[90%] bg-red-400 rounded-full h-[2.5vh] overflow-hidden">
          <div class="h-full bg-green-400 transition-all duration-500" 
               style="width: ${Math.max(0, Math.min(100, winRate))}%"></div>
        </div>
        <p class="font-bit text-gray-100 text-[2.2vh] mt-[1vh]">${winRate}% Win Rate</p>
      </div>

      <!-- BOTTOM: Social & Rank -->
      <div class="bg-cyan-900/30 border-4 border-cyan-800 text-center rounded-3xl p-[3vh] 
                  shadow-xl flex-1">
        <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Social & Rank</h3>
        <div class="grid grid-cols-3 gap-[2vh] text-center h-full">
          <div class="flex flex-col justify-start">
            <span class="font-bit text-gray-300 text-[2.2vh]">Friends</span>
            <span class="font-bit text-[3vh] text-cyan-200">${friends}</span>
          </div>
          <div class="flex flex-col justify-start items-center">
            <span class="font-bit text-gray-300 text-[2.2vh]">Tournaments</span>
            <div class="flex items-center gap-[1vh]">
              <span class="font-bit text-[3vh] text-cyan-200">${tournaments}</span>
              <img src="${medalUrl}" alt="Medal" class="w-[3vh] h-[3vh] inline-block">
            </div>
          </div>
          <div class="flex flex-col justify-start">
            <span class="font-bit text-gray-300 text-[2.2vh]">Rank</span>
            <span class="font-bit text-[3vh] text-amber-300">#${rank}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: Match History -->
    <div class="bg-cyan-900/30 border-4 text-center border-cyan-800 rounded-3xl p-[3vh] 
                shadow-xl w-[30vw] h-full flex flex-col">
      <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Match History</h3>

      <div class="grid grid-cols-[1fr,1fr,1fr] font-bit text-[2vh] 
                  text-gray-300 px-3 py-2 border-b border-cyan-800">
        <span>Opp</span>
        <span>Res</span>
        <span>Date</span>
      </div>

      <div id="matchHistoryList" 
           class="divide-y divide-cyan-800 overflow-y-auto flex-1 min-h-0">
           <div id="matchHistory" class="w-full p-3 bg-cyan-900/30 rounded-xl"></div>
      </div>
    </div>
  </div>

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

//--Match history

  seedTestMatches(1, 2);
  renderLastMatches(user_id);

//--Bio button
  setupBIoButton(user_id, bio);

//--Avatar Button
  setupAvatarPopup(user_id);

  // Display name editor
  setupDisplayNameEditor(user_id, data.display_name || username);

  const logoutBtn = container.querySelector("#logoutBtn");
  logoutBtn?.addEventListener("click", () => {logoutUser()});
}
