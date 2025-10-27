import { fetchIncomingFriendRequests } from "./fetchFriendRequests";
import { updateNewsBadge } from "./newsBtn";

export async function sendFriendRequest(userId: number) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`/api/users/${userId}/friend-request?action=add`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed (${res.status})`);
  }

  const result = await res.json();

  // Refresh badge right away
  try {
    const incoming = await fetchIncomingFriendRequests();
    updateNewsBadge(incoming.length);
  } catch {}

  return result;
}
