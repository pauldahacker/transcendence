export interface FinalMatchData {
  tournament_id: number;
  winner_alias: string;
  score_a: number;
  score_b: number;
  points_to_win: number;
}

export async function postFinalToChain({
  tournament_id,
  winner_alias,
  score_a,
  score_b,
  points_to_win,
}: FinalMatchData) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("User not logged in");
  const res = await fetch("/api/blockchain/finals", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tournament_id,
      winner_alias,
      score_a,
      score_b,
      points_to_win,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to post to blockchain");
  }

  const data = await res.json(); // { txHash: "0x..." }
  console.log("Blockchain response:", data); // Debug print
  return data;
}