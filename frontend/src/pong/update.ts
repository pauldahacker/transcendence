import { GameState, GameConfig, KeyState } from "./types";

// updates the game state for a single frame (width & height are the virtual game are dimensions).
export function update(
  width: number,
  height: number,
  state: GameState,
  config: GameConfig,
  keys: KeyState,
  onGameOver: (winner: number) => void
) {
  const { paddleHeight, paddleWidth, ballSize } = config;

  // Player movement (depends on keys pressed)
  if (keys["w"]) state.paddle1Y = Math.max(0, state.paddle1Y - config.paddleSpeed);
  if (keys["s"]) state.paddle1Y = Math.min(height - paddleHeight, state.paddle1Y + config.paddleSpeed);
  if (keys["ArrowUp"]) state.paddle2Y = Math.max(0, state.paddle2Y - config.paddleSpeed);
  if (keys["ArrowDown"]) state.paddle2Y = Math.min(height - paddleHeight, state.paddle2Y + config.paddleSpeed);

  // Ball movement
  state.ballX += state.ballSpeedX;
  state.ballY += state.ballSpeedY;

  // Wall collisions
  if (state.ballY <= 0) {
    state.ballY = 0;
    state.ballSpeedY *= -1;
  }
  if (state.ballY + ballSize >= height) {
    state.ballY = height - ballSize;
    state.ballSpeedY *= -1;
  }

  // Paddle collisions
  // Left paddle
  if (
    state.ballX <= 20 + paddleWidth &&
    state.ballY + ballSize >= state.paddle1Y &&
    state.ballY <= state.paddle1Y + paddleHeight
  ) {
    state.ballX = 20 + paddleWidth;
    handleBounce(state, config, state.paddle1Y, paddleHeight, 1);
  }

  // Right paddle
  if (
    state.ballX + ballSize >= width - 20 - paddleWidth &&
    state.ballY + ballSize >= state.paddle2Y &&
    state.ballY <= state.paddle2Y + paddleHeight
  ) {
    state.ballX = width - 20 - paddleWidth - ballSize;
    handleBounce(state, config, state.paddle2Y, paddleHeight, -1);
  }

  // Flash timers
  if (state.ballFlash > 0) state.ballFlash--;

  // Scoring
  if (state.ballX < 0) {
    state.score2++;
    resetBall(width, height, config, state);
  } else if (state.ballX > width) {
    state.score1++;
    resetBall(width, height, config, state);
  }

  // Game over
  if (state.score1 === 3) {
    state.gameRunning = false;
    onGameOver(1);
  }
  if (state.score2 === 3) {
    state.gameRunning = false;
    onGameOver(2);
  }
}

function handleBounce(
  state: GameState,
  config: GameConfig,
  paddleY: number,
  paddleHeight: number,
  direction: 1 | -1
) {
  const relativeIntersectY = (state.ballY + config.ballSize / 2) - (paddleY + paddleHeight / 2); // where on the paddle the ball hits
  const normalized = relativeIntersectY / (paddleHeight / 2); // normalized to [-1 (top), 0 (center), 1 (bottom)]

  if (Math.abs(normalized) <= 0.15) state.ballFlash = 20; // if close to center, "perfect" shot

  const bounceAngle = normalized * config.maxBounceAngle; // get the angle depending on where it hit
  const speedRatio = 1 - Math.abs(normalized); // make speed quicker the close the ball is to the center

  state.ballSpeedX = direction * Math.max(config.maxSpeed * speedRatio, config.minSpeed);
  state.ballSpeedY = direction * state.ballSpeedX * Math.sin(bounceAngle);
}

function resetBall(width: number, height: number, config: GameConfig, state: GameState) {
  state.ballX = width / 2 - config.ballSize / 2;
  state.ballY = height / 2 - config.ballSize / 2;
  state.ballSpeedX = Math.random() > 0.5 ? config.minSpeed / 3 : -config.minSpeed / 3;
  state.ballSpeedY = Math.random() > 0.5 ? Math.random() * config.minSpeed / 3 : Math.random() * -config.minSpeed / 3;
}
