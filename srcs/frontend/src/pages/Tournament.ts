export function renderTournament(root: HTMLElement) {
    const container = document.createElement("div");
    container.className =
      "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[1vh] pb-[5vh]";
  
    container.innerHTML = `
      <h1 class="font-honk text-[10vh] animate-wobble">Tournament</h1>
      <a href="#/" 
       class="flex items-center justify-center w-[400px] h-[80px] rounded-full
              border-2 border-white text-white font-bit text-[5vh]
              transition-colors duration-300 hover:bg-white hover:text-cyan-900">
       Back Home
    </a>
    `;
  
    root.appendChild(container);
  }
  