import { renderGame } from "../views/Game";
import { TournamentState } from "./state";

export function playNextMatch(root: HTMLElement, state: TournamentState) {
  if (!state.active) return;
  if (state.currentMatch >= state.matches.length) {
    alert("Tournament finished! Winners: " + state.winners.join(", "));
    location.hash = "/";
    return;
  }

  const [p1, p2] = state.matches[state.currentMatch];
  root.innerHTML = "";

  state.stopCurrentGame = renderGame(root, {
    player1: p1,
    player2: p2,
    onGameOver: (winnerIndex) => {
      if (!state.active) return;
      const winner = winnerIndex === 1 ? p1 : p2;
      state.winners.push(winner);

      // Find the game container inside the root
      const gameContainer = root.querySelector<HTMLDivElement>("#game-container");
      if (!gameContainer) return;

      // Overlay that only covers the canvas
      const overlay = document.createElement("div");
      overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6 overlay";
      gameContainer.appendChild(overlay);

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Proceed";
      nextBtn.className ="mt-[35vh] w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black";
      
      overlay.appendChild(nextBtn); nextBtn.addEventListener("click", () => {
        if (!state.active) return;
        root.innerHTML = "";
        state.currentMatch++;
        playNextMatch(root, state);
      });
    },
  });
}
