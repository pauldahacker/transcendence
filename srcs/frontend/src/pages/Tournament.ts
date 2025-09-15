import { renderGame } from "./Game";

export function renderTournament(root: HTMLElement) {
  let tournamentActive = true;
  let stopCurrentGame: (() => void) | null = null;

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

  root.innerHTML = ""; // clear previous page
  root.appendChild(container);

  const button2p = document.getElementById("btn-2p")!;
  const button4p = document.getElementById("btn-4p")!;
  const backHomeLink = container.querySelector<HTMLAnchorElement>("a[href='#/']")!;

  button2p.addEventListener("click", () => showAliasOverlay(2));
  button4p.addEventListener("click", () => showAliasOverlay(4));
  backHomeLink.addEventListener("click", () => {
    tournamentActive = false;
    if (stopCurrentGame) stopCurrentGame();
    stopCurrentGame = null;
    document.querySelectorAll(".overlay").forEach((el) => el.remove());
  });

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

      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
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
    
    const shuffled = aliases.sort(() => Math.random() - 0.5);
    const matches: [string, string][] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push([shuffled[i], shuffled[i + 1]]);
    }
    
    const matchListContainer = document.createElement("div");
    matchListContainer.className =
    "flex flex-col justify-between font-bit text-gray-100 items-center h-screen pt-[5vh] pb-[10vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto gap-4";

    matchListContainer.innerHTML = `
      <h2 class="text-[10vh] font-honk animate-wobble">Match List</h2>
      <div class="flex flex-row justify-center items-center gap-12">
        <div id="match-list" class="flex flex-col gap-2 w-full max-w-[60vw] min-w-[300px] text-[3vh]"></div>
        <button id="start-first-match" class="self-center w-[10vw] h-[10vw] border-4 border-lime-600 shadow-lg
            text-lime-500 font-bit text-[5vh] rounded-full min-w-[300px] min-h-[300px]
            transition-colors duration-300 hover:shadow-2xl hover:border-lime-500">
          Start
        </button>
      </div>
      <a href="#/" class="flex items-center justify-center w-[25vw] h-[6vh] border-2 border-gray-100 text-gray-100 text-[3vh] rounded-lg min-w-[300px]
          transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Back Home
      </a>
    `;
    

    // Fill in the match list
    const matchListDiv = matchListContainer.querySelector<HTMLDivElement>("#match-list")!;
    matches.forEach(([p1, p2], i) => {
      const matchEl = document.createElement("div");
      if (i === 0) matchEl.className = "flex justify-between p-8 gap-8 border-4 border-lime-600 rounded text-[3vh]";
      else matchEl.className = "flex justify-between p-8 border-2 gap-8 border-gray-600 rounded text-[3vh]";
      matchEl.innerHTML = `<span>Round ${i + 1}</span><span>${p1} vs ${p2}</span>`;
      matchListDiv.appendChild(matchEl);
    });


    root.innerHTML = "";
    root.appendChild(matchListContainer);

    const homeLink = matchListContainer.querySelector<HTMLAnchorElement>("a[href='#/']")!;

    homeLink.addEventListener("click", () => {
      matchListContainer.remove();
      tournamentActive = false;
      if (stopCurrentGame) stopCurrentGame();
      stopCurrentGame = null;
      document.querySelectorAll(".overlay").forEach((el) => el.remove());
    });

    let currentMatchIndex = 0;
    const winners: string[] = [];
    // Start tournament button
    const startButton = matchListContainer.querySelector<HTMLButtonElement>("#start-first-match")!;
    startButton.addEventListener("click", () => {
      matchListContainer.remove();
      playNextMatch();
    });
  
    function playNextMatch() {
      if (!tournamentActive) return;
      if (currentMatchIndex >= matches.length) {
        alert("Tournament finished! Winners: " + winners.join(", "));
        location.hash = "/"
        return;
      }
  
      const [p1, p2] = matches[currentMatchIndex];
      root.innerHTML = "";
    
      stopCurrentGame = renderGame(root, {
        player1: p1,
        player2: p2,
        onGameOver: (winnerIndex) => {
          if (!tournamentActive) return;
          const winner = winnerIndex === 1 ? p1 : p2;
          winners.push(winner);
        
          // Find the game container inside the root
          const gameContainer = root.querySelector<HTMLDivElement>("#game-container");
          if (!gameContainer) return;
        
          // Overlay that only covers the canvas
          const overlay = document.createElement("div");
          overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6 overlay";
          gameContainer.appendChild(overlay);
        
          const nextBtn = document.createElement("button");
          nextBtn.textContent = "Proceed to Next Match";
          nextBtn.className ="mt-[35vh] w-[25vw] h-[6vh] bg-black font-bit text-[3vh] text-lime-500 rounded-lg transition-colors duration-300 hover:bg-lime-500 hover:text-black";
          overlay.appendChild(nextBtn);
        
          nextBtn.addEventListener("click", () => {
            if (!tournamentActive) return;
            root.innerHTML = "";
            currentMatchIndex++;
            playNextMatch();
          });
        },          
      });
    }
  }
}
