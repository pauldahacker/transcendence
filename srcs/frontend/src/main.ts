import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";
import { renderResults } from "./views/Results";
import { renderTournament} from "./views/Tournament";
import { renderGame3D } from "./views/Game3D";

// picks the correct view based on the URL hash
function router() {
  // document object: https://www.w3schools.com/js/js_htmldom_document.asp
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // clear

  // When a change of page is detected, the HTML element "app" is given to functions that render the specific view.
  switch (location.hash) {
    case "#/1player":
      renderGame(app, {onePlayer: true});
      break;
    case "#/2players":
      renderGame(app);
      break;
    case "#/game3d":              // nueva ruta
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

window.addEventListener("hashchange", router); // triggers whenever the part of the URL after # changes.
window.addEventListener("load", router); // triggers when the page first loads.
