export async function respondFriendRequest(requestedById: number, accept: boolean) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("Not logged in");

  if (!accept) {
    // remove request
    const res = await fetch(`/api/users/${requestedById}/friend-request?action=remove`, {
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

  // Accept friend request
  const res = await fetch(`/api/users/${requestedById}/friend-request?action=add`, {
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
