import { GameState, GameConfig, KeyState } from "./types";
import { draw } from "./draw";
import { update } from "./update";
import { setupInput } from "./input";
import { showStartScreen } from "./startScreen";
import { showPauseScreen } from "./pause";

export function startPong(canvas: HTMLCanvasElement, onGameOver: (winner: number) => void, options: { aiPlayer1?: boolean; aiPlayer2?: boolean } = {}) {
  const { aiPlayer1 = false, aiPlayer2 = false } = options;
  
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 600;

  const scaleX = canvas.width / BASE_WIDTH;
  const scaleY = canvas.height / BASE_HEIGHT;

  // const config: GameConfig = {
  //   paddleHeight: canvas.height / 6,
  //   paddleWidth: canvas.width / 40,
  //   paddleSpeed: canvas.height / 80,
  //   ballSize: canvas.width / 40,
  //   minSpeedX : canvas.width / 160,
  //   maxSpeedX : canvas.width / 80,
  //   maxBounceAngle : Math.PI / 4,
  // };

  const config: GameConfig = {
    paddleHeight: canvas.height / 6,
    paddleWidth: canvas.width / 40,
    paddleSpeed: 10 * scaleY,
    ballSize: canvas.width / 40,
    minSpeedX: 10 * scaleX,
    maxSpeedX: 20 * scaleX,
    maxBounceAngle: Math.PI / 4,
  };


  const state: GameState = {
    paddle1Y: canvas.height / 2 - config.paddleHeight / 2,
    paddle2Y: canvas.height / 2 - config.paddleHeight / 2,
    ballX: canvas.width / 2 - config.ballSize / 2,
    ballY: canvas.height / 2 - config.ballSize / 2,
    ballSpeedX: Math.random() > 0.5 ?  config.minSpeedX / 2 : -config.minSpeedX / 2,
    ballSpeedY: Math.random() > 0.5 ? Math.random() * config.minSpeedX / 2 : Math.random() * -config.minSpeedX / 2,
    score1: 0,
    score2: 0,
    gameRunning: true,
    ballFlash: 0,
    paddle1Flash: 0,
    paddle2Flash: 0,
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
    document.removeEventListener("keydown", handlePause);
  };
}
