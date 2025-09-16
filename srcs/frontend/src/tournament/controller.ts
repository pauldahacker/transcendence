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

      state.currentMatch++;
      playNextMatch(root, state);
    },
  });
}
