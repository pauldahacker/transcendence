import { startPong } from "../pong/startPong";

type RenderGameOptions = {
  player1?: string;
  player2?: string;
  onGameOver?: (winner: number) => void; // tournament mode hook
};

export function renderGame(root: HTMLElement, options: RenderGameOptions = {}) {
  const { player1 = "Player 1", player2 = "Player 2", onGameOver } = options;

  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[2vh] pb-[2vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[5vh] animate-wobble">Pong</h1>

    <div class="flex items-center justify-center gap-[2vw]">
      <div class="flex flex-col items-center font-honk text-[4vh] text-center">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap w-[8ch]">
          ${player1}
        </div>
        <div class="mt-2 font-bit text-[2vh] text-gray-300">W / S</div>
      </div>
      <div id="game-container" class="relative h-[80vh] aspect-[3/2] 
                max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px]">
        <canvas id="game-canvas" class="bg-cyan-950 w-full h-full border border-gray-500 rounded">
        </canvas>
      </div>
      <div class="flex flex-col items-center font-honk text-[4vh] text-center">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap w-[8ch]">
          ${player2}
        </div>
        <div class="mt-2 font-bit text-[2vh] text-gray-300">Arrow Keys</div>
      </div>
    </div>

    <a id="back-home" href="#/" 
      class="flex items-center justify-center w-[25vw] h-[5vh] rounded-full min-w-[300px]
                border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
                transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Back Home
    </a>
  `;

  root.innerHTML = ""; // clear old screen
  root.appendChild(container);

  const canvas = container.querySelector<HTMLCanvasElement>("#game-canvas")!;
  const gameContainer = container.querySelector<HTMLDivElement>("#game-container")!;
  const backHomeButton = container.querySelector<HTMLAnchorElement>("#back-home")!;

  let stopGame: () => void;

  requestAnimationFrame(() => {
    stopGame = startPong(canvas, (winner: number) => {
      const overlay = document.createElement("div");
      overlay.className = "absolute inset-0 flex justify-center items-center";
      overlay.innerHTML = `
        <div class="relative inline-block text-center">
          <h2 class=" text-[10vh] font-honk text-center animate-zoomIn">
            ${winner === 1 ? player1 : player2} Wins!
          </h2>
        </div>
      `;
      gameContainer.appendChild(overlay);

      if (onGameOver) {
        setTimeout(() => {
          onGameOver(winner);
        }, 2000);
      }
    });
  });

  backHomeButton.addEventListener("click", () => {
    if (stopGame) stopGame(); // cleanup if already started
  });

  return () => {
    if (stopGame) stopGame();
  };
}
