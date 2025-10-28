import { is3DActive } from "../tournament/state";
import { setup3DSwitch } from "../3d/3dswitch";
import { isUserLoggedIn } from "@/userUtils/TokenUtils";
import { initSearchButton } from "@/friends/searchBtn";
import { initNewsButton, updateNewsBadge } from "@/friends/newsBtn";
import { fetchIncomingFriendRequests } from "@/friends/fetchFriendRequests";

export async function renderHome(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[2vh] pb-[5vh] h-screen mx-auto my-auto";
    const logged = await isUserLoggedIn();
    
    let link = "#/login"
    let linktext = "Login"
    if (logged){
       link = "#/profile"
       linktext = "My Profile"
    }

    container.innerHTML = `
    <div class="absolute top-[2vh] right-[3vw] flex items-center gap-3">
      ${logged ? `
      <button id="newsBtn"
        class="relative border-2 border-gray-100 rounded-full px-4 py-2 
          transition-all duration-300 hover:bg-gray-100 hover:text-cyan-900 flex items-center gap-2">
        <img src="src/imgs/bell.png" alt="Search" class="w-[3.5vh] h-[3.5vh] inline-block" />
        <span id="newsBadge"
          class="hidden absolute top-0 right-0 -translate-x-1/2 -translate-y-1/2  bg-red-600 rounded-full text-white 
          text-xs w-5 h-5 flex items-center justify-center font-bit"></span>
      </button>
      <button id="searchBtn"
        class="font-bit text-[2.5vh] text-gray-100 border-2 border-gray-100 rounded-full px-4 py-2 
          transition-all duration-300 hover:bg-gray-100 hover:text-cyan-900 flex items-center gap-2">
        <img src="src/imgs/lupa2.png" alt="Search" class="w-[3.5vh] h-[3.5vh] inline-block" />
      </button>
      ` : ''}

      <a href="${link}"
        class="font-bit text-[2.5vh] text-gray-100 border-2 border-gray-100 rounded-full px-6 py-2 
          transition-all duration-300 hover:bg-gray-100 hover:text-cyan-900">
        ${linktext}
      </a>
    </div>
  
    <h1 class="font-honk text-[20vh] animate-wobble">Pong</h1>

    <div class="relative group flex items-center">
      <a href="#/1player" 
        class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
               border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
               transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        1 player
      </a>
      <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
                   text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Play against an AI opponent
      </span>
    </div>

    <div class="relative group flex items-center">
      <a href="#/2players" 
        class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
               border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
               transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        2 players
      </a>
      <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
                   text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Play against a friend on the same keyboard
      </span>
    </div>

    <div class="relative group flex items-center">
      <a href="#/tournament" 
        class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
               border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
               transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Tournament
      </a>
      <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
                   text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Play a local tournament (1-4 players)
      </span>
    </div>

    <div class="flex items-center justify-center gap-4">
      <span class="font-bit text-[3vh] text-gray-100 select-none">3D MODE</span>

      <label
        id="switch3d-label"
        class="relative inline-block w-[90px] h-[40px] rounded-sm cursor-pointer transition-all duration-300
        ${is3DActive
          ? 'bg-black border-4 border-cyan-500 shadow-[0_0_10px_#00ffff,0_0_25px_#00ffff,inset_0_0_10px_#00ffff]'
          : 'bg-gray-800 border-4 border-gray-600 shadow-none'}">
        
        <input type="checkbox" id="switch3d" class="hidden" ${is3DActive ? "checked" : ""}>
        
        <div id="switch3d-knob"
          class="absolute top-[4px] left-[4px] w-[32px] h-[28px] rounded-sm border-2 transition-all duration-300 ease-in-out
          ${is3DActive
            ? 'translate-x-[46px] bg-gradient-to-br from-pink-300 to-pink-500 border-pink-200 shadow-[0_6px_12px_rgba(255,0,128,0.35)]'
            : 'bg-gray-300 border-gray-400 shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]'}">
        </div>
      </label>
    </div>
  `;

  root.appendChild(container);

  setup3DSwitch(container); 
  initSearchButton();
  initNewsButton();
  if (logged) {
    // update notifications every 5 seconds
    setInterval(async () => {
      try {
        const requests = await fetchIncomingFriendRequests();
        updateNewsBadge(requests.length);
      } catch (err) {
        console.error("Failed to refresh news badge:", err);
      }
    }, 5000);
  }
}

