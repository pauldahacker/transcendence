import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";
import { renderResults } from "./views/Results";
import { renderTournament} from "./views/Tournament";

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
