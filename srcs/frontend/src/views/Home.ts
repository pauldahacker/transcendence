export function renderHome(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[2vh] pb-[5vh] h-screen mx-auto my-auto";

  container.innerHTML = `
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
        Play a local tournament (1–4 players)
      </span>
    </div>

    <div class="relative group flex items-center">
      <a href="#/game3d" 
        class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
               border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
               transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Pong 3D
      </a>
      <span class="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-black text-gray-100 
                   text-[2vh] font-bit opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Pong 3D!
      </span>
    </div>
  `;

  root.appendChild(container);
}
