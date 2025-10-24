import { getUserIdFromToken } from "@/userUtils/TokenUtils"

export async function fetchFriendRequests() {
    const token = localStorage.getItem("auth_token");
    const userId = token ? getUserIdFromToken(token) : 0;
  
    const res = await fetch(`/api/users/${userId}/friends?filter=pending`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
  
    if (!res.ok) throw new Error("Failed to fetch friend requests");
    return res.json();
  }
  