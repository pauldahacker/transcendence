export function renderUser(username: string, avatarUrl: string, displayName: string, bio: string) : string {
    return `
    <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 rounded-3xl p-[3vh] shadow-xl w-[30vw] h-full">

    <!-- USERNAME -->
      <h2 class="font-bit text-[4vh] text-gray-100">${username}</h2>

      <!-- AVATAR -->
      <div id="avatarWrapper" class="relative group cursor-pointer mb-[2vh]">
        <img id="avatarImg" src="${avatarUrl}" alt="User Avatar" class="w-[25vh] h-[25vh] rounded-full border-4 border-cyan-500 shadow-[0_0_15px_#00ffff] object-cover">
        <div class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span class="font-bit text-[2.2vh] text-white select-none">Change avatar</span>
        </div>
      </div>
      ${renderAvatarPopup()}

      <!-- DISPLAY NAME -->
      <div class="relative w-full mt-[1vh] text-center group cursor-pointer" id="nameHoverArea">
        <span id="currentDisplayName" class="font-bit text-[3vh] text-cyan-200 transition-all duration-200 group-hover:underline">
          ${displayName}
        </span>
        ${renderHoverMsg("Click to edit display name")}
      </div>
      ${renderDisplayNamePopup()}

      

      <!-- BIO -->
      <div class="relative w-full mt-[1vh] text-center group cursor-pointer" id="bioHoverArea">
        <p id="currentBio"
           class="font-bit text-[2.0vh] text-gray-300 text-center whitespace-normal overflow-hidden [overflow-wrap:anywhere] [word-break:normal] transition-all duration-200 group-hover:underline">
          ${bio}
        </p>
        ${renderHoverMsg("Click to edit bio")}
      </div>
      ${renderBioPopup()}
  `;

}

export function renderHoverMsg(msg: string) : string {
    return `<!-- Tooltip -->
        <div class="absolute left-1/2 -translate-x-1/2 bottom-[120%]
                    bg-black/70 text-white font-bit text-[1.8vh] rounded-lg 
                    px-3 py-1 opacity-0 group-hover:opacity-100 
                    transition-opacity duration-200 whitespace-nowrap shadow-lg pointer-events-none">
          ${msg}
        </div>`
}

export function renderAvatarPopup() : string{
  return `
    <div id="avatarModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[30vw] shadow-2xl">
        <h3 class="font-bit text-[2.5vh] text-white mb-4 text-center">Change Avatar</h3>
        <input id="avatarUrlInput" type="text"
              class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]"
              placeholder="Enter your new avatar image URL..." />
        <div class="flex justify-end mt-4 gap-2">
          <button id="confirmAvatar"
                  class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
            Save
          </button>
          <button id="resetAvatar"
                  class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
            Reset to default
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderDisplayNamePopup() : string{
    return `<!-- Hidden popup for editing name -->
      <div id="namePopup" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[30vw] shadow-2xl">
          <h3 class="font-bit text-[2.5vh] text-white mb-4 text-center">Edit Display Name</h3>
          <input id="nameInput" type="text"
                 class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]"
                 placeholder="Enter your new display name..." />
          <div class="flex justify-end mt-4">
            <button id="updateNameBtn"
                    class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">Update</button>
          </div>
        </div>
      </div>`
}

export function renderBioPopup() : string {
    return `<!-- hidden popup for bio -->
      <div id="bioPopup" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[30vw] shadow-2xl">
          <h3 class="font-bit text-[2.5vh] text-white mb-4 text-center">Edit Bio</h3>
          <input id="bioInput" type="text"
                 class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]"
                 placeholder="Enter your new bio..." />
          <div class="flex justify-end mt-4">
            <button id="updateBioBtn"
                    class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-md font-bit text-[1.8vh]">
              Update bio
            </button>
          </div>
        </div>
      </div>
    </div>`
}