import { getUsernameFromToken } from "@/userUtils/TokenUtils";
import { logout } from "@/userUtils/LogoutUser";

export function renderProfile(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col items-center justify-start min-h-[400px] min-w-[600px] gap-[3vh] pb-[5vh] h-screen pt-[8vh]";

  // Datos base
  const token = localStorage.getItem("auth_token");
  let username = "Player"; // valor por defecto

  if (token) {
    const decoded = getUsernameFromToken(token);
    if (decoded) username = decoded;
  }
  const avatarUrl = new URL("../avatarDefault/avatar.png", import.meta.url).href;
  const wins = 15;
  const losses = 10;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Profile</h1>

    <!-- Avatar + Nombre -->
    <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 rounded-3xl p-[3vh] shadow-xl w-[30vw]">
      <!-- Wrapper con overlay de hover -->
      <div id="avatarWrapper" class="relative group cursor-pointer mb-[2vh]">
        <img id="avatarImg" src="${avatarUrl}" alt="User Avatar"
             class="w-[15vh] h-[15vh] rounded-full border-4 border-cyan-500 shadow-[0_0_15px_#00ffff] object-cover">
        <!-- Overlay -->
        <div class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bit text-[2.2vh] text-white select-none">Change avatar</span>
        </div>
      </div>
      <h2 class="font-bit text-[4vh] text-gray-100">${username}</h2>
    </div>

    <!-- Stats -->
    <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 rounded-3xl p-[3vh] shadow-xl w-[30vw]">
      <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Game Stats</h3>
      <div class="flex justify-between w-full px-[2vw] font-bit text-[2.5vh]">
        <span class="text-green-400">Wins: ${wins}</span>
        <span class="text-red-400">Losses: ${losses}</span>
      </div>

      <div class="mt-[2vh] w-[90%] bg-red-400 rounded-full h-[2.5vh] overflow-hidden">
        <div class="h-full bg-green-400 transition-all duration-500" style="width: ${winRate}%"></div>
      </div>

      <p class="font-bit text-gray-100 text-[2.2vh] mt-[1vh]">${winRate}% Win Rate</p>
    </div>

    <!-- Back Home -->
    <a href="#/"
       class="flex items-center justify-center w-[25vw] h-[7vh] mt-[4vh] rounded-full
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

  const progressBar = container.querySelector(".bg-green-400");
  if (progressBar instanceof HTMLElement)
    progressBar.style.width = `${winRate}%`;  

  const logoutBtn = container.querySelector("#logoutBtn");
  logoutBtn?.addEventListener("click", () => {logout()});

}
