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

export async function setupBIoButton(user_id: number, bio: string) {
    const editBioWrapper = document.getElementById("editBioWrapper")!;
    const bioPopup = document.getElementById("bioPopup")!;
    const updateBioBtn = document.getElementById("updateBioBtn")!;
    const bioInput = document.getElementById("bioInput") as HTMLInputElement;
    const bioElement = document.querySelector("p")!;
    
    editBioWrapper.addEventListener("click", () => {
      bioInput.value = bio;
      bioPopup.classList.remove("hidden");
      bioInput.focus();
    });

    updateBioBtn.addEventListener("click", () => {
      const newBio = bioInput.value.trim();
      if (newBio) {
        bio = newBio;
        bioElement.textContent = bio;
        updateBio(user_id, newBio);
      }
      bioPopup.classList.add("hidden");
    });

    bioPopup.addEventListener("click", (e) => {
      if (e.target === bioPopup) bioPopup.classList.add("hidden");
    });
    
}