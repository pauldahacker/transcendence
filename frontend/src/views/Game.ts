import { startPong } from "../pong/startPong";
import { startPong3D } from "../3d/renderStart";
import { is3DActive } from "@/tournament/state";
import { postMatch, generateMatchId } from "@/userUtils/UserMatch";
import { getUserIdFromToken } from "@/userUtils";
import { isUserLoggedIn } from "@/userUtils";

type RenderGameOptions = {
  onePlayer?: boolean;
  tournament?: boolean;

  player1?: string;
  player2?: string;
  aiPlayer1?: boolean;
  aiPlayer2?: boolean;
  onGameOver?: (winner: number) => void;
};

/*
renderGame mounts Pong into the DOM and configures players.
By default, it mounts a 2-player (Human vs Human) non-tournament game.
But the onePlayer or tournament flag can be set for adaptability.

Handles overlays for Winner message, Play Again button, or Proceed to next match.

Returns a cleanup function to stop the game when leaving the page.
*/
export function renderGame(root: HTMLElement, options: RenderGameOptions = {}) {
  const {
    onePlayer = false,
    tournament = false,
    onGameOver
  } = options;

  let p1 = options.player1 ?? "Player 1";
  let p2 = options.player2 ?? "Player 2";
  let aiP1 = options.aiPlayer1 ?? false;
  let aiP2 = options.aiPlayer2 ?? false;
  if (onePlayer)
  {
    p1 = "AI";
    p2 = "You";
    aiP1 = true;
    aiP2 = false;
  }

  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[2vh] pb-[2vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[5vh] animate-wobble">Pong</h1>

    <div class="flex items-center justify-center gap-[2vw]">
      <div class="flex flex-col items-center font-honk text-[4vh] text-center">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap w-[8ch]">
          ${p1}
        </div>
        ${aiP1 ? "" : `<div class="mt-2 font-bit text-[2vh] text-gray-300">W / S</div>`}
      </div>
      <div id="game-container" class="relative h-[80vh] aspect-[3/2] 
                max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px]">
        <canvas id="game-canvas" class="bg-cyan-950 w-full h-full border border-gray-500 rounded">
        </canvas>
      </div>
      <div class="flex flex-col items-center font-honk text-[4vh] text-center">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap w-[8ch]">
          ${p2}
        </div>
        ${aiP2 ? "" : `<div class="mt-2 font-bit text-[2vh] text-gray-300">Arrow Keys</div>`}
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

    //we choose if 3d or no
    const start = is3DActive ? startPong3D : startPong;

    stopGame = start(
      canvas,
      async (winner: number) => {
        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6";
        
		if (!(aiP2 && aiP1)){
			await postMatch({
				tournament_id: 0,
				a_participant_score: 11,
				b_participant_score: 7,
			});
		}
        // Winner message
        if (onePlayer) {
          overlay.innerHTML =
            winner === 1
              ? `<h2 class="text-[10vh] font-honk text-center animate-zoomIn">You lost!</h2>`
              : `<h2 class="text-[10vh] font-honk text-center animate-zoomIn">You won!</h2>`;
        } else {
          overlay.innerHTML = `
            <h2 class="text-[10vh] font-honk text-center animate-zoomIn">
              ${winner === 1 ? p1 : p2} Won!
            </h2>
          `;
        }
        gameContainer.appendChild(overlay);
    
        setTimeout(() => {
          if (tournament && onGameOver) {
            // tournament: go to next match
            onGameOver(winner);
          } else {
            // normal game: show Play Again
            const buttonOverlay = document.createElement("div");
            buttonOverlay.className =
              "absolute inset-0 flex flex-col justify-center items-center gap-6";
        
            const playAgainBtn = document.createElement("button");
            playAgainBtn.textContent = "Play Again";
            playAgainBtn.className =
              "mt-[35vh] w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg " +
              "transition-colors duration-300 hover:bg-lime-500 hover:text-black";
    
            playAgainBtn.addEventListener("click", () => {
              if (stopGame) stopGame();
              renderGame(root, options); // restart with same settings
            });
    
            buttonOverlay.appendChild(playAgainBtn);
            gameContainer.appendChild(buttonOverlay);
          }
        }, 2000);
      },
      { aiPlayer1: aiP1, aiPlayer2: aiP2 }
    );
    
  }
);

  backHomeButton.addEventListener("click", () => {
    if (stopGame) stopGame(); // cleanup if already started
  });

  return () => {
    if (stopGame) stopGame();
  };
}
