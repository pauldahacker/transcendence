import { timeAgo } from "./UserMatchesUtils";

export type Match = {
  tournament_id: number;
  match_id: number;
  match_date: string;
  opponent_username: string;
  user_score: number;
  opponent_score: number;
  result: "win" | "loss";
};


async function getMatchHistory(userId: number): Promise<Match[]> {
    const token = localStorage.getItem("auth_token");
    const url = `/api/users/${userId}/match-history`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
    }); 
    if (!res.ok) {
      const text = await res.text().catch(()=>"");
      throw new Error(`Error ${res.status}: ${text || res.statusText}`);
    }
    return await res.json();
}

export async function renderLastMatches(userId: number) {
  try {
    const matches = await getMatchHistory(userId);
    if (!matches || matches.length === 0){
      document.getElementById("matchHistory")!.innerHTML = `
        <p class="text-gray-400 font-bit text-[2vh] text-center py-10">No matches played</p>`;
        return;
    }
    const list = matches
      .filter((m) => m.tournament_id === 0)
      .map(
        (m) => `
          <li class="grid grid-cols-[1fr,1fr,1fr] px-3 py-2">
            <span>AI</span>
            <span class="${m.user_score > m.opponent_score ? "text-green-500" : "text-red-500"}">
              ${m.user_score} - ${m.opponent_score}
            </span>
            <span>${timeAgo(m.match_date)}</span>
          </li>`
      )
      .join("");

    document.getElementById("matchHistory")!.innerHTML = `<ul class="w-full text-gray-400 font-bit text-[2vh]">${list}</ul>`;
  } catch (err) {
    console.error("Error al obtener el historial:", err);
    document.getElementById("matchHistory")!.innerHTML = `
        <p class="text-gray-400 font-bit text-[2vh] text-center py-10">No matches found</p>`;
  }
}


export async function getTournamentWins(userId: number): Promise<number> {
  try {
    const matches = await getMatchHistory(userId);

    const tournamentWins = matches.filter(
      (m) => m.tournament_id !== 0 && m.result === "win"
    ).length;

    return tournamentWins;
  } catch (err) {
    console.error("Error getting tournament wins:", err);
    return 0;
  }
}
