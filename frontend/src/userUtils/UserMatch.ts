import { getUserIdFromToken, isUserLoggedIn } from "./TokenUtils";
export interface MatchData {
    tournament_id: number;
//    match_id: number;
//    match_date: string;
//    a_participant_id: number;
//    b_participant_id: number;
    a_participant_score: number;
    b_participant_score: number;
//    winner_id: number;
//    loser_id: number;
}

export async function postMatch({
      tournament_id,
//    match_id,
//    match_date,
//    a_participant_id,
//    b_participant_id,
    a_participant_score,
    b_participant_score,
//    winner_id,
//    loser_id,
}: MatchData) {
    const logged = await isUserLoggedIn();
    if (!logged){console.error("User not logged in"); return;}
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("No token found");
    const userId = getUserIdFromToken(token);
    const match_id = tournament_id ? 0 : generateMatchId();
    const match_date = new Date().toISOString();
    const a_participant_id = userId;
    const b_participant_id = null;
    const winner_id = a_participant_score > b_participant_score ? userId : null;
    const loser_id = b_participant_score > a_participant_score ? userId : null;

    if (!tournament_id){
        const match_id = generateMatchId();
    }
    console.log("Sending match:", {
  tournament_id,
  match_id,
  match_date,
  a_participant_id,
  b_participant_id,
  a_participant_score,
  b_participant_score,
  winner_id,
  loser_id
});
    const res = await fetch("/api/users/match", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tournament_id,
            match_id,
            match_date,
            a_participant_id,
            b_participant_id,
            a_participant_score,
            b_participant_score,
            winner_id,
            loser_id
        })
    });

    if (!res.ok){
        const err = await res.text();
        throw new Error(`Error ${res.status}: ${err}`);
    }
    console.log("Match posted");
    return await res.json();
}

export function generateMatchId() : number {
    return Date.now()
}