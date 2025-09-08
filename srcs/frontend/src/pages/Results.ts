export function renderResults(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[1vh] pb-[5vh]";

  container.innerHTML = `
    <h1 class="font-honk text-[10vh] animate-wobble">Results</h1>
    <a href="#/" id="back-home" class="mt-4 px-6 py-2 bg-stone-950 text-red-600 rounded-lg shadow hover:text-lime-400 font-bit text-[3vh]">
       Back Home
    </a>
  `;

  root.appendChild(container);
}
