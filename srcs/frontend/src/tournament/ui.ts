export function createAliasOverlay(numPlayers: number): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 bg-black/70 flex flex-col justify-center items-center gap-4";
  
    for (let i = 1; i <= numPlayers; i++) {
      const input = document.createElement("input");
      input.placeholder = `Player ${i}`;
      input.className = "text-center text-[4vh] font-bit w-[60vw] max-w-[300px]";
      overlay.appendChild(input);
    }
  
    return overlay;
  }
  
  export function createMatchList(matches: [string, string][]): HTMLDivElement {
    const matchListContainer = document.createElement("div");
    matchListContainer.className =
      "flex flex-col justify-between font-bit text-gray-100 items-center h-screen pt-[5vh] pb-[10vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto gap-4";
  
    matchListContainer.innerHTML = `
      <h2 class="text-[10vh] font-honk animate-wobble">Match List</h2>
      <div class="flex flex-row justify-center items-center gap-20">
        <div id="match-list" class="flex flex-col gap-2 w-full max-w-[60vw] min-w-[300px] text-[3vh]"></div>
        <button id="start-first-match" class="self-center w-[400px] h-[100px] border-4 border-lime-600 shadow-2xl
            text-lime-500 font-bit text-[4vh] rounded-full
            transition-colors duration-300 hover:shadow-lg hover:border-lime-500">
          Start
        </button>
      </div>
      <a href="#/" class="flex items-center justify-center w-[25vw] h-[6vh] border-2 border-gray-100 text-gray-100 text-[3vh] rounded-lg min-w-[300px]
          transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
        Back Home
      </a>
    `;
  
    const matchListDiv = matchListContainer.querySelector<HTMLDivElement>("#match-list")!;
    matches.forEach(([p1, p2], i) => {
      const matchEl = document.createElement("div");
      matchEl.className =
        i === 0
          ? "flex justify-between p-8 gap-8 border-2 border-lime-600 rounded text-[3vh]"
          : "flex justify-between p-8 border-2 gap-8 border-gray-600 rounded text-[3vh]";
      matchEl.innerHTML = `<span>Round ${i + 1}</span><span>${p1} vs ${p2}</span>`;
      matchListDiv.appendChild(matchEl);
    });
  
    return matchListContainer;
  }
  