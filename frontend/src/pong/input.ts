import { KeyState, GameState } from "./types";

// Attaches key listeners and fills the keys object.
// Returns a cleanup function to remove the listeners later.
export function setupInput(keys: KeyState, aiPlayer1: boolean, aiPlayer2: boolean) {
  function handleKeyDown(e: KeyboardEvent) {
    // Block human input if that player is AI-controlled
    if (aiPlayer1 && (e.key === "w" || e.key === "s")) return;
    if (aiPlayer2 && (e.key === "ArrowUp" || e.key === "ArrowDown")) return;

    keys[e.key] = true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (aiPlayer1 && (e.key === "w" || e.key === "s")) return;
    if (aiPlayer2 && (e.key === "ArrowUp" || e.key === "ArrowDown")) return;

    keys[e.key] = false;
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}
