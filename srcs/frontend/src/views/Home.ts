export function renderHome(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[2vh] pb-[5vh] h-screen mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[25vh] animate-wobble">Pong</h1>
    <a href="#/game" 
       class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
              border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
              transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
       1v1
    </a>
    <a href="#/tournament" 
       class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px]
              border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
              transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
       Tournament
    </a>
  `;

  root.appendChild(container);
}
