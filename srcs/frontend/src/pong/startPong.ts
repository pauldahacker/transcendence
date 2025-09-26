import { GameState, GameConfig, KeyState } from "./types";
import { draw } from "./draw";
import { update } from "./update";
import { setupInput } from "./input";
import { showStartScreen } from "./startScreen";
import { showPauseScreen } from "./pause";
import { AIController, startSimpleAI } from "./ai";

export function startPong(
  canvas: HTMLCanvasElement,
  onGameOver: (winner: number) => void,
  options: { aiPlayer1?: boolean; aiPlayer2?: boolean } = {}
) {
  const { aiPlayer1 = false, aiPlayer2 = true } = options;
  const ctx = canvas.getContext("2d")!;

  // Real canvas dimensions
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Virtual resolution
  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 600;

  const config: GameConfig = {
    paddleHeight: 100,
    paddleWidth: 25,
    paddleSpeed: 8,
    ballSize: 25,
    minSpeedX: 4,
    maxSpeedX: 10,
    maxBounceAngle: Math.PI / 4,
  };

  const state: GameState = {
    paddle1Y: BASE_HEIGHT / 2 - config.paddleHeight / 2,
    paddle2Y: BASE_HEIGHT / 2 - config.paddleHeight / 2,
    ballX: BASE_WIDTH / 2 - config.ballSize / 2,
    ballY: BASE_HEIGHT / 2 - config.ballSize / 2,
    ballSpeedX: Math.random() > 0.5 ? config.minSpeedX / 2 : -config.minSpeedX / 2,
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
    if (e.code === "Space") paused = !paused;
  }

  const aiControllers: AIController[] = [];
  if (aiPlayer1) aiControllers.push(startSimpleAI(0, config, state, BASE_WIDTH, BASE_HEIGHT));
  if (aiPlayer2) aiControllers.push(startSimpleAI(1, config, state, BASE_WIDTH, BASE_HEIGHT));


  function loop() {
    if (!state.gameRunning) return;
    if (!paused) {
      update(BASE_WIDTH, BASE_HEIGHT, state, config, keys, onGameOver);
    }

    ctx.save();
    ctx.scale(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    draw(ctx, BASE_WIDTH, BASE_HEIGHT, state, config);
    ctx.restore();

    if (paused) showPauseScreen(canvas);

    state.animationId = requestAnimationFrame(loop);
  }

  showStartScreen(canvas, () => {
    document.addEventListener("keydown", handlePause);
    loop();
  });

  return () => {
    state.gameRunning = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    cleanupInput();
    document.removeEventListener("keydown", handlePause);
    aiControllers.forEach(ai => ai.stop());
  };
}
