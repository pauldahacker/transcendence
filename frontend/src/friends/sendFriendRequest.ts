export async function sendFriendRequest(userId: number): Promise<{ message: string }> {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not logged in");
  
    const res = await fetch(`/api/users/${userId}/friend-request?action=add`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
  
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed (${res.status})`);
    }
  
    return res.json();
  }
  