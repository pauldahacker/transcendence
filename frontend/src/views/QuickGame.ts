import { isUserLoggedIn, getDisplayName } from "@/userUtils";

export async function renderQuickGame(root: HTMLElement) {
  const loggedIn = await isUserLoggedIn();
  const displayName = loggedIn ? await getDisplayName() : "Guest";

  const container = document.createElement("div");
  container.className = "flex flex-col justify-center items-center h-screen gap-8 text-center";

  container.innerHTML = `
    <h1 class="font-honk text-[15vh] animate-wobble">Quick Game</h1>

    <p class="font-bit text-[3vh] text-gray-200">Choose your opponent:</p>

    <div class="flex flex-col gap-6">
      <a href="#/quickgame/ai"
        class="w-[25vw] min-w-[300px] h-[8vh] flex items-center justify-center rounded-full
               border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
               transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        VS AI
      </a>

      <a href="#/quickgame/player"
        class="w-[25vw] min-w-[300px] h-[8vh] flex items-center justify-center rounded-full
               border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
               transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        VS Player
      </a>
    </div>

    <a href="#/home" 
      class="mt-10 w-[20vw] min-w-[200px] h-[6vh] flex items-center justify-center rounded-full
             border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
             transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Back Home
    </a>
  `;

  root.innerHTML = "";
  root.appendChild(container);
}
