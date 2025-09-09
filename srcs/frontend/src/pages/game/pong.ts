import { GameState, GameConfig, KeyState } from "./types";
import { draw } from "./draw";
import { update } from "./update";
import { setupInput } from "./input";
import { showStartScreen } from "./startScreen";
import { showPauseScreen } from "./pause";

export function startPong(canvas: HTMLCanvasElement, onGameOver: (winner: number) => void) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const config: GameConfig = {
    paddleHeight: canvas.height / 6,
    paddleWidth: canvas.width / 40,
    ballSize: canvas.width / 40,
  };

  const state: GameState = {
    paddle1Y: canvas.height / 2 - config.paddleHeight / 2,
    paddle2Y: canvas.height / 2 - config.paddleHeight / 2,
    ballX: canvas.width / 2,
    ballY: canvas.height / 2,
    ballSpeedX: Math.random() > 0.5 ? 4 : -4,
    ballSpeedY: 0,
    score1: 0,
    score2: 0,
    gameRunning: true,
  };

  const keys: KeyState = {};
  const cleanupInput = setupInput(keys);

  let paused = false;
  function handlePause(e: KeyboardEvent) {
    if (e.code === "Space") {
      paused = !paused;
    }
  }

  function loop() {
    if (!state.gameRunning) return;
    if (!paused) {
      update(canvas, state, config, keys, onGameOver);
      draw(ctx, canvas, state, config);
    } else {
      draw(ctx, canvas, state, config);
      showPauseScreen(canvas);
    }
    state.animationId = requestAnimationFrame(loop);
  }

  showStartScreen(canvas, () => {
    document.addEventListener("keydown", handlePause); // <-- add listener here
    loop();
  });

  return () => {
    state.gameRunning = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    cleanupInput();
  };
}
