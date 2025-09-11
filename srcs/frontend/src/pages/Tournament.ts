import { renderGame } from "./Game";

export function renderTournament(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[5vh] pb-[10vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Tournament</h1>
    <div class="flex items-center justify-center gap-[5vw]">
        <button id="btn-2p" class="w-[25vw] h-[25vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            2 Players
        </button>
        <button id="btn-4p" class="w-[25vw] h-[25vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            4 Players
        </button>
    </div>
    <a href="#/" class="flex items-center justify-center w-[25vw] h-[8vh] rounded-full
        border-2 border-gray-100 text-gray-100 font-bit text-[5vh]
        transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Back Home
    </a>
  `;

  root.innerHTML = ""; // clear previous page
  root.appendChild(container);

  const button2p = document.getElementById("btn-2p")!;
  const button4p = document.getElementById("btn-4p")!;

  button2p.addEventListener("click", () => showAliasOverlay(2));
  button4p.addEventListener("click", () => showAliasOverlay(4));

  function showAliasOverlay(numPlayers: number) {
    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 bg-black/70 flex flex-col justify-center items-center gap-4";

    for (let i = 1; i <= numPlayers; i++) {
      const input = document.createElement("input");
      input.placeholder = `Player ${i}`;
      input.className = "text-center text-[4vh] font-bit w-[60vw] max-w-[300px]";
      overlay.appendChild(input);
    }

    const startButton = document.createElement("button");
    startButton.textContent = "Start Tournament";
    startButton.className =
      "mt-4 w-[25vw] h-[6vh] bg-black font-bit text-lime-500 text-[3vh] rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black";
    overlay.appendChild(startButton);

    const backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.className =
      "w-[25vw] h-[6vh] bg-black font-bit text-red-600 text-[3vh] rounded-lg transition-colors duration-300 hover:bg-red-600 hover:text-black";
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

      const uniqueAliases = new Set(aliases);
      if (uniqueAliases.size !== aliases.length) {
        alert("Player names must be unique.");
        return;
      }

      overlay.remove();
      container.remove();
      startTournament(root, aliases);
    });

    backButton.addEventListener("click", () => {
        overlay.remove();
    });
  }

  function startTournament(root: HTMLElement, aliases: string[]) {
    // Shuffle players randomly
    const shuffled = aliases.sort(() => Math.random() - 0.5);
  
    // Create matches: each pair of players
    const matches: [string, string][] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push([shuffled[i], shuffled[i + 1]]);
    }
  
    let currentMatchIndex = 0;
    const winners: string[] = [];
  
    function playNextMatch() {
      if (currentMatchIndex >= matches.length) {
        // Tournament complete
        alert("Tournament finished! Winners: " + winners.join(", "));
        return;
      }
  
      const [p1, p2] = matches[currentMatchIndex];
  
      // Clear out root before rendering game
      root.innerHTML = "";
    
      renderGame(root, {
        player1: p1,
        player2: p2,
        onGameOver: (winnerIndex) => {
            const winner = winnerIndex === 1 ? p1 : p2;
            winners.push(winner);
          
            const overlay = document.createElement("div");
            overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6";
          
            root.appendChild(overlay);

            const nextBtn = document.createElement("button");
            nextBtn.textContent = "Proceed to Next Match";
            nextBtn.className = "mt-[35vh] w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black";
            overlay.appendChild(nextBtn); // append inside overlay
            
            nextBtn.addEventListener("click", () => {
                root.innerHTML = "";
                currentMatchIndex++;
                playNextMatch();
            }, { once: true });
          },          
      });
    }
  
    playNextMatch();
  }
  
}
