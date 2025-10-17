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

export async function getUserId(username: string) {
  const res = await fetch("/api/users/", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) {
  	const text = await res.text();
  	console.log("Respuesta del servidor:", res.status, text);
  	throw new Error(`Error ${res.status}`);
}
  const users = await res.json();
  const user = users.find((u: { id: number; username: string }) => u.username === username);
  console.log(`user_id encontrado: ${user.id}`)
  return user?.id ?? null;
}

export async function getUserData(userId: number) {
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

export async function getUserDataFromName(username: string) {
  const id = await getUserId(username);
  if (!id) throw new Error(`Usuario "${username}" no encontrado`);
  return await getUserData(id);
}