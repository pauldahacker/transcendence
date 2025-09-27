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
  const { aiPlayer1 = false, aiPlayer2 = false } = options;
  const ctx = canvas.getContext("2d")!;

  // Real canvas dimensions
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Virtual resolution (fixed physics space)
  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 600;

  // changed the speed to fixed FPS:
  // -> we measure speed in how much time it takes to go from one end to the other
  const targetFPS = 60; // requestAnimationFrame() is by default 60 FPS (1 frame every 16.667 ms)
  const minSpeed = BASE_WIDTH / (2 * targetFPS); // cross in 2 seconds
  const maxSpeed = BASE_WIDTH / (1 * targetFPS); // cross in 1 second
  

  // Physics config (independent of actual screen size)
  const config: GameConfig = {
    paddleHeight: 100,
    paddleWidth: 25,
    paddleSpeed: BASE_WIDTH / (1 * targetFPS),
    ballSize: 25,
    minSpeed: BASE_WIDTH / (1.5 * targetFPS),
    maxSpeed: BASE_WIDTH / (0.75 * targetFPS),
    maxBounceAngle: Math.PI / 4,
  };

  // State in virtual resolution
  const state: GameState = {
    paddle1Y: BASE_HEIGHT / 2 - config.paddleHeight / 2,
    paddle2Y: BASE_HEIGHT / 2 - config.paddleHeight / 2,
    ballX: BASE_WIDTH / 2 - config.ballSize / 2,
    ballY: BASE_HEIGHT / 2 - config.ballSize / 2,
    ballSpeedX: Math.random() > 0.5 ? config.minSpeed / 3 : -config.minSpeed / 3,
    ballSpeedY: Math.random() > 0.5 ? Math.random() * config.minSpeed / 3 : Math.random() * -config.minSpeed / 3,
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
  if (aiPlayer1) aiControllers.push(startSimpleAI(0, config, state, BASE_WIDTH, BASE_HEIGHT, keys));
  if (aiPlayer2) aiControllers.push(startSimpleAI(1, config, state, BASE_WIDTH, BASE_HEIGHT, keys));

  function loop() {
    if (!state.gameRunning) return;
    if (!paused) {
      update(BASE_WIDTH, BASE_HEIGHT, state, config, keys, onGameOver);
    }

    // Scale drawing to match actual canvas size
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
