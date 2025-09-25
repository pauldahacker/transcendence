export interface TournamentState {
    active: boolean;
    currentMatch: number;
    matches: [string, string][];
    winners: string[];
    stopCurrentGame: (() => void) | null;
}
  
export function createTournamentState(matches: [string, string][]): TournamentState {
  return {
      active: true,
      currentMatch: 0,
      matches,
      winners: [],
      stopCurrentGame: null,
  };
}
  