import { getUserIdFromToken } from "@/userUtils/TokenUtils"

export async function fetchFriendRequests() {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("Not logged in");

  const userId = getUserIdFromToken(token);

  const res = await fetch(`/api/users/${userId}/friends?filter=pending`, {
    headers: { "Authorization": `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Failed (${res.status})`);

  return res.json();
}
