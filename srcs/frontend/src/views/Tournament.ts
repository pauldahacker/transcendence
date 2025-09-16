import { createTournamentState } from "../tournament/state";
import { createAliasOverlay, createMatchList } from "../tournament/ui";
import { playNextMatch } from "../tournament/controller";

export function renderTournament(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[5vh] pb-[10vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Tournament</h1>
    <div class="flex items-center justify-center gap-[5vw]">
        <button id="btn-2p" class="w-[25vw] h-[25vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg min-w-[300px] min-h-[300px]
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            2 Players
        </button>
        <button id="btn-4p" class="w-[25vw] h-[25vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg min-w-[300px] min-h-[300px]
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            4 Players
        </button>
    </div>
    <a href="#/" class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full min-w-[300px] mt-4
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

  button2p.addEventListener("click", () => showAliasOverlay(2));
  button4p.addEventListener("click", () => showAliasOverlay(4));

  backHomeLink.addEventListener("click", () => {
    document.querySelectorAll(".overlay").forEach((el) => el.remove());
  });

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
      const aliases = Array.from(
        overlay.querySelectorAll<HTMLInputElement>("input")
      ).map((input) => input.value.trim());

      if (aliases.some((name) => name === "")) {
        alert("Please enter a name for every player.");
        return;
      }
      if (aliases.some((name) => name.length > 16)) {
        alert("Player names cannot exceed 16 characters.");
        return;
      }

      const uniqueAliases = new Set(aliases);
      if (uniqueAliases.size !== aliases.length) {
        alert("Player names must be unique.");
        return;
      }

      overlay.remove();
      container.remove();

      const shuffled = aliases.sort(() => Math.random() - 0.5);
      const matches: [string, string][] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        matches.push([shuffled[i], shuffled[i + 1]]);
      }

      const state = createTournamentState(matches);
      const matchListContainer = createMatchList(matches);

      root.innerHTML = "";
      root.appendChild(matchListContainer);

      const startBtn = matchListContainer.querySelector<HTMLButtonElement>("#start-first-match")!;
      startBtn.addEventListener("click", () => {
        matchListContainer.remove();
        playNextMatch(root, state);
      });
    });

    backButton.addEventListener("click", () => {
      overlay.remove();
    });
  }
}
