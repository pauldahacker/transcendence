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
	stats: UserStats;
  };

  const token = localStorage.getItem("auth_token");

export async function getUserId(username: string){
   const res = await fetch("/api/users/", {
	headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const users = await res.json();
  const user = users.find((u: { id: number; username: string }) => u.username === username);
  
  return user?.id ?? null;
}

export async function getUserData(userId: number): Promise<UserData> {
	const token = localStorage.getItem("auth_token");
  
	const res = await fetch(`/api/users/${userId}/`, {
	  method: "GET",
	  headers: {
		"Authorization": `Bearer ${token}`,
		"Content-Type": "application/json",
	  },
	});
  
	if (!res.ok) {
	  let errorMsg = "";
	  try {
		const maybeJson = await res.json();
		errorMsg = maybeJson?.message || JSON.stringify(maybeJson);
	  } catch {
		errorMsg = await res.text();
	  }
	  throw new Error(errorMsg || `Error ${res.status}`);
	}
  
	const data = await res.json();
  	return {
	  username: data.username,
	  display_name: data.display_name,
	  avatar_url: data.avatar_url,
	  bio: data.bio,
	  created_at: data.created_at,
	  friends: data.friends ?? [],
	  stats: {
		total_games: data.stats.total_games ?? 0,
		wins: data.stats.wins ?? 0,
		losses: data.stats.losses ?? 0,
	  },
	};
  }

  export async function getUserDataFromName(username :string){
	try {
		const userId = await getUserId(username);
		const UserData = await getUserData(userId);
		return UserData;
	} catch (e: any){
		throw e;
	}
  }