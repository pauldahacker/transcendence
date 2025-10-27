import { getUserStats } from "./UserStats"; // o el path correcto

export async function getUserRank(user_id: number): Promise<number | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  const users = await fetch("/api/users/", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const stats = await Promise.all(
    users.map(async (u: any) => {
      try {
        return await getUserStats(u.id);
      } catch {
        return null;
      }
    })
  );
  const ranked = stats
    .map((s, i) => {
      if (!s || s.total_games === 0) return null;
      const winRate = s.wins / (s.wins + s.losses);
      const score = 0.5 * winRate + 0.5 * s.wins;
      return { id: users[i].id, score };
    })
    .filter(Boolean)
    .sort((a, b) => (b as any).score - (a as any).score);

  const rank = ranked.findIndex((r: any) => r.id === user_id);
  return rank >= 0 ? rank + 1 : null;
}
