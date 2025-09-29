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
  options: {
    aiPlayer1?: boolean;
    aiPlayer2?: boolean;
    render3D?: (state: GameState, config: GameConfig) => void; // ⬅ nuevo hook por frame
    skip2DDraw?: boolean;                                       // ⬅ no dibujar el canvas 2D
  } = {}
) {
  const {
    aiPlayer1 = false,
    aiPlayer2 = false,
    render3D,
    skip2DDraw = false,
  } = options;

  const ctx = canvas.getContext("2d")!;

  // Dimensiones reales del canvas (para el caso en que SÍ dibujemos 2D)
  canvas.width = canvas.clientWidth || canvas.width;
  canvas.height = canvas.clientHeight || canvas.height;

  // Espacio virtual fijo para la física
  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 600;

  const targetFPS = 60;
  // velocidades en "pixeles virtuales por frame"
  const config: GameConfig = {
    paddleHeight: 100,
    paddleWidth: 25,
    paddleSpeed: BASE_WIDTH / (1 * targetFPS),
    ballSize: 25,
    minSpeed: BASE_WIDTH / (1.5 * targetFPS),
    maxSpeed: BASE_WIDTH / (0.75 * targetFPS),
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
