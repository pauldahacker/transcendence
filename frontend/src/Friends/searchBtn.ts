import { fetchUsers } from "@/userUtils/FetchUsers";

export function initSearchButton() {
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", searchBtnPopup);
    }
}

export async function searchBtnPopup() {
    // Crea el fondo del popup
    const popup = document.createElement("div");
    popup.id = "searchPopup";
    popup.className = `
        fixed inset-0 bg-black/60 flex items-center justify-center z-50
    `;

    // Contenido del popup
    popup.innerHTML = `
        <div id="searchBox" class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[40vw] text-center shadow-xl">
            <h2 class="text-3xl font-bit text-white mb-4">Search Users</h2>
            <input id="searchInputPopup" type="text"
                         placeholder="Type a username..."
                         class="w-full p-2 rounded-md bg-cyan-950 border border-cyan-700 text-white font-bit text-[2vh]
                                        focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            <div id="searchResults" class="mt-4 text-left text-white font-bit text-[1.8vh] max-h-[30vh] overflow-y-auto"></div>
            <button id="closeSearchPopup"
                            class="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-bit text-[1.8vh]">
                Close
            </button>
        </div>
    `;

    document.body.appendChild(popup);

    // Cerrar popup
    document.getElementById("closeSearchPopup")!.addEventListener("click", () => {
        popup.remove();
    });

    // Escuchar ESC para cerrar
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") popup.remove();
    });

    const Sbox = document.getElementById("searchBox")!;
    popup.addEventListener("click", (e) => {
        if (!Sbox.contains(e.target as Node)) {
            popup.remove();
        }
    });

    // Lógica de búsqueda local (ejemplo, puedes adaptarlo luego)
    const input = document.getElementById("searchInputPopup") as HTMLInputElement;
    const results = document.getElementById("searchResults")!;

    const userstest = [
        { id: 1, username: "pepe" },
        { id: 2, username: "lola" },
        { id: 3, username: "juan" },
    ];

    let users: { id: number; username: string }[] = [];

    try {
        users = await fetchUsers();
    } catch (err) {
        results.innerHTML = `<p class="text-red-400">Failed to load users</p>`;
        return;
    }

    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        const filtered = users.filter(u => u.username.toLowerCase().includes(query));

        results.innerHTML = filtered.length
            ? filtered.map(u => `<div class="p-1 hover:bg-cyan-800 rounded">${u.username}</div>`).join("")
            : `<p class="text-gray-400">No users found</p>`;
    });
}