import { startPong } from "./pong";

export function renderGame(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center h-screen gap-[1vh] pb-[5vh] min-h-[400px] min-w-[600px] relative";

  container.innerHTML = `
    <h1 class="font-honk text-[8vh]">Pong Game</h1>
    <div id="game-container" class="relative h-[80vh] aspect-[3/2] max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px]">
      <canvas id="game-canvas" class="bg-black w-full h-full border border-gray-500 rounded"></canvas>
    </div>
    <a id="back-home" href="#/" 
       class="flex items-center justify-center w-[400px] h-[80px] rounded-full
              border-2 border-white text-white font-bit text-[5vh]
              transition-colors duration-300 hover:bg-white hover:text-cyan-900">
       Back Home
    </a>
  `;

  root.appendChild(container);

  const canvas = container.querySelector<HTMLCanvasElement>("#game-canvas")!;
  const gameContainer = container.querySelector<HTMLDivElement>("#game-container")!;
  const backHomeButton = container.querySelector<HTMLAnchorElement>("#back-home")!;

  // Call startPong and get the cleanup function
  const stopGame = startPong(canvas, (winner: number) => {
    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 flex justify-center items-center";
    overlay.innerHTML = `
      <h2 class="text-[15vh] animate-bigWobble font-honk text-white drop-shadow-lg text-center">
        Player ${winner} Wins!
      </h2>
    `;
    gameContainer.appendChild(overlay);

    // redirect after 3 seconds
    const timeoutId = setTimeout(() => {
      location.hash = "#/results";
    }, 3000);

    // store cleanup for timeout if user clicks back home
    backHomeButton.addEventListener("click", () => {
      clearTimeout(timeoutId);
      overlay.remove();
    }, { once: true });
  });

  // Stop game if user clicks back home
  backHomeButton.addEventListener("click", () => {
    stopGame();       // stops requestAnimationFrame and key listeners
    container.remove(); // remove game container from DOM
  });
}
