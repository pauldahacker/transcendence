function decodeTokenPayload(token: string): Record<string, unknown> | null {
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

export function getUsernameFromToken(token: string): string | null {
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  const username = payload.username;
  return typeof username === "string" ? username : null;
}

export function getUserIdFromToken(): number  {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) return 0;

  const payload = decodeTokenPayload(token);
  if (!payload || payload.id == null) return 0;

  const id = payload.id;

  if (typeof id === "number") return id;

  if (typeof id === "string" && id.trim() !== "") {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function setAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
  //add something so it refreshes the rest of pages
}

export async function isUserLoggedIn(): Promise<boolean> {
  const token = localStorage.getItem("auth_token");
  if (!token) return false;
  try {
    const res = await fetch("/api/users/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("auth_token");
      return false;
    }
    return false;
  } catch (err) {
    console.error("Error verificando sesión:", err);
    return false;
  }
}
