
export async function logoutUser() {
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  try
  {
    const res = await fetch("/api/users/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Invalid token");
      } else {
        console.error(`Error logout: ${res.status}`);
      }
    }
    localStorage.removeItem("auth_token");
    console.log("user logged out succesfully");
  }
  catch (err) {
    console.error("Error logout:", err);
    localStorage.removeItem("auth_token");
  }
  window.location.hash = "#/";
}
