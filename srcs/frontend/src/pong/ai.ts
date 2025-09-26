import { GameState, GameConfig } from "./types";

export interface AIController {
  stop: () => void;
}

export function startSimpleAI(
  playerIndex: 0 | 1, // 0 = left paddle, 1 = right paddle
  config: GameConfig,
  state: GameState,
  width: number,
  height: number
): AIController {
  let intervalId: number | null = null;

  intervalId = window.setInterval(() => {
    if (!state.gameRunning) return;

    // Where is the ball heading?
    const ballGoingRight = state.ballSpeedX > 0;

    // AI only reacts if the ball is moving towards its paddle
    if ((playerIndex === 0 && !ballGoingRight) || (playerIndex === 1 && ballGoingRight)) {
      // Predict where ball will be at paddle X
      const paddleX = playerIndex === 0 ? 20 + config.paddleWidth : width - 20 - config.paddleWidth;
      const framesUntilImpact = Math.abs((paddleX - state.ballX) / state.ballSpeedX);
      const predictedY = state.ballY + state.ballSpeedY * framesUntilImpact;

      // Target: center paddle on predicted ball Y
      const paddleCenter = playerIndex === 0
        ? state.paddle1Y + config.paddleHeight / 2
        : state.paddle2Y + config.paddleHeight / 2;

      if (predictedY < paddleCenter) {
        if (playerIndex === 0) state.paddle1Y = Math.max(0, state.paddle1Y - config.paddleSpeed);
        else state.paddle2Y = Math.max(0, state.paddle2Y - config.paddleSpeed);
      } else {
        if (playerIndex === 0) state.paddle1Y = Math.min(height - config.paddleHeight, state.paddle1Y + config.paddleSpeed);
        else state.paddle2Y = Math.min(height - config.paddleHeight, state.paddle2Y + config.paddleSpeed);
      }
    }
  }, 1000); // refresh every 1 second

  return {
    stop: () => {
      if (intervalId) clearInterval(intervalId);
    },
  };
}
