// Decode any token payload
function decodeToken(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Get username from token
export function getUsernameFromToken(token: string): string | null {
  const payload = decodeToken(token);
  return payload?.username || null;
}

// Get user ID from token
export function getUserIdFromToken(token: string): number | null {
  const payload = decodeToken(token);
  return payload?.id ?? null;
}

// Save token and refresh
export function setAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
  // optional: force a refresh or re-render so user info updates immediately
  window.dispatchEvent(new Event("authChanged"));
}

export async function getDisplayName(): Promise<string | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  const userId = getUserIdFromToken(token);
  const res = await fetch(`/api/users/${userId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch user ${userId}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.display_name && data.display_name.trim() !== ""
    ? data.display_name
    : data.username || null;
}

// User session is still valid?
export async function isUserLoggedIn(): Promise<boolean> {
  const token = localStorage.getItem("auth_token");
  if (!token) return false;

  try {
    const userId = getUserIdFromToken(token);

    // If token has no user ID, it's definitely invalid
    if (!userId) {
      localStorage.removeItem("auth_token");
      return false;
    }

    const res = await fetch(`/api/users/${userId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (res.ok) return true;

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("auth_token");
      return false;
    }

    return false;
  } catch (err) {
    console.error("Error verifying session:", err);
    return false;
  }
}
