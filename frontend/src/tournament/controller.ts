import { renderGame } from "../views/Game";
import { TournamentState } from "./state";
import { createMatchList } from "./ui";

export function playNextMatch(root: HTMLElement, state: TournamentState) {
  if (!state.active) return;

  const [p1, p2] = state.matches[state.currentMatch];

  root.innerHTML = "";

  state.stopCurrentGame = renderGame(
    root, { tournament: true, player1: p1, player2: p2, aiPlayer1: p1.startsWith("[AI]"), aiPlayer2: p2.startsWith("[AI]"), onGameOver: (winnerIndex) => {
      if (!state.active) return;
      const winner = winnerIndex === 1 ? p1 : p2;
      state.winners.push(winner);

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

      nextBtn.addEventListener("click", () => {
        state.currentMatch++;

        // If 4 players and first round finished, set up final
        if (state.matches.length === 2 && state.currentMatch >= 2) {
          state.matches = [[state.winners[0], state.winners[1]]];
          state.currentMatch = 0;
          state.winners = [];
        }

        // Tournament finished
        if (state.currentMatch >= state.matches.length) {
          alert("Tournament finished! Winner: " + state.winners[0]);
          location.hash = "/";
          return;
        }

        showMatchList(root, state);
      });
    },
  });
}

export function showMatchList(root: HTMLElement, state: TournamentState) {
  root.innerHTML = "";
  const matchListContainer = createMatchList(state.matches, state.winners, state.currentMatch);
  root.appendChild(matchListContainer);

  const playBtn = matchListContainer.querySelector<HTMLButtonElement>("#play")!;
  playBtn.addEventListener("click", () => {
    matchListContainer.remove();
    playNextMatch(root, state);
  });
}
