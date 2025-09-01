First clone the project:

```
git clone https://github.com/pauldahacker/transcendence.git
```

Then run:

```
make
```

in terminal.


To access the website, visit http://localhost:8080Th

Code is written in TypeScript. Browser only understands JavaScript, so the TypeScript code is compiled to JavaScript and stored in frontend/dist/

HTML page styled with CSS allows to introduce the different pages & elements of the website.

The navigation (URL changes, back/next buttons, clicks, etc) is handled with TypeScript (app.ts) (dist/app.js after compilation)

The drawing and physics of the pong game on a <canvas> is also done with TypeScript (pong.ts) (dist/pong.js after compilation)

Using Docker, we can build a Docker Image with nginx and all the frontend files copied inside.
