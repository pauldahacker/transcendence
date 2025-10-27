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
    const bioHoverArea = document.getElementById("bioHoverArea")!;
    const bioPopup = document.getElementById("bioPopup")!;
    const updateBioBtn = document.getElementById("updateBioBtn")!;
    const bioInput = document.getElementById("bioInput") as HTMLInputElement;
    const bioElement = document.querySelector("p")!;
    
    let msg = document.querySelector("#bio-msg");
    if (!msg){
      msg = document.createElement("span");
      msg.id = "register-msg";
      msg.className = "mt-2 text-center font-bit text-[2vh] transition-all duration-300";
      updateBioBtn.insertAdjacentElement("beforebegin", msg);
    }
    msg.textContent = null;
    msg.classList.add("text-red-400");

    bioHoverArea.addEventListener("click", () => {
      bioInput.value = bio;
      bioPopup.classList.remove("hidden");
      bioInput.focus();
    });

    bioInput.addEventListener("input", () => {
      if (bioInput.value.length > 120) {
        bioInput.value = bioInput.value.slice(0, 120);
        //alert("Bio cannot exceed 120 characters");
        msg.classList.add("text-red-400");
        msg.textContent = "Bio cannot exceed 120 characters";
      }
    });

    updateBioBtn.addEventListener("click", () => {
      const newBio = bioInput.value.trim();
      if (newBio) {
        if (newBio.length > 120) {
          msg.classList.add("text-red-400");
          msg.textContent = "Bio cannot exceed 120 characters";
          //alert("Bio cannot exceed 120 characters");
          return;
        }
        bio = newBio;
        bioElement.textContent = bio;
        updateBio(user_id, newBio);
      }
      bioPopup.classList.add("hidden");
      msg.textContent = null;
      msg.classList.remove("text-red-400");
    });

    bioPopup.addEventListener("click", (e) => {
      if (e.target === bioPopup) bioPopup.classList.add("hidden");
      msg.textContent = null;
      msg.classList.remove("text-red-400");
    });
    
}