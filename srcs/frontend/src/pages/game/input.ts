import { KeyState } from "./types";

export function setupInput(keys: KeyState) {
  function handleKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}
