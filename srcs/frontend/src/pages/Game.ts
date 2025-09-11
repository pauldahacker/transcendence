import { startPong } from "../pong/startPong";

// renderGame can take additional options as arguments
type RenderGameOptions = {
  player1?: string;
  player2?: string;
  onGameOver?: (winner: number) => void;
};

export function renderGame(root: HTMLElement, options: RenderGameOptions = {}) {
  const { player1 = "Player 1", player2 = "Player 2", onGameOver } = options;

  const container = document.createElement("div");
  container.className =
  "flex flex-col justify-between items-center h-screen pt-[2vh] pb-[2vh] min-h-[400px] min-w-[600px] relative";

  container.innerHTML = `
  <h1 class="font-honk text-[5vh] animate-wobble">Pong 1v1</h1>

  <div class="flex items-center justify-center gap-[2vw]">
    <div class="font-honk text-[5vh] truncate">${player1}</div>
    <div id="game-container" 
         class="relative h-[80vh] aspect-[3/2] 
                max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] 
                min-w-[300px] min-h-[200px]">
      <canvas id="game-canvas" 
              class="bg-cyan-950 w-full h-full border border-gray-500 rounded"></canvas>
    </div>
    <div class="font-honk text-[5vh] truncate">${player2}</div>
  </div>

  <a id="back-home" href="#/" 
    class="flex py-[] items-center justify-center w-[25vw] h-[5vh] rounded-full
              border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
              transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
     Back Home
  </a>
`;


  root.appendChild(container);

  const canvas = container.querySelector<HTMLCanvasElement>("#game-canvas")!;
  const gameContainer = container.querySelector<HTMLDivElement>("#game-container")!;
  const backHomeButton = container.querySelector<HTMLAnchorElement>("#back-home")!;

  const stopGame = startPong(canvas, (winner: number) => {
    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 flex justify-center items-center";
    overlay.innerHTML = `
    <div class="relative inline-block text-center">
  <h2 class="absolute inset-0 text-[10vh] font-bit text-lime-500 text-center animate-zoomIn
             [text-shadow:-2px_-2px_0_#fff,2px_-2px_0_#fff,-2px_2px_0_#fff,2px_2px_0_#fff]">
    ${winner === 1 ? player1 : player2} Wins!
  </h2>

  <h2 class="relative text-[10vh] font-bit text-lime-500 text-center animate-zoomIn">
    ${winner === 1 ? player1 : player2} Wins!
  </h2>
</div>
    `;
    gameContainer.appendChild(overlay);

    const timeoutId = setTimeout(() => {
      location.hash = "#/results";
      if (onGameOver) onGameOver(winner);
    }, 4000);

    backHomeButton.addEventListener(
      "click",
      () => {
        clearTimeout(timeoutId);
        overlay.remove();
      },
      { once: true }
    );
  });

  backHomeButton.addEventListener("click", () => {
    stopGame();
    container.remove();
  });
}
