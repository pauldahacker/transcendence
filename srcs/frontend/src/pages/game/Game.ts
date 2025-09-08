import { startPong } from "./pong";

export function renderGame(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center h-screen gap-[1vh] pb-[5vh] min-h-[400px] min-w-[600px] relative";

  container.innerHTML = `
    <h1 class="font-honk text-[8vh]">Pong Game</h1>
    <div class="h-[80vh] aspect-[3/2] max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px]">
      <canvas id="game-canvas" class="bg-black w-full h-full border border-gray-500 rounded"></canvas>
    </div>
    <a href="#/" class="mt-4 px-6 py-2 text-[5vh] bg-gray-500 rounded-xl shadow hover:bg-gray-600 font-honk">
      Back Home
    </a>
  `;

  root.appendChild(container);

  const canvas = container.querySelector<HTMLCanvasElement>("#game-canvas")!;
  startPong(canvas, (winner: number) => {
    location.hash = "#/results"; // redirect to results
  });
}
