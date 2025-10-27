import { GameState, GameConfig, KeyState, GameOverState } from "./types";
import { draw } from "./draw";
import { update } from "./update";
import { setupInput } from "./input";
import { showStartScreen } from "./startScreen";
import { showPauseScreen } from "./pause";
import { AIController, startSimpleAI } from "./ai";

/*
startPong(): boots up the Pong game loop, handles physics, drawing, input, AI, pause, and cleanup.
  canvas: the HTML element in which to draw the game
  onGameover: callback when either player wins (displays winning animation + end screen)
  options: which player(s) should be AI-controlled
*/
export function startPong(canvas: HTMLCanvasElement,
  onGameOver: (result: GameOverState) => void,
  options: {
    aiPlayer1?: boolean;
    aiPlayer2?: boolean;
    render3D?: (state: GameState, config: GameConfig) => void;
    skip2DDraw?: boolean;
  } = {}
) {
  const {
    aiPlayer1 = false,
    aiPlayer2 = false,
    render3D,
    skip2DDraw = false,
  } = options;

  const ctx = canvas.getContext("2d")!;

  canvas.width = canvas.clientWidth || canvas.width;
  canvas.height = canvas.clientHeight || canvas.height;

  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 600;

  const targetFPS = 60;

  const config: GameConfig = {
    paddleHeight: 100,
    paddleWidth: 25,
    paddleSpeed: BASE_HEIGHT / (1 * targetFPS),
    ballSize: 25,
    minSpeed: BASE_WIDTH / (2 * targetFPS),
    maxSpeed: BASE_WIDTH / (1 * targetFPS),
    maxBounceAngle: Math.PI / 4,
  };

  const state: GameState = {
    paddle1Y: BASE_HEIGHT / 2 - config.paddleHeight / 2,
    paddle2Y: BASE_HEIGHT / 2 - config.paddleHeight / 2,
    ballX: BASE_WIDTH / 2 - config.ballSize / 2,
    ballY: BASE_HEIGHT / 2 - config.ballSize / 2,
    ballSpeedX: Math.random() > 0.5 ? config.minSpeed / 3 : -config.minSpeed / 3,
    ballSpeedY:
      Math.random() > 0.5
        ? Math.random() * config.minSpeed / 3
        : Math.random() * -config.minSpeed / 3,
    score1: 0,
    score2: 0,
    gameRunning: true,
    ballFlash: 0,
  };

  const keys: KeyState = {};
  const cleanupInput = setupInput(keys, aiPlayer1, aiPlayer2);

  let paused = false;
  function handlePause(e: KeyboardEvent) {
    if (e.code === "Space") paused = !paused;
  }

  const aiControllers: AIController[] = []; // AI controllers stored in array so they can be stopped later.
  // If AI is enabled, start AI for that player (0 = left paddle, 1 = right paddle).
  if (aiPlayer1) aiControllers.push(startSimpleAI(0, config, state, BASE_WIDTH, BASE_HEIGHT, keys));
  if (aiPlayer2) aiControllers.push(startSimpleAI(1, config, state, BASE_WIDTH, BASE_HEIGHT, keys));

  function loop() {
    if (!state.gameRunning) return;

    if (!paused) {
      update(BASE_WIDTH, BASE_HEIGHT, state, config, keys, onGameOver);
    }

    // Dibujo 2D (opcional)
    if (!skip2DDraw) {
      ctx.save();
      ctx.scale(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
      draw(ctx, BASE_WIDTH, BASE_HEIGHT, state, config);
      ctx.restore();

      if (paused) showPauseScreen(canvas);
    }

    // Hook 3D por frame
    if (render3D) {
      render3D(state, config);
    }

    state.animationId = requestAnimationFrame(loop);
  }

  // At the end of the start screen (when a user presses a key), enter the loop.
  showStartScreen(canvas, () => {
    document.addEventListener("keydown", handlePause);
    loop();
  });

  // función de parada/limpieza
  return () => {
    state.gameRunning = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    cleanupInput();
    document.removeEventListener("keydown", handlePause);
    aiControllers.forEach((ai) => ai.stop());
  };
}