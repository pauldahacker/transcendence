export async function checkAvatarUrl(url: string): Promise<boolean> {
  if (!url.trim()) return false;
  try {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    return ok;
  } catch {
    return false;
  }
}

export async function updateAvatar(user_id: number, new_url: string){
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/users/${user_id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar_url: new_url }),
    }); 
    if (!res.ok) {
        console.error(`Error updating avatar: ${res.status}`);
        throw new Error(`Failed to update avatar (${res.status})`);
    }   
    return await res.json();
}

export async function deleteAvatar(user: number, defaultUrl: string) {
    try{
        await updateAvatar(user, defaultUrl);
        return 
    } catch (err){
        console.error(err);
        alert("Failed to delete user avatar");
    }
}

export function setupAvatarPopup(userId: number) {
    const avatarWrapper = document.getElementById("avatarWrapper")!;
    const modal = document.getElementById("avatarModal")!;
    const resetBtn = document.getElementById("resetAvatar")!;
    const confirmBtn = document.getElementById("confirmAvatar")!;
    const input = document.getElementById("avatarUrlInput") as HTMLInputElement;
    const avatarImg = document.getElementById("avatarImg")!;

    //SHow
    avatarWrapper.addEventListener("click", () => {
        modal.classList.remove("hidden");
        input.value = "";
    });

    //ResetAvatar
    resetBtn.addEventListener("click", () => {
        const randomSeed = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join('');
        const defaultAvatar = `https://api.dicebear.com/9.x/bottts-neutral/svg?size=200&seed=${randomSeed}`;
        deleteAvatar(userId, defaultAvatar);
        avatarImg.setAttribute("src", defaultAvatar);
        modal.classList.add("hidden");
    });

    //Close
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.add("hidden");
        }
    });

    //Save
    confirmBtn.addEventListener("click", async () => {
        const newUrl = input.value.trim();
        if (!(await checkAvatarUrl(newUrl))) {
            alert("Invalid or unreachable image URL!");
            return;
        }
        try {
            await updateAvatar(userId, newUrl);
            avatarImg.setAttribute("src", newUrl);
            modal.classList.add("hidden");
        } catch (err) {
            alert("Error updating avatar.");
            console.error(err);
        }
    });
}