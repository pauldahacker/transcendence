import { GameState, GameConfig, KeyState } from "./types";

export function update(
  canvas: HTMLCanvasElement,
  state: GameState,
  config: GameConfig,
  keys: KeyState,
  onGameOver: (winner: number) => void
) {
  const { paddleHeight, paddleWidth, ballSize } = config;

  if (keys["w"]) state.paddle1Y = Math.max(0, state.paddle1Y - config.paddleSpeed);
  if (keys["s"]) state.paddle1Y = Math.min(canvas.height - paddleHeight, state.paddle1Y + config.paddleSpeed);
  if (keys["ArrowUp"]) state.paddle2Y = Math.max(0, state.paddle2Y - config.paddleSpeed);
  if (keys["ArrowDown"]) state.paddle2Y = Math.min(canvas.height - paddleHeight, state.paddle2Y + config.paddleSpeed);

  state.ballX += state.ballSpeedX;
  state.ballY += state.ballSpeedY;

  if (state.ballY <= 0) {
    state.ballY = 0;
    state.ballSpeedY *= -1;
  }
  if (state.ballY + ballSize >= canvas.height) {
    state.ballY = canvas.height - ballSize;
    state.ballSpeedY *= -1;
  }

  // Right paddle
  if (
    state.ballX + ballSize >= canvas.width - 20 - paddleWidth &&
    state.ballY + ballSize >= state.paddle2Y &&
    state.ballY <= state.paddle2Y + paddleHeight
  ) {
    state.ballX = canvas.width - 20 - paddleWidth - ballSize;

    const relativeIntersectY = (state.ballY + ballSize / 2) - (state.paddle2Y + paddleHeight / 2);
    const normalized = relativeIntersectY / (paddleHeight / 2);
    
    // perfect shot
    if (Math.abs(normalized) <= 0.15) state.ballFlash = 20; 
    const bounceAngle = normalized * config.maxBounceAngle;

    const speedRatio = 1 - Math.abs(normalized);

    state.ballSpeedX = -1 * Math.max(config.maxSpeedX * speedRatio, config.minSpeedX);
    state.ballSpeedY = state.ballSpeedX * Math.sin(bounceAngle);
  }

  // Left paddle
  if (
    state.ballX <= 20 + paddleWidth &&
    state.ballY + ballSize >= state.paddle1Y &&
    state.ballY <= state.paddle1Y + paddleHeight
  ) {
    state.ballX = 20 + paddleWidth;

    const relativeIntersectY = (state.ballY + ballSize / 2) - (state.paddle1Y + paddleHeight / 2);
    const normalized = relativeIntersectY / (paddleHeight / 2);
    if (Math.abs(normalized) <= 0.15) state.ballFlash = 20; 
    const bounceAngle = normalized * config.maxBounceAngle;

    const speedRatio = 1 - Math.abs(normalized);
    state.ballSpeedX = Math.max(config.maxSpeedX * speedRatio, config.minSpeedX);
    state.ballSpeedY = state.ballSpeedX * Math.sin(bounceAngle);
  }

  if (state.ballFlash > 0) state.ballFlash--;
  if (state.paddle1Flash > 0) state.paddle1Flash--;
  if (state.paddle2Flash > 0) state.paddle2Flash--;

  // Scoring
  if (state.ballX < 0) {
    state.score2++;
    resetBall(canvas, state);
  } else if (state.ballX > canvas.width) {
    state.score1++;
    resetBall(canvas, state);
  }

  if (state.score1 === 3) {
    state.gameRunning = false;
    onGameOver(1);
  }
  if (state.score2 === 3) {
    state.gameRunning = false;
    onGameOver(2);
  }
}

function resetBall(canvas: HTMLCanvasElement, state: GameState) {
  state.ballX = canvas.width / 2 - canvas.width / 80; // half ball size
  state.ballY = canvas.height / 2 - canvas.width / 80;
  
  state.ballSpeedX = Math.random() > 0.5 ?  canvas.width / 300 : -canvas.width / 300;
  state.ballSpeedY = Math.random() > 0.5 ? Math.random() * canvas.width / 300 : Math.random() * -canvas.width / 300;
}