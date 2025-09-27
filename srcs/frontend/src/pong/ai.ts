import { GameState, GameConfig, KeyState } from "./types";

/*
How the AI works:

The subject requires the AI to:
- NOT use the A* algo,
- read the game data once per second,
- simulate keyboard input.

We use setInterval() to execute code repeatedly at fixed time intervals (in ms):
> Every 1000 ms:
   - If the ball is moving towards the AI paddle, simulate the ball trajectory (with bounces) until it reaches the paddle X.
   - If the ball is moving away, set targetY to the center of the canvas.
> Every 16 ms:
   - Simulate pressing up/down keys to move towards targetY.

This makes the AI a bit dumb (can only update its prediction once per second),
but it reacts smoothly at 60 fps by holding keys.
*/

export interface AIController {
  stop: () => void;
}

/** Predict where the ball will intersect with the paddle, considering wall bounces */
function predictBallY(
  state: GameState,
  config: GameConfig,
  width: number,
  height: number,
  paddleX: number
): number {
  let simX = state.ballX;
  let simY = state.ballY;
  let simVX = state.ballSpeedX;
  let simVY = state.ballSpeedY;

  while ((simVX > 0 && simX < paddleX) || (simVX < 0 && simX > paddleX)) {
    simX += simVX;
    simY += simVY;

    // Bounce on top
    if (simY <= 0) {
      simY = 0;
      simVY *= -1;
    }

    // Bounce on bottom
    if (simY + config.ballSize >= height) {
      simY = height - config.ballSize;
      simVY *= -1;
    }
  }

  return simY + config.ballSize / 2;
}

export function startSimpleAI(
  playerIndex: 0 | 1,
  config: GameConfig,
  state: GameState,
  width: number,
  height: number,
  keys: KeyState
): AIController {
  let predictionId: number | null = null;
  let movementId: number | null = null;
  let targetY: number | null = null;

  // Every 1000ms, recalculate target
  predictionId = window.setInterval(() => {
    if (!state.gameRunning) return;

    const ballGoingRight = state.ballSpeedX > 0;

    if ((playerIndex === 0 && !ballGoingRight) || (playerIndex === 1 && ballGoingRight)) {
      const paddleX = playerIndex === 0
        ? 20 + config.paddleWidth
        : width - 20 - config.paddleWidth;

      // Bounce-aware prediction
      targetY = predictBallY(state, config, width, height, paddleX);
    } else {
      // Idle in center when ball going away
      targetY = height / 2;
    }
  }, 1000);

  // Every 16 ms, simulate movement
  movementId = window.setInterval(() => {
    if (!state.gameRunning) return;

    // Reset keys
    if (playerIndex === 0) {
      keys["w"] = false;
      keys["s"] = false;
    } else {
      keys["ArrowUp"] = false;
      keys["ArrowDown"] = false;
    }

    if (targetY !== null) {
      const paddleCenter =
        playerIndex === 0
          ? state.paddle1Y + config.paddleHeight / 2
          : state.paddle2Y + config.paddleHeight / 2;

      if (targetY < paddleCenter - config.paddleSpeed) {
        if (playerIndex === 0) keys["w"] = true;
        else keys["ArrowUp"] = true;
      } else if (targetY > paddleCenter + config.paddleSpeed) {
        if (playerIndex === 0) keys["s"] = true;
        else keys["ArrowDown"] = true;
      }
    }
  }, 16); // ~60fps

  return {
    stop: () => {
      if (predictionId) clearInterval(predictionId);
      if (movementId) clearInterval(movementId);
    },
  };
}
