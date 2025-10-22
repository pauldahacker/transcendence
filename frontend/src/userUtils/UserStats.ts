import { getUserIdFromToken } from "./TokenUtils";

export type UserStats = {
	total_games: number;
	wins: number;
	losses: number;
  };
  
export type UserData = {
	username: string;
	display_name: string;
	avatar_url: string;
	bio: string;
	created_at: string;
	friends: number[];
  };

export async function getUserStats(userId: number) {
  if (userId == 0)
    throw Error("User id not found.");
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/users/${userId}/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok){
	console.log(`Error al acceder a /api/users/${userId}/stats`)
	throw new Error(`Error ${res.status}`);
  }
  return await res.json();
}

export async function getUserData(userId: number) {
  if (userId == 0)
    throw Error("User id not found.");

  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/users/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok){
	console.log(`Error al acceder a /api/users/${userId}`)
	throw new Error(`Error ${res.status}`);
  }
  return await res.json();
}
