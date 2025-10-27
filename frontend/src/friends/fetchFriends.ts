export async function fetchFriends(filter: "all" | "confirmed" | "pending" | "requested" = "all") {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not logged in");
  
    const userId = JSON.parse(atob(token.split(".")[1])).id;
  
    const res = await fetch(`/api/users/${userId}/friends?filter=${filter}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  
    if (!res.ok) throw new Error("Failed to fetch friends");
  
    return res.json();
  }
  