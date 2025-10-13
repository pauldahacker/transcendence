export async function login(username: string, password: string): Promise<string> {
    
    const response = await fetch("/api/users/login", {
    method: "POST",
    headers: {
	    'content-type': 'application/json;charset=UTF-8',
      'x-internal-api-key': (import.meta as any).env.VITE_INTERNAL_API_KEY,
	},
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let msg = "";
    try {
      const maybeJson = await response.json();
      msg = maybeJson?.message || JSON.stringify(maybeJson);
    } catch {
      msg = await response.text();
    }
    throw new Error(msg || `Login failed with ${response.status}`);
  }

  const data = (await response.json()) as { token?: string };
  if (!data.token) throw new Error("El servidor no devolvió ningún token.");

  localStorage.setItem("auth_token", data.token);
  window.location.hash = "#/profile";
  return data.token;
}
