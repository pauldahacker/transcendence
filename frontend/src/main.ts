import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";
import { renderResults } from "./views/Results";
import { renderLogin } from "./views/Login";
import { renderTournament} from "./views/Tournament";
import { renderGame3D } from "./views/Game3D";
import { renderRegister } from "./views/Register";
import { renderProfile } from "./views/Profile";
import { isUserLoggedIn } from "./userUtils/TokenUtils";
import { renderQuickGame } from "./views/QuickGame";
// NB! this is to test the tournamenbt functionality
import { renderTournamentDev } from "./views/TournamentDev";
import { renderBlockchainDev } from './views/BlockchainDev';


async function router() {
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // clear

  const loggedIn = await isUserLoggedIn();
  const route = location.hash;

  switch (location.hash) {
    case "#/quickgame":
      renderQuickGame(app);
      break;
    case "#/quickgame/ai":
      renderGame(app, { onePlayer: true }); // quick match vs AI
      break;
    case "#/quickgame/player":
      renderGame(app); // quick match vs local player
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
      if (route.startsWith("#/profile")) {
        if (!loggedIn) {
          localStorage.removeItem("auth_token");
          window.location.hash = "#/home";
          return;
        }
      
        const parts = route.split("/");
        const userIdStr = parts[2]; // e.g. "#/profile/42" → ["#/profile","42"]
        const userId = userIdStr ? parseInt(userIdStr) : undefined;
      
        renderProfile(app, userId);
        return;
      }
      // fallback to home
      renderHome(app);
      break;
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
