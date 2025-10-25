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
    const container = document.getElementById("matchHistory")!;
    if (!matches || matches.length === 0) {
      container.innerHTML = `
        <p class="text-gray-400 font-bit text-[2vh] text-center py-10">
          No matches played
        </p>`;
      return;
    }
    const trophy_url = new URL("../imgs/trophy.png", import.meta.url).href;

    const list = matches
      .map((m) => {
        const isTournament = (m.tournament_id !== 0 && (m.user_score > m.opponent_score));
        const icon = isTournament
          ? `<img src=${trophy_url} alt="Tournament" class="inline w-3 h-3 mr-0 align-middle" />`: "-";

        return `
          <li class="grid grid-cols-[1fr,1fr,1fr] px-3 py-2 items-center">
            <span class="flex items-center gap-1">
              <span>AI</span>
            </span>
            <span class="${
              m.user_score > m.opponent_score
                ? "text-green-500"
                : "text-red-500"
            }">
              ${m.user_score} ${icon} ${m.opponent_score}
            </span>
            <span>${timeAgo(m.match_date)}</span>
          </li>`;
      })
      .join("");

    container.innerHTML = `<ul class="w-full text-gray-400 font-bit text-[2vh]">${list}</ul>`;
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
