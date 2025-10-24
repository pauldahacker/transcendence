import { getUserIdFromToken } from "@/userUtils/TokenUtils"

export async function respondFriendRequest(requestedById: number, accept: boolean) {
  
    const token = localStorage.getItem("auth_token");
    const userId = token ? getUserIdFromToken(token) : 0;

    if (!accept)
      return Promise.resolve({ message: "Request ignored" });
  
    const res = await fetch(`/api/users/${userId}/friend-request`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // API requires NO body for accept
    });
  
    if (!res.ok) throw new Error("Failed to accept friend request");
    return res.json();
  }
  