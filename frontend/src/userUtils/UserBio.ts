export async function updateBio(user_id: number, newBio: string){
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/users/${user_id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: newBio }),
    }); 
    if (!res.ok) {
        console.error(`Error updating bio: ${res.status}`);
        throw new Error(`Failed to update bio (${res.status})`);
    }   
    return await res.json();
}

export async function setupBioButton(user_id: number, bio: string) {
  const bioHoverArea = document.getElementById("bioHoverArea")!;
  const bioPopup = document.getElementById("bioPopup")!;
  const updateBioBtn = document.getElementById("updateBioBtn")!;
  const bioInput = document.getElementById("bioInput") as HTMLInputElement;
  const bioElement = document.querySelector("#userBio") as HTMLElement;
  let msg = document.querySelector<HTMLElement>("#bio-msg");

  if (!msg) {
    msg = document.createElement("span");
    msg.id = "bio-msg";
    msg.className = "mt-2 text-center font-bit text-[2vh] transition-all duration-300";
    updateBioBtn.insertAdjacentElement("beforebegin", msg);
  }

  const messageEl = msg as HTMLElement;

  messageEl.textContent = "";
  messageEl.classList.remove("text-green-400", "text-red-400");

  bioHoverArea.addEventListener("click", () => {
    bioInput.value = bio;
    bioPopup.classList.remove("hidden");
    bioInput.focus();
  });

  bioInput.addEventListener("input", () => {
    if (bioInput.value.length > 120) {
      bioInput.value = bioInput.value.slice(0, 120);
      messageEl.classList.add("text-red-400");
      messageEl.textContent = "Bio cannot exceed 120 characters";
    } else {
      messageEl.textContent = "";
    }
  });

  updateBioBtn.addEventListener("click", async () => {
    const newBio = bioInput.value.trim();
    if (!newBio) {
      messageEl.classList.add("text-red-400");
      messageEl.textContent = "Bio cannot be empty";
      return;
    }
    if (newBio.length > 120) {
      messageEl.classList.add("text-red-400");
      messageEl.textContent = "Bio cannot exceed 120 characters";
      return;
    }

    try {
      const res = await updateBio(user_id, newBio);
      bio = res.bio || newBio;
      bioElement.textContent = bio;
      messageEl.classList.remove("text-red-400");
      messageEl.classList.add("text-green-400");
      messageEl.textContent = "Bio updated!";
      setTimeout(() => (messageEl.textContent = ""), 2000);
    } catch (err) {
      console.error(err);
      messageEl.classList.add("text-red-400");
      messageEl.textContent = "Failed to update bio";
    }

    bioPopup.classList.add("hidden");
  });

  bioPopup.addEventListener("click", (e) => {
    if (e.target === bioPopup) bioPopup.classList.add("hidden");
    messageEl.textContent = "";
  });
}
