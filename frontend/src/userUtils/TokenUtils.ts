
export function getUsernameFromToken(token: string): string | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.username || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
  //add something so it refreshes the rest of pages
}

export function isLoggedIn() {
  const token = localStorage.getItem("auth_token");
  return !!token;
  //to add: check if the token is valid and belongs to its user
}

// added this, but it will never retrieve anything cause no display name is ever set upon login (to change)
export function getUserIdFromToken(token: string): number | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.user_id || payload.id || null;
  } catch {
    return null;
  }
}
