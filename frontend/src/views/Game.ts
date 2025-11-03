import { startPong } from "@/pong/startPong";
import { startPong3D } from "@/3d/renderStart";
import { is3DActive, type TournamentState } from "@/tournament/state";
import { postMatch, generateMatchId } from "@/userUtils/UserMatch";
import { getDisplayName, isUserLoggedIn } from "@/userUtils";
import type { GameOverState } from "@/pong/types";

type RenderGameOptions = {
  onePlayer?: boolean;
  tournament?: boolean;
  tournamentState?: TournamentState;
  player1?: string;
  player2?: string;
  aiPlayer1?: boolean;
  aiPlayer2?: boolean;
  onGameOver?: (result: GameOverState, tournament?: TournamentState) => void;
};

export async function renderGame(root: HTMLElement, options: RenderGameOptions = {}) {
  const { onePlayer = false, tournament = false, tournamentState, onGameOver } = options;

  const loggedIn = await isUserLoggedIn();
  const displayName = loggedIn ? await getDisplayName() : null;

  let p1 = options.player1 ?? "Player 1";
  let p2 = options.player2 ?? "Player 2";
  let aiP1 = options.aiPlayer1 ?? false;
  let aiP2 = options.aiPlayer2 ?? false;
  const skipRef = { current: false };

  if (loggedIn) {
    if (onePlayer) {
      p1 = "AI";
      p2 = displayName ?? "You";
      aiP1 = true;
      aiP2 = false;
    } else if (!tournament) {
      p1 = "Guest";
      p2 = displayName ?? "You";
    }
  } else {
    if (onePlayer) {
      p1 = "AI";
      p2 = "You";
      aiP1 = true;
      aiP2 = false;
    } else if (!tournament) {
      p1 = "Guest 1";
      p2 = "Guest 2";
    }
  }

  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[2vh] pb-[2vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[5vh] animate-wobble">Pong</h1>

    <div class="flex items-center justify-center gap-[2vw]">
      <div class="flex flex-col items-center font-honk text-[4vh] text-center">
        <input id="player1-name" 
              maxlength="8";
              value="${p1}" 
              ${onePlayer || tournament ? "readonly" : ""}
              class="bg-transparent border-b border-gray-400 text-center w-[8ch] outline-none focus:border-lime-400 transition-all duration-200">
        ${aiP1 ? "" : `<div class="mt-2 font-bit text-[2vh] text-gray-300">W / S</div>`}
      </div>

      <div id="game-container" class="relative h-[80vh] aspect-[3/2] 
                max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px]">
        <canvas id="game-canvas" class="bg-cyan-950 w-full h-full border border-gray-500 rounded">
        </canvas>
      </div>

      <div class="flex flex-col items-center font-honk text-[4vh] text-center">
        <input id="player2-name" 
              maxlength="8";
              value="${p2}" 
              ${(loggedIn || tournament) ? "readonly" : ""}
              class="bg-transparent border-b border-gray-400 text-center w-[8ch] outline-none focus:border-lime-400 transition-all duration-200">
        ${aiP2 ? "" : `<div class="mt-2 font-bit text-[2vh] text-gray-300">Arrow Keys</div>`}
      </div>
    </div>

    <a id="back-home" href="#/home" 
      class="flex items-center justify-center w-[25vw] h-[5vh] rounded-full min-w-[300px]
                border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
                transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Back Home
    </a>
  `;

  root.innerHTML = "";
  root.appendChild(container);

  const canvas = container.querySelector<HTMLCanvasElement>("#game-canvas")!;
  const gameContainer = container.querySelector<HTMLDivElement>("#game-container")!;
  const backHomeButton = container.querySelector<HTMLAnchorElement>("#back-home")!;
  const player1Input = container.querySelector<HTMLInputElement>("#player1-name")!;
  const player2Input = container.querySelector<HTMLInputElement>("#player2-name")!;

  // Duplicate name validation
  const errorMsg = document.createElement("p");
  errorMsg.id = "name-error";
  errorMsg.className = "mt-2 text-center font-bit text-[2vh] text-red-400 hidden";
  container.insertBefore(errorMsg, backHomeButton); // show above Back Home button

  function checkDuplicateNames() {
    const name1 = player1Input.value.trim().toLowerCase();
    const name2 = player2Input.value.trim().toLowerCase();

    if (name1 && name2 && name1 === name2) {
      errorMsg.textContent = "Duplicate player names are not allowed.";
      errorMsg.classList.remove("hidden");
      return false;
    } else {
      errorMsg.textContent = "";
      errorMsg.classList.add("hidden");
      return true;
    }
  }

  // Watch for user edits
  [player1Input, player2Input].forEach(input => {
    input.addEventListener("input", checkDuplicateNames);
  });

  function disableAliasEditing() {
    const inputs = [player1Input, player2Input];
    inputs.forEach(input => {
      input.readOnly = true;
      input.classList.add("opacity-70", "cursor-not-allowed");
      input.blur();
    });
  }

  let stopGame: () => void;

  requestAnimationFrame(() => {
    while (!checkDuplicateNames()) ; 
    const start = is3DActive ? startPong3D : startPong;

    stopGame = start(
      canvas,
      async (result: GameOverState) => {
        const { winner, score1, score2 } = result;
        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6 overlay";
        const player1Name = player1Input.value.trim();
        const player2Name = player2Input.value.trim();

        const displayName = await getDisplayName();
        if (player1Name == displayName || player2Name == displayName) {
          const userScore = player1Name == displayName ? score1 : score2;
          const opponentScore = player1Name == displayName ? score2 : score1;
          const opponentName = player1Name !== displayName ? player1Name : player2Name;
          const isTournamentFinal = tournament && tournamentState && (tournamentState.currentMatch >= tournamentState.matches.length);
          try {
            await postMatch({
              tournament_id: isTournamentFinal ? generateMatchId() : 0,
              a_participant_alias: displayName,
              b_participant_alias: opponentName,
              a_participant_score: userScore,
              b_participant_score: opponentScore,
            });
          } catch (error) {
            console.error("Failed to post match", error);
          }
        }

        const winnerName = winner === 1 ? player1Input.value : player2Input.value;
        overlay.innerHTML = `
          <h2 class="text-[10vh] font-honk text-center animate-zoomIn">
            ${winnerName} won!
          </h2>
        `;
        gameContainer.appendChild(overlay);

        setTimeout(() => {
          if (tournament && onGameOver) {
            onGameOver(result, tournamentState);
          } else {
            const buttonOverlay = document.createElement("div");
            buttonOverlay.className =
              "absolute inset-0 flex flex-col justify-center items-center gap-6";
            const playAgainBtn = document.createElement("button");
            playAgainBtn.textContent = "Play Again";
            playAgainBtn.className =
              "mt-[35vh] w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black";
            playAgainBtn.addEventListener("click", () => {
              if (stopGame) stopGame();
              renderGame(root, options); // restart
            });
            buttonOverlay.appendChild(playAgainBtn);
            gameContainer.appendChild(buttonOverlay);
          }
        }, 2000);
      },
      { aiPlayer1: aiP1,
        aiPlayer2: aiP2,
        onStart: disableAliasEditing,
        canStart: checkDuplicateNames },
        skipRef//SKIP BUTTON ------------------------------
    );
  });

  backHomeButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (stopGame) stopGame();
    window.location.hash = "#/home"; // ensure SPA route change
  });

  if (aiP1 && aiP2){
    const skipBtn = document.createElement("button");
    skipBtn.textContent = "Skip game";
    skipBtn.className = `
      absolute top-2 right-2 z-50
      px-3 py-1 rounded-md
      bg-black/60 text-white font-bit text-[2vh]
      border border-white/30 shadow-md
      hover:bg-white hover:text-black hover:border-transparent
      transition-colors duration-200
    `;
    gameContainer.appendChild(skipBtn);

    const handleSkipClick = () => {
      //skipGame = true;
      //skipBtn.textContent = "Skipping…";
      skipRef.current = true;
      skipBtn.disabled = true;
      skipBtn.classList.add("opacity-60", "cursor-not-allowed");
    };
    skipBtn.addEventListener("click", handleSkipClick);
  }
  

  return () => {
    if (stopGame) stopGame();
  };
}
