import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";
import { renderResults } from "./views/Results";
import { renderLogin } from "./views/Login";
import { renderTournament} from "./views/Tournament";
import { renderGame3D } from "./views/Game3D";
import { renderRegister } from "./views/Register";
import { renderProfile } from "./views/Profile";
import { isUserLoggedIn } from "./userUtils/TokenUtils";
// NB! this is to test the tournamenbt functionality
import { renderTournamentDev } from "./views/TournamentDev";
import { renderBlockchainDev } from './views/BlockchainDev';


async function router() {
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // clear

  const loggedIn = await isUserLoggedIn();
  const route = location.hash;

  switch (location.hash) {
    case "#/1player":
      renderGame(app, {onePlayer: true});
      break;
    case "#/2players":
      renderGame(app);
      break;
    case "#/game3d":
      renderGame3D(app);
      break;
    case "#/tournament":
      renderTournament(app);
      break;
    case "#/results":
      renderResults(app);
      break;
    case "#/login":
      if (!loggedIn)
        renderLogin(app);
      else
        window.location.hash = "#/profile";
      break;
    case "#/register":
      if (!loggedIn)
         renderRegister(app);
      else
        window.location.hash = "#/profile";
      break;
    case "#/profile":
      if (loggedIn) {
        renderProfile(app);
      } else {
        localStorage.removeItem("auth_token");
        window.location.hash = "#/home";
      }
    break;
    //NB! this is to test the tournament backend functionality
    case "#/tournament-dev": {
      const devEnabled = String(import.meta.env.VITE_ENABLE_DEV_PAGES) === "true";
      if (devEnabled) {
        renderTournamentDev(app);
      } else {
        renderHome(app);
      }
      break;
    }
    // NB! This is to test the blockchain functionality 
    case '#/blockchain-dev':
      if (import.meta.env.VITE_ENABLE_DEV_PAGES === 'true') {
        renderBlockchainDev();
      } else {
        document.body.innerHTML = '<p>Dev pages are disabled</p>';
      }
      break;
    default:
      renderHome(app);
      break;
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
