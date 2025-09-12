import { GameState, GameConfig } from "./types";

export function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState, config: GameConfig) {
  const { paddleHeight, paddleWidth, ballSize } = config;
  const { paddle1Y, paddle2Y, ballX, ballY, score1, score2 } = state;

  ctx.fillStyle = "rgba(8, 51, 68, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = state.paddle1Flash > 0 ? "lime" : "white";
  ctx.fillRect(20, paddle1Y, paddleWidth, paddleHeight);
  ctx.fillStyle = state.paddle2Flash > 0 ? "lime" : "white";
  ctx.fillRect(canvas.width - 20 - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

  ctx.fillStyle = state.ballFlash > 0 ? "lime" : "white";
  ctx.fillRect(ballX, ballY, ballSize, ballSize);

  ctx.font = "50px Honk";
  ctx.fillText(`${score1}`, canvas.width / 4, 50);
  ctx.fillText(`${score2}`, (canvas.width * 3) / 4, 50);
}
