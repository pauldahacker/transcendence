# transcendence - 42 project

<p align="center">
  <img src="assets/pongHome.jpg" alt="Transcendence Home Page" width="600"/>
</p>

A full-stack Pong game with extensive [features](#features) built as the final project of 42's Common Core.
Developed with Fastify (Node.js), TypeScript, Tailwind, and an SQLite-backed microservice architecture, the project combines gameplay, user management, modern web design, blockchain integration, and 3D graphics.

It includes [customizable gameplay](#customizable-gameplay), an [AI opponent](#ai-opponent), [3D visual enhancements](#3d-graphics), [tournament score storage on the Avalanche blockchain](#tournament-scores-stored-in-avalanche-blockchain), and [structured log management infrastructure](#log-management). Designed with scalability and modularity in mind!

For the full checklist, check [this](docs/CHECKLIST.md) out.
## Installation

Make sure you have `docker` and `make` installed on your machine. Then, clone this repository and run:

```bash
make
```

This will display a list of available commands. For a first run, simply run:

```bash
make up
```
This will create a default `.env` file, build the Docker images and start the containers.

Once compilation is done, visit https://localhost

## Features

### Customizable Gameplay

<p align="center">
  <img src="assets/customization.gif" alt="Customizable Gameplay" width="600"/>
</p>

#### Maps

- **Default**: The standard pong layout with a simple blue background and white paddles.  
- **Space**: A starry background with pink paddles.  
- **Barcelona**: A Barcelona background with yellow paddles.
- **Istanbul**: A Istanbul background with default white paddles.
- **Moscow**: A Moscow background with pink paddles.

#### Game speed (Ball + Paddles)

- **Slow**: 0.75 x default speed
- **Default**: Default speed
- **Slow**: 1.5 x default speed

### AI Opponent

<p align="center">
  <img src="assets/AIGameplay.gif" alt="AI Gameplay" width="600"/>
</p>

#### Subject requirements

- The [A* algo](https://en.wikipedia.org/wiki/A*_search_algorithm) is forbidden,
- The AI has to read the game data *once per second*,
- The AI has to simulate keyboard input.

#### The "Decision-making"

We use [setInterval()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval) to execute code repeatedly at fixed time intervals (in ms):
Every 1000 ms (1 second):
- If the ball is moving towards the AI paddle, simulate the ball trajectory (with bounces) until it reaches the paddle X.
- If the ball is moving away, set targetY to the center of the canvas.

```
window.setInterval(() => {
    [...]

    if ((playerIndex === 0 && !ballGoingRight) || (playerIndex === 1 && ballGoingRight)) {
      targetY = predictBallY(state, config, width, height, paddleX);
    } else {
      targetY = height / 2;
    }
  }, 1000);
```
Note: predictBallY() uses the ball position and speed (x,y) to predict where exactly it will end up.

#### Pressing keys

We use the [Record<Keys, Type>](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type) to store and update the keys that need to be pressed.
We once again use setInterval() so that every 16 ms, the AI controller checks targetY, and updates the key states to move paddleY towards targetY.

```
window.setInterval(() => {
    [...]

    if (targetY !== null) {
      [...]

      if (targetY < paddleCenter - config.paddleSpeed) {
        if (playerIndex === 0) keys["w"] = true;
        else keys["ArrowUp"] = true;
      } else if (targetY > paddleCenter + config.paddleSpeed) {
        if (playerIndex === 0) keys["s"] = true;
        else keys["ArrowDown"] = true;
      }
    }
  }, 16); // ~60fps

```

### 3D Graphics

<p align="center">
  <img src="assets/AI3DGameplay.gif" alt="AI 3D Gameplay" width="600"/>
</p>

### Tournament scores stored in Avalanche blockchain

<p align="center">
  <img src="assets/blockchain.gif" alt="Avalanche Blockchain" width="600"/>
</p>

### Log management

<p align="center">
  <img src="assets/log.gif" alt="Log Management" width="600"/>
</p>

## About

If you don't have a clue how anything works, this very simple pong game gives a good idea of the basic stuff:

https://www.geeksforgeeks.org/javascript/pong-game-in-javascript/

Code is written in TypeScript. Browser only understands JavaScript, so the TypeScript code is compiled to JavaScript thanks to Docker.

HTML page styled with Tailwind CSS allows to introduce the different pages & elements of the website. No need to open/edit a separate stylesheet, styles are consistent across components and easy to prototype and keep the UI responsive.

The drawing and physics of the pong game on a canvas is also done with TypeScript (pong.ts)

Using Docker, we can build a Docker Image with nginx and all the frontend files copied inside.

## Useful resources:

- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API (the Canvas API is used to draw the pong game)

- https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API

- https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model


