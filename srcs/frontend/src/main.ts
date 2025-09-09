import { renderHome } from "./pages/Home";
import { renderGame } from "./pages/game/renderGame";
import { renderResults } from "./pages/Results";

function router() {
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // clear

  switch (location.hash) {
    case "#/game":
      renderGame(app);
      break;
    case "#/results":
      renderResults(app);
      break;
    default:
      renderHome(app);
      break;
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
