**clone the project and run make in terminal.**

**To access the website, visit http://localhost:8080**

Code is written in TypeScript. Browser only understands JavaScript, so the TypeScript code is compiled to JavaScript thanks to Docker.

HTML page styled with CSS allows to introduce the different pages & elements of the website.

The drawing and physics of the pong game on a canvas is also done with TypeScript (pong.ts)

Using Docker, we can build a Docker Image with nginx and all the frontend files copied inside.

Implemented Tailwind and React!

**Why React?**

Without React, you’d have one big index.html with multiple divs and manual navigation logic for the SPA (Single-Page Application):

HTML
```
<div id="home">Home Page</div>
<div id="game" class="hidden">Game Page</div>
<div id="results" class="hidden">Results Page</div>
<script src="app.js"></script>
```

TS (TypeScript)
```
// manual SPA logic
function navigateTo(pageId: string) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId)?.classList.remove('hidden');
  history.pushState({ page: pageId }, '', `#${pageId}`);
}
```

With React, all of this disappears.
We only keep a single entry point in index.html:

HTML
```
<!-- React takes over this div -->
<div id="root"></div>
```

And React Router handles the navigation cleanly:

TSX (TypeScript + JSX, meaning TypeScript with some HTML-style code)
```
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import ResultsPage from "./pages/ResultsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**NOTE: HashRouter is used for now, and we SHOULD change this in the future to a regular React Router.**
**https://reactrouter.com/6.30.1/router-components/hash-router**

_This makes the project modular: each page (Home, Game, Results) is its own component in pages/, instead of being mixed together in one HTML file._

**Why TailwindCSS?**

Allows us to style things more easily. Instead of having a long CSS file, we can write the details directly in HTML:

HTML
```
<button className="px-6 py-2 bg-stone-800 text-white rounded-xl shadow hover:bg-blue-500">
  Start Game
</button>
```

-> _No need to open/edit a separate stylesheet._

-> _Styles are consistent across components._

-> _Easy to prototype and keep the UI responsive._

We also have access to pretty cool-looking fonts (downloaded from Google Fonts [see styles.css + tailwind.config.js])



Next steps:

-> Make pong controls better: https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard (For now, the controls dont work when pressed at the same time.)

-> Add "Player 1" and "Player 2" in Blue and Red on pong game.

-> Add a Tournament page (A registration system and matchmaking).

-> Make the Results page better.

-> Switch to React Router, but that probably implies having a server.
