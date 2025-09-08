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
    <a href="#/" id="back-home" class="mt-4 px-6 py-2 bg-stone-950 text-red-600 rounded-lg shadow hover:text-lime-400 font-bit text-[3vh]">
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
      <h2 class="text-[20vh] animate-bigWobble font-honk text-white drop-shadow-lg text-center">
        Player ${winner} Wins!
      </h2>
    `;
    gameContainer.appendChild(overlay);

    // redirect after 3 seconds
    const timeoutId = setTimeout(() => {
      location.hash = "#/results";
    }, 3000);

    // store cleanup for timeout if user navigates away
    backHomeButton.addEventListener("click", () => {
      clearTimeout(timeoutId);
      overlay.remove();
    }, { once: true });
  });

  // Stop game if user clicks back home
  backHomeButton.addEventListener("click", () => {
    stopGame(); // stops requestAnimationFrame and key listeners
    container.remove(); // remove game container from DOM
  });
}
