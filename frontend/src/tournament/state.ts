import { generateMatchId } from "@/userUtils/UserMatch";

export interface TournamentState {
    active: boolean;
    currentMatch: number;
    matches: [string, string][];
    winners: string[];
    stopCurrentGame: (() => void) | null;
    tournamentId: number; // blockchain integration
}
  
export function createTournamentState(matches: [string, string][]): TournamentState {
  return {
      active: true,
      currentMatch: 0,
      matches,
      winners: [],
      stopCurrentGame: null,
      tournamentId: generateMatchId(),
  };
}

//to keep 3d flag after refresh
const STORAGE_KEY = "pong:is3DActive";

export let is3DActive = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "true";
  } catch {
    return false;
  }
})();

export function toggle3D() {
  is3DActive = !is3DActive;
  try {
    localStorage.setItem(STORAGE_KEY, String(is3DActive));
  } catch {}
}

export function set3D(value: boolean) {
  is3DActive = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(is3DActive));
  } catch {}
}