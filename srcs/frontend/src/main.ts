import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";
import { renderResults } from "./views/Results";
import { renderTournament} from "./views/Tournament";
import { renderGame3D } from "./views/Game3D"; // 👈 importa tu nueva vista

function router() {
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // clear

  switch (location.hash) {
    case "#/1player":
      renderGame(app, {onePlayer: true});
      break;
    case "#/2players":
      renderGame(app);
      break;
    case "#/game3d":              // 👈 nueva ruta
      renderGame3D(app);
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
