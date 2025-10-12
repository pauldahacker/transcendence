export async function register(username: string, password: string) {
    const response = await window.fetch(`https://localhost/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": (import.meta as any).env.VITE_INTERNAL_API_KEY,
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let msg = "";
    try {
      const errorData = await response.json();
      msg = errorData?.message || JSON.stringify(errorData);
    } catch {
      msg = await response.text();
    }
    throw new Error(msg || `Registration failed with ${response.status}`);
  }
  return response;
}