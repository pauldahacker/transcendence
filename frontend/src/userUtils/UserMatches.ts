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


export async function seedTestMatches(userId: number, opponentId: number) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No auth token found");

  const now = new Date();

  // 5 partidas con resultados alternos
  const matches = Array.from({ length: 5 }, (_, i) => {
    const userWins = i % 2 === 0; // alterna victorias/derrotas
    return {
      tournament_id: 1,
      match_id: 1000 + i,
      match_date: new Date(now.getTime() - i * 3600 * 1000).toISOString(),
      a_participant_id: userWins ? userId : opponentId,
      b_participant_id: userWins ? opponentId : userId,
      a_participant_score: userWins ? 0 : 2,
      b_participant_score: userWins ? 2 : 1,
      winner_id: userWins ? userId : opponentId,
      loser_id: userWins ? opponentId : userId,
    };
  });

  for (const match of matches) {
    const res = await fetch(`/api/users/match`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(match),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`❌ Error al crear partida ${match.match_id}: ${res.status} ${text}`);
    } else {
      console.log(`✅ Partida ${match.match_id} creada correctamente`);
    }
  }

  console.log("🎮 Seeding de partidas completado");
}
