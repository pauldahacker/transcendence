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

## Overview

### 1. Game start

A match starts by calling:
```
startPong(canvas, onGameOver, options)
```
or, in 3D mode:
```
startPong3D(canvas3D, onGameOver, options)
```
Responsibilities:

- Build the GameConfig from GameSettings
```
export interface GameConfig {
	paddleHeight: number;
	paddleWidth: number;
	paddleSpeed: number;
	ballSize: number;
	minSpeed : number;
	maxSpeed : number;
	maxBounceAngle : number;
}
```
```
export interface GameSettings {
    map: string;            // path to texture
    ballSpeed: number;      // multiplier (1x = normal)
    paddleSpeed: number;    // multiplier
	powerUps?: boolean;
}
```

- Initialize the GameState
```
export interface GameState {
	paddle1Y: number;
	paddle2Y: number;
	ballX: number;
	ballY: number;
	ballSpeedX: number;
	ballSpeedY: number;
	score1: number;
	score2: number;
	gameRunning: boolean;
	animationId?: number;

	ballFlash: number; // number of frames for flashing perfect shot

	powerUpSet?: boolean;
	powerUpActive?: boolean;
  	powerUpX?: number;
  	powerUpY?: number;
}
```

- Attach input listeners

- Start AI controllers (if enabled)

- Show the start screen

- Enter the main loop on user input

In 3D mode, a hidden 2D canvas runs the same startPong() logic, and the 3D renderer subscribes to per-frame state updates.

### 2. Input system

setupInput():

- Registers keydown / keyup

- Updates KeyState

- Blocks human input for AI-controlled players

- Returns a cleanup function

- Pause is handled separately via the Space bar.

### 3. Main game loop

The loop is driven by:

[requestAnimationFrame(loop)](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

Each frame:

Update phase → update()

Render phase → draw() (2D) and/or render3D()

If paused, only rendering runs.

### 4. Physics update (update())

Runs at ~60 FPS and performs:

- Player movement

- Moves paddles based on KeyState, clamped to screen bounds.

- Ball movement

- Updates position using current velocity.

- Wall collisions

- Inverts Y velocity when hitting top/bottom.

- Paddle collisions

- Checks AABB overlap and calls handleBounce().

- handleBounce():

- Computes impact position on paddle

- Applies an angle based on distance from center

- Increases speed toward maxSpeed

- Triggers a flash for “perfect” center hits

- Power-ups (optional)

- Scoring

- Calls onGameOver() with final state snapshot

### 5. Rendering (2D)

draw():

- Draws cached background image (map)

- Applies map-based paddle/ball colors

- Draws paddles, ball, power-up, and score

- Uses canvas scaling to support responsive sizes

- Rendering is skipped in 3D mode (skip2DDraw).

### 6. Start / pause flow

Start screen blocks the loop until a key is pressed

Space toggles pause

Pause overlays the canvas without stopping the render loop

### 7. Cleanup

The stop function:

- Cancels requestAnimationFrame

- Removes input listeners

- Stops AI intervals

- Disposes Babylon scene (3D)

- Removes hidden canvas (3D mode)

- This prevents memory leaks between matches.

## Features

### Customizable Gameplay

<p align="center">
  <img src="assets/customization.gif" alt="Customizable Gameplay" width="600"/>
</p>

Gameplay settings are stored in a shared GameSettings interface that is passed to the Pong engine at startup.

```
export interface GameSettings {
    map: string;            // path to texture
    ballSpeed: number;      // multiplier (1x = normal)
    paddleSpeed: number;    // multiplier
	powerUps?: boolean;
}
```

This configuration is consumed by both:

- the 2D renderer (physics and drawing)

- the 3D renderer (materials, skybox, paddle colors, environment)

This guarantees that all modes use the same game parameters.

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


