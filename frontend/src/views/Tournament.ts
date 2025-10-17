import { createTournamentState } from "../tournament/state";
import { createAliasOverlay, createMatchList } from "../tournament/ui";
import { playNextMatch, showMatchList } from "../tournament/controller";
import { getUsernameFromToken, isUserLoggedIn } from "@/userUtils/TokenUtils";

export async function renderTournament(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[5vh] pb-[10vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Tournament</h1>
    <div class="flex items-center justify-center gap-[5vw]">
        <button id="btn-2p" class="w-[20vw] h-[20vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg min-w-[300px] min-h-[300px]
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            2 Players
        </button>
        <button id="btn-4p" class="w-[20vw] h-[20vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg min-w-[300px] min-h-[300px]
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            4 Players
        </button>
    </div>
    <a href="#/" class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px] mt-8
        border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
        transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Back Home
    </a>
  `;

  root.innerHTML = "";
  root.appendChild(container);

  const button2p = container.querySelector<HTMLButtonElement>("#btn-2p")!;
  const button4p = container.querySelector<HTMLButtonElement>("#btn-4p")!;
  const backHomeLink = container.querySelector<HTMLAnchorElement>("a[href='#/']")!;

  button2p.addEventListener("click", async () => {
    if (await isUserLoggedIn()) skipAliasOverlay(2); // if logged in, show display name + play against bots
    else showAliasOverlay(2);
  });
  
  button4p.addEventListener("click", async () => {
    if (await isUserLoggedIn()) skipAliasOverlay(4);
    else showAliasOverlay(4);
  });

  backHomeLink.addEventListener("click", () => {
    document.querySelectorAll(".overlay").forEach((el) => el.remove());
  });

  // When the 2 player or 4 player button is pressed, show the correct overlay to allow alias input.
  function showAliasOverlay(numPlayers: number) {
    const overlay = createAliasOverlay(numPlayers);

    const startButton = document.createElement("button");
    startButton.textContent = "Start Tournament";
    startButton.className =
      "mt-4 w-[25vw] h-[6vh] bg-black font-bit text-lime-500 text-[3vh] rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black min-w-[300px]";
    overlay.appendChild(startButton);

    const backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.className =
      "w-[25vw] h-[6vh] bg-black font-bit text-red-600 text-[3vh] rounded-lg transition-colors duration-300 hover:bg-red-600 hover:text-black min-w-[300px]";
    overlay.appendChild(backButton);

    document.body.appendChild(overlay);

    startButton.addEventListener("click", () => {
      // When the start button is clicked, check the aliases
      let aliases = Array.from(overlay.querySelectorAll<HTMLInputElement>("input")).map((input) => input.value.trim());

      // Brackets reserved for bots (e.g. [AI] 1)
      if (aliases.some(name => name.includes("[") || name.includes("]"))) {
        alert("No brackets [] allowed.");
        return;
      }

      // No name can exceed 16 characters
      if (aliases.some((name) => name.length > 16)) {
        alert("Player names cannot exceed 16 characters.");
        return;
      }

      // Replace empty entries with AI bots
      let botCount = 1;
      aliases = aliases.map((name) => {
        if (name === "") {
          return `[AI] ${botCount++}`;
        }
        return name;
      });

      // No repeated names
      const uniqueAliases = new Set(aliases);
      if (uniqueAliases.size !== aliases.length) {
        alert("Player names must be unique.");
        return;
      }

      overlay.remove();
      container.remove();

      // shuffle the aliases for pseudo-random matchmaking
      const shuffled = aliases.sort(() => Math.random() - 0.5);
      const matches: [string, string][] = []; // make pairs
      for (let i = 0; i < shuffled.length; i += 2)
        matches.push([shuffled[i], shuffled[i + 1]]);

      // create starting state and display the match list
      const state = createTournamentState(matches);
      showMatchList(root, state); 
    });

    backButton.addEventListener("click", () => {
      overlay.remove();
    });
  }

  // skip the overlay only if user is logged in
  function skipAliasOverlay(numPlayers: number) {
    const username = getCurrentUsername() || "Guest"; // should never be "Guest" because its called after isLoggedIn()

    const aliases: string[] = [username];
    const totalAI = numPlayers - 1;
    for (let i = 1; i <= totalAI; i++) {
      aliases.push(`[AI] ${i}`);
    }
    const shuffled = aliases.sort(() => Math.random() - 0.5);

    const matches: [string, string][] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push([shuffled[i], shuffled[i + 1]]);
    }

    container.remove();

    const state = createTournamentState(matches);
    showMatchList(root, state);
  }

  function getCurrentUsername() {
    const token = localStorage.getItem("auth_token");
    return token ? getUsernameFromToken(token) : null;
  }
}
