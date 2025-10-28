import { postFinalToChain } from "@/blockchain/postFinal";
import { renderGame } from "../views/Game";
import { TournamentState } from "./state";
import { createMatchList } from "./ui";
import type { GameOverState } from "@/pong/types";

export async function playNextMatch(root: HTMLElement, state: TournamentState) {
  if (!state.active) return;

  const [p1, p2] = state.matches[state.currentMatch];
  const aiP1 = p1.startsWith("[AI]");
  const aiP2 = p2.startsWith("[AI]");
  root.innerHTML = "";

  state.stopCurrentGame = renderGame(root, {
    tournament: true,
    tournamentState: state,
    player1: p1,
    player2: p2,
    aiPlayer1: aiP1,
    aiPlayer2: aiP2,

    onGameOver: async (result: GameOverState) => {
      if (!state.active) return;

      const resolvedWinner = result.winner === 1 ? p1 : p2;
      state.winners.push(resolvedWinner);

      const gameContainer = root.querySelector<HTMLDivElement>("#game-container");
      if (!gameContainer) return;

      const overlay = document.createElement("div");
      overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6 overlay";
      gameContainer.appendChild(overlay);

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Proceed";
      nextBtn.className =
        "mt-[35vh] w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black";
      overlay.appendChild(nextBtn);

      nextBtn.addEventListener("click", async () => {
        document.querySelectorAll(".overlay").forEach(el => el.remove());
        state.currentMatch++;

        // Handle final in 4-player tournament
        if (state.matches.length === 2 && state.currentMatch >= 2) {
          state.matches = [[state.winners[0], state.winners[1]]];
          state.currentMatch = 0;
          state.winners = [];
        }

        // Tournament finished
        if (state.currentMatch >= state.matches.length) {
          const finalOverlay = document.createElement("div");
          finalOverlay.className =
            "absolute inset-0 flex flex-col justify-center items-center gap-6 overlay bg-black/80 text-white font-bit text-center";

          const title = document.createElement("h2");
          title.textContent = "Tournament Finished";
          title.className = "text-[10vh] text-stone-600 mb-4";
          finalOverlay.appendChild(title);

          const msg = document.createElement("p");
          msg.textContent = `${resolvedWinner} won!`;
          msg.className = "text-[8vh] mb-6 text-lime-400 animate-bounce drop-shadow-[0_0_10px_gold]";
          finalOverlay.appendChild(msg);

          // Only store if real user played — not AI vs AI
          if (!(aiP1 && aiP2)) {
            const pointsToWin = 3;
            const winnerAlias = resolvedWinner;
            
            postFinalToChain({
              tournament_id: state.tournamentId,
              winner_alias: winnerAlias,
              score_a: result.score1,
              score_b: result.score2,
              points_to_win: pointsToWin,
            })
            .then(res => {
              if (res.txHash) {
                const bcBtn = document.createElement("a");
                bcBtn.href = `https://testnet.snowtrace.io/tx/${res.txHash}`;
                bcBtn.target = "_blank";
                bcBtn.rel = "noopener noreferrer";
                bcBtn.textContent = "View Blockchain Transaction";
                bcBtn.className = "mt-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors duration-200";
                finalOverlay.appendChild(bcBtn);
              }
            })
            .catch(err => console.error("Failed to record final on blockchain:", err));
          }

          const homeBtn = document.createElement("button");
          homeBtn.textContent = "Back to Home";
          homeBtn.className =
            "w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black min-w-[300px]";
          homeBtn.addEventListener("click", () => {
            location.hash = "/";
          });
          finalOverlay.appendChild(homeBtn);

          gameContainer.appendChild(finalOverlay);
          return;
        }

        showMatchList(root, state);
      });
    },
  });
}

export function showMatchList(root: HTMLElement, state: TournamentState) {
  root.innerHTML = "";
  const container = createMatchList(state.matches, state.winners, state.currentMatch);
  root.appendChild(container);

  container.querySelector("#play")?.addEventListener("click", () => {
    playNextMatch(root, state);
  });
}
