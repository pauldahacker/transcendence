type Match = {
  gameId: string;
  player1: { alias: string; score: number };
  player2: { alias: string; score: number };
  winner: string | null;
  duration: number;
  playedAt: string;
};

async function getMatchHistory(userId: number, page = 1, limit = 10): Promise<{ games: Match[], pagination?: any }> {
    const token = localStorage.getItem("auth_token");
    const url = `/api/games/history?page=1&limit=10&userId=${userId}`;
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

    const list = matches.games
      .map(
        (m) => `
        <li class="flex justify-between border-b border-gray-500 py-2">
          <span>${m.player1.alias} ${m.player1.score} - ${m.player2.score} ${m.player2.alias}</span>
          <span>${new Date(m.playedAt).toLocaleString()}</span>
        </li>`
      )
      .join("");

    document.getElementById("matchHistory")!.innerHTML = `
      <ul class="w-full text-gray-400 font-bit text-[2vh]">${list}</ul>`;
  } catch (err) {
    console.error("Error al obtener el historial:", err);
    document.getElementById("matchHistory")!.innerHTML = `
        <p class="text-gray-400 font-bit text-[2vh] text-center py-10">No matches found</p>`;
  }
}
