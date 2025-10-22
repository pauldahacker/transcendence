import { getUserIdFromToken } from "./TokenUtils";

// Fetch the logged in user's display name.
export async function getUserDisplayName(): Promise<string | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  const res = await fetch(`/api/users/${userId}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const user = await res.json();
  return user.display_name || user.username;
}

// update display name
export async function updateDisplayName(user_id: number, newDisplayName: string) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`/api/users/${user_id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ display_name: newDisplayName }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`Error updating display name: ${res.status} - ${text}`);
    throw new Error(`Failed to update display name (${res.status})`);
  }

  return await res.json();
}

// optional, needs updating
export function setupDisplayNameEditor(user_id: number, displayName: string) {
  const nameHoverArea = document.getElementById("nameHoverArea")!;
  const namePopup = document.getElementById("namePopup")!;
  const updateNameBtn = document.getElementById("updateNameBtn")!;
  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const nameElement = document.getElementById("currentDisplayName")!;

  nameHoverArea.addEventListener("click", () => {
    nameInput.value = displayName;
    namePopup.classList.remove("hidden");
    nameInput.focus();
  });

  nameInput.addEventListener("input", () => {
    if (nameInput.value.length > 20) {
      nameInput.value = nameInput.value.slice(0, 20);
      alert("Display name cannot exceed 20 characters");
    }
  });

  updateNameBtn.addEventListener("click", async () => {
    const newName = nameInput.value.trim();
    if (!newName) {
      alert("Display name cannot be empty");
      return;
    }

    if (newName.length > 20) {
        alert("Display name cannot exceed 20 characters");
        return;
      }

    try {
      await updateDisplayName(user_id, newName);
      nameElement.textContent = newName;
      namePopup.classList.add("hidden");
    } catch (err) {
      alert("Failed to update display name");
      console.error(err);
    }
  });

  namePopup.addEventListener("click", (e) => {
    if (e.target === namePopup) namePopup.classList.add("hidden");
  });
}
