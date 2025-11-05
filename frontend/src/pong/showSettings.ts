import { GameSettings } from "./types";

export async function showGameSettings(): Promise<GameSettings | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 bg-black/70 flex justify-center items-center z-50";

    overlay.innerHTML = `
      <div class="bg-cyan-900 border-4 border-cyan-700 rounded-2xl p-6 w-[400px] shadow-xl text-white font-bit text-center">
        <h2 class="text-3xl mb-4">Game Settings</h2>

        <div class="flex flex-col gap-6 text-left">
          <div>
            <span class="block mb-2 text-lg">Map</span>
              <div id="map-options" class="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
                <div data-map="default"
                  class="map-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                Default
                </div>
                <div data-map="/textures/space.jpg"
                  class="map-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                Space
                </div>
                <div data-map="/textures/barcelona.jpg"
                  class="map-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                Barcelona
                </div>
                <div data-map="/textures/istanbul.jpg"
                  class="map-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                Istanbul
                </div>
                <div data-map="/textures/moscow.jpg"
                  class="map-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                Moscow
                </div>
              </div>
            </div>

            <div>
              <span class="block mb-2 text-lg">Speed</span>
              <div id="speed-options" class="flex justify-around gap-4">
                <div data-speed="0.75"
                   class="speed-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                    Slow
                </div>
              <div data-speed="1"
                   class="speed-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                    Default
              </div>
              <div data-speed="1.5"
                   class="speed-option px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
                Quick
              </div>
            </div>
          </div>

          <div>
          <span class="block mb-2 text-lg">Power-Up</span>
          <div id="powerup-option"
            class="px-4 py-2 bg-cyan-800 rounded-md border-2 border-cyan-700 cursor-pointer text-center transition hover:scale-110 hover:border-lime-400">
              ❓ Power-Up: Off
          </div>
        </div>
        </div>

        <div class="mt-10 flex justify-center gap-4">
          <button id="start-btn"
            class="px-4 py-2 bg-lime-500 text-black rounded hover:bg-lime-400 transition">
            Start
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Browser back handling
    window.history.pushState({ settingsOpen: true }, "");
    const onPopState = () => {
      cleanup();
      resolve(null);
    };
    window.addEventListener("popstate", onPopState);

    // ELEMENTS
    const startBtn = overlay.querySelector<HTMLButtonElement>("#start-btn")!;
    const mapOptions = overlay.querySelectorAll<HTMLDivElement>(".map-option");
    const speedOptions = overlay.querySelectorAll<HTMLDivElement>(".speed-option");

    // DEFAULTS
    let selectedMap = "";
    let selectedSpeed = 1;

    mapOptions.forEach(opt => {
      opt.addEventListener("click", () => {
        mapOptions.forEach(o => o.classList.remove("ring-4", "ring-lime-400"));
        opt.classList.add("ring-4", "ring-lime-400");
        selectedMap = opt.dataset.map || "";
      });
    });

    speedOptions.forEach(opt => {
      opt.addEventListener("click", () => {
        speedOptions.forEach(o => o.classList.remove("ring-4", "ring-lime-400"));
        opt.classList.add("ring-4", "ring-lime-400");
        selectedSpeed = parseFloat(opt.dataset.speed || "1");
      });
    });

    const powerUpOption = overlay.querySelector<HTMLDivElement>("#powerup-option")!;
    let powerUpsEnabled = false;

    powerUpOption.addEventListener("click", () => {
      powerUpsEnabled = !powerUpsEnabled;
      powerUpOption.textContent = powerUpsEnabled ? "❓ Power-Up: On" : "❓ Power-Up: Off";
      powerUpOption.classList.toggle("ring-4", powerUpsEnabled);
      powerUpOption.classList.toggle("ring-lime-400", powerUpsEnabled);
    });
    // Set defaults
    mapOptions[0].click();
    speedOptions[1].click();

    function cleanup() {
      overlay.remove();
      window.removeEventListener("popstate", onPopState);
      history.back(); // restore stack so back works properly after close
    }

    startBtn.addEventListener("click", () => {
      const settings: GameSettings = {
        map: selectedMap === "default" ? "" : selectedMap,
        ballSpeed: selectedSpeed,
        paddleSpeed: selectedSpeed,
        powerUps: powerUpsEnabled,
      };
      cleanup();
      resolve(settings);
    });
  });
}
