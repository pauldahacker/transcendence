export async function removeFriend(userId: number) {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not logged in");
  
    const res = await fetch(`/api/users/${userId}/friend-request?action=remove`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  
    if (!res.ok) throw new Error("Failed to remove friend");
    return res.json();
  }
  