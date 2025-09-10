import { renderHome } from "./pages/Home";
import { renderGame } from "./pages/Game";
import { renderResults } from "./pages/Results";
import { renderTournament} from "./pages/Tournament";

function router() {
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // clear

  switch (location.hash) {
    case "#/game":
      renderGame(app);
      break;
    case "#/tournament":
      renderTournament(app);
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
