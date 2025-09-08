export function renderResults(root: HTMLElement) {
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[1vh] pb-[5vh] font-honk text-[5vh]";

  container.innerHTML = `
    <h1>Results Page</h1>
    <a href="#/" id="back-home"
       class="px-6 py-2 bg-gray-500 text-white rounded-xl shadow hover:bg-gray-600">
       Back Home
    </a>
  `;

  root.appendChild(container);
}
