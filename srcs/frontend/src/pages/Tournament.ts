export function renderTournament(root: HTMLElement) {
    const container = document.createElement("div");
    container.className =
    "flex flex-col justify-between items-center h-screen pt-[5vh] pb-[10vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";
  
    container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Tournament</h1>
    <div class="flex items-center justify-center gap-[5vw]">
        <button id="btn-2p" class="w-[25vw] h-[25vw] border-2 border-gray-100 text-gray-100 font-bit text-[5vh] rounded-lg
            transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
            2 players
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
  
    root.appendChild(container);

    const button2p = document.getElementById("btn-2p")!;
    const button4p = document.getElementById("btn-4p")!;

    button2p.addEventListener("click", () => showAliasOverlay(2));
    button4p.addEventListener("click", () => showAliasOverlay(4));

    function showAliasOverlay(numPlayers: number) {
        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 bg-black/70 flex flex-col justify-center items-center gap-4";
      
        for (let i = 1; i <= numPlayers; i++) {
          const input = document.createElement("input");
          input.placeholder = `Player ${i}`;
          input.className = "text-center text-[4vh] font-bit w-[60vw] max-w-[300px]";
          overlay.appendChild(input);
        }
      
        const startButton = document.createElement("button");
        startButton.textContent = "Start Tournament";
        startButton.className = "mt-4 w-[25vw] h-[6vh] bg-lime-500 font-bit text-[3vh] rounded-lg";
        overlay.appendChild(startButton);
      
        document.body.appendChild(overlay);
      
        startButton.addEventListener("click", () => {
          // Gather aliases and start tournament
          const aliases = Array.from(overlay.querySelectorAll<HTMLInputElement>("input")).map(input => input.value || `Player`);
          console.log("Starting tournament with aliases:", aliases);
          overlay.remove(); // remove overlay once done
        });
      }
      
  }
  