export function renderProfile(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col items-center justify-start min-h-[400px] min-w-[600px] gap-[3vh] pb-[5vh] h-screen pt-[8vh]";

  // Datos base
  const username = "PlayerOne";
  const avatarUrl = new URL("../avatarDefault/avatar.png", import.meta.url).href;
  const wins = 15;
  const losses = 10;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Profile</h1>

    <!-- Avatar + Nombre -->
    <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 rounded-3xl p-[3vh] shadow-xl w-[30vw]">
      <!-- Wrapper con overlay de hover -->
      <div id="avatarWrapper" class="relative group cursor-pointer mb-[2vh]">
        <img id="avatarImg" src="${avatarUrl}" alt="User Avatar"
             class="w-[15vh] h-[15vh] rounded-full border-4 border-cyan-500 shadow-[0_0_15px_#00ffff] object-cover">
        <!-- Overlay -->
        <div class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bit text-[2.2vh] text-white select-none">Change avatar</span>
        </div>
      </div>
      <h2 class="font-bit text-[4vh] text-gray-100">${username}</h2>
    </div>

    <!-- Stats -->
    <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 rounded-3xl p-[3vh] shadow-xl w-[30vw]">
      <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Game Stats</h3>
      <div class="flex justify-between w-full px-[2vw] font-bit text-[2.5vh]">
        <span class="text-green-400">Wins: ${wins}</span>
        <span class="text-red-400">Losses: ${losses}</span>
      </div>

      <div class="mt-[2vh] w-[90%] bg-red-400 rounded-full h-[2.5vh] overflow-hidden">
        <div class="h-full bg-green-400 transition-all duration-500" style="width: ${winRate}%"></div>
      </div>

      <p class="font-bit text-gray-100 text-[2.2vh] mt-[1vh]">${winRate}% Win Rate</p>
    </div>

    <!-- Back Home -->
    <a href="#/"
       class="flex items-center justify-center w-[25vw] h-[7vh] mt-[4vh] rounded-full
              border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
              transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Back Home
    </a>
  `;

  root.appendChild(container);

  const progressBar = container.querySelector(".bg-green-400");
  if (progressBar instanceof HTMLElement)
    progressBar.style.width = `${winRate}%`;

  // -------- Modal para cambiar avatar --------
  function openAvatarModal(onConfirm: (file: File) => void) {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- backdrop -->
        <div class="absolute inset-0 bg-black/60"></div>

        <!-- panel -->
        <div class="relative z-10 w-[90vw] max-w-[520px] rounded-2xl bg-cyan-950 border border-cyan-800 p-6 shadow-2xl">
          <h3 class="font-bit text-[3vh] text-gray-100 mb-4">Change avatar</h3>

          <div class="flex flex-col gap-4">
            <label class="font-bit text-gray-200 text-[2.2vh]">Choose an image</label>
            <input id="avatarFile" type="file" accept="image/*"
                   class="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                          file:text-sm file:font-semibold file:bg-cyan-700 file:text-white
                          hover:file:bg-cyan-600 text-gray-100"/>

            <div class="flex items-center gap-4">
              <img id="avatarPreview" alt="Preview"
                   class="w-24 h-24 rounded-full border-2 border-cyan-600 object-cover hidden" />
              <span id="previewHint" class="text-gray-300 text-sm">No file selected</span>
            </div>

            <div class="flex justify-end gap-3 mt-4">
              <button id="cancelBtn"
                      class="px-4 py-2 rounded-full border border-gray-300 text-gray-100 hover:bg-white/10">
                Cancel
              </button>
              <button id="saveBtn"
                      class="px-5 py-2 rounded-full bg-cyan-600 text-white font-medium hover:bg-cyan-500 disabled:opacity-40"
                      disabled>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const fileInput = modal.querySelector<HTMLInputElement>("#avatarFile")!;
    const previewImg = modal.querySelector<HTMLImageElement>("#avatarPreview")!;
    const previewHint = modal.querySelector<HTMLSpanElement>("#previewHint")!;
    const saveBtn = modal.querySelector<HTMLButtonElement>("#saveBtn")!;
    const cancelBtn = modal.querySelector<HTMLButtonElement>("#cancelBtn")!;

    let objectUrl: string | null = null;
    let selectedFile: File | null = null;

    // Cerrar y limpiar
    function close() {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      modal.remove();
      document.removeEventListener("keydown", onKey);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "Enter" && selectedFile && !saveBtn.disabled) {
        saveBtn.click();
      }
    }
    document.addEventListener("keydown", onKey);

    cancelBtn.addEventListener("click", close);

    fileInput.addEventListener("change", () => {
      const f = fileInput.files?.[0] || null;
      selectedFile = f;
      if (!f) {
        previewImg.classList.add("hidden");
        previewHint.textContent = "No file selected";
        saveBtn.disabled = true;
        return;
      }
      // Validaciones ligeras
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (f.size > maxBytes) {
        previewHint.textContent = "File too large (max 5MB)";
        selectedFile = null;
        saveBtn.disabled = true;
        return;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(f);
      previewImg.src = objectUrl;
      previewImg.classList.remove("hidden");
      previewHint.textContent = `${f.name} (${Math.round(f.size / 1024)} KB)`;
      saveBtn.disabled = false;
    });

    saveBtn.addEventListener("click", () => {
      if (selectedFile) {
        onConfirm(selectedFile);
        close();
      }
    });

    // Cierre por click en backdrop
    modal.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target === modal.firstElementChild) {
        // click en el backdrop
        close();
      }
    });
  }

  // Hook que luego reemplazarás por tu subida al backend
  async function onAvatarChange(file: File) {
    // TODO: súbelo a tu API y guarda la URL resultante.
    // Por ahora, actualizamos la imagen del perfil localmente:
    const avatarImg = container.querySelector<HTMLImageElement>("#avatarImg");
    if (avatarImg) {
      const tempUrl = URL.createObjectURL(file);
      avatarImg.src = tempUrl;
      // Si luego obtienes una URL definitiva del backend, actualízala y revokeObjectURL(tempUrl).
      // URL.revokeObjectURL(tempUrl); // hazlo cuando ya no la necesites
    }
  }

  // Abrir modal al hacer click en el avatar
  const avatarWrapper = container.querySelector("#avatarWrapper");
  avatarWrapper?.addEventListener("click", () => {
    openAvatarModal(onAvatarChange);
  });
}
