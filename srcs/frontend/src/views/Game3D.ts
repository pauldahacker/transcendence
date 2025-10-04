import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Color3,
  StandardMaterial,
} from "babylonjs";

import { startPong } from "../pong/startPong";
import { GameState, GameConfig } from "../pong/types";

export function renderGame3D(root: HTMLElement) {
  // Contenedor + canvas
  const container = document.createElement("div");
  container.className =
    "flex flex-col justify-between items-center h-screen pt-[2vh] pb-[2vh] min-h-[400px] min-w-[600px] relative mx-auto my-auto";

  container.innerHTML = `
    <h1 class="font-honk text-[5vh]">Pong 3D</h1>

    <div id="game3d-container" class="relative h-[80vh] aspect-[3/2]
                max-w-[calc(100vw-100px)] max-h-[calc(100vh-140px)]
                min-w-[300px] min-h-[200px]">
      
      <canvas id="game3d-canvas" class="w-full h-full border border-gray-500 rounded bg-black"></canvas>
      
      <div id="webgl-warning" class="hidden absolute inset-0 flex items-center justify-center text-center">
        <p class="font-bit text-[2.5vh] text-red-300">
          WebGL no está disponible en este navegador o dispositivo.
        </p>
      </div>
    </div>

    <a id="back-home" href="#/"
      class="flex items-center justify-center w-[25vw] h-[5vh] rounded-full min-w-[300px]
             border-2 border-gray-100 text-gray-100 font-bit text-[3vh]
             transition-colors duration-300 hover:bg-gray-100 hover:text-cyan-900">
      Back Home
    </a>
  `;

  root.innerHTML = "";
  root.appendChild(container);

  // Refs DOM
  const canvas3D = container.querySelector<HTMLCanvasElement>("#game3d-canvas")!;
  const warn = container.querySelector<HTMLDivElement>("#webgl-warning")!;
  const backHomeButton = container.querySelector<HTMLAnchorElement>("#back-home")!;

  // Engine Babylon
  let engine: Engine | null = null;
  try {
    engine = new Engine(canvas3D, true, { preserveDrawingBuffer: true, stencil: true });
  } catch {
    warn.classList.remove("hidden");
    return () => {};
  }
  if (!engine) {
    warn.classList.remove("hidden");
    return () => {};
  }

  //scene and background
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0, 0, 0).toColor4(1);
  
  //cam position and movement limits
  const camera = new ArcRotateCamera(
    "cam",
    (3 * Math.PI) / 2,
    Math.PI / 4,
    10,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas3D, true);
  camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2;
  camera.wheelPrecision = 40;

  //light
  const light = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  light.diffuse = new Color3(1, 1, 1);
  light.groundColor = Color3.FromHexString("#FF9A5A");
  light.specular = Color3.FromHexString("#FF9A5A");
  light.intensity = 0.9;

  //board
  const W = 10; // X
  const H = 6;  // Z
  const ground = MeshBuilder.CreateGround("ground", { width: W, height: H }, scene);
  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = Color3.FromHexString("#164E63");
  ground.material = groundMat;

  // Paddles n ball sizes
  const paddleXThickness = W / 40; // X
  const paddleDepth = H / 6;       // Z
  const paddleHeightY = 0.3;       // Y
  const ballSize3D = W / 40;

  //p1 model
  const p1 = MeshBuilder.CreateBox(
    "p1",
    { width: paddleXThickness, height: paddleHeightY, depth: paddleDepth },
    scene
  );
  const matP1 = new StandardMaterial("matP1", scene);
  matP1.diffuseColor = Color3.FromHexString("#FF4C98");
  p1.material = matP1;
  p1.position.y = paddleHeightY / 2;
  //p1.position.x = -W/2 + paddleXThickness;

  //p2 model
  const p2 = MeshBuilder.CreateBox(
    "p2",
    { width: paddleXThickness, height: paddleHeightY, depth: paddleDepth },
    scene
  );
  const matP2 = new StandardMaterial("matP2", scene);
  matP2.diffuseColor = Color3.FromHexString("#FF4C98");
  p2.material = matP2;
  //p2.position.x = W/2 - paddleXThickness;
  p2.position.y = paddleHeightY / 2;

  //ball model
  const ball = MeshBuilder.CreateBox("ball", { size: ballSize3D }, scene);
  const matBall = new StandardMaterial("matBall", scene);
  matBall.diffuseColor = Color3.FromHexString("#FFFFFF");
  ball.material = matBall;
  ball.position.y = paddleHeightY / 2;

  // 2d pixels to 3d coord converters
  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 600;
  const sx = W / BASE_WIDTH;
  const sz = H / BASE_HEIGHT;

  const wallMargin2D = 20;       // margin with edge
  //const paddleWidth2D = 10;      // del config
  
  // x positions
  const p1X = -W / 2 + (wallMargin2D) * sx + paddleXThickness / 2;
  const p2X =  W / 2 - (wallMargin2D) * sx - paddleXThickness / 2;
  p1.position.x = p1X;
  p2.position.x = p2X;

  // helpers: centro 2D -> pos 3D
  const mapXCenter = (xCenter2D: number) => (xCenter2D - BASE_WIDTH / 2) * sx;
  const mapZCenter = (yCenter2D: number) => (BASE_HEIGHT / 2 - yCenter2D) * sz;

  // Hidden 1 * 1 canvas to start 2d pong engine
  const hidden2D = document.createElement("canvas");
  hidden2D.width = 900;
  hidden2D.height = 600;
  hidden2D.style.display = "none";
  container.appendChild(hidden2D);

  // Start game
  const stopPong = startPong(
    hidden2D,
    (winner: number) => {
      const overlay = document.createElement("div");
      overlay.className = "absolute inset-0 flex flex-col justify-center items-center gap-6";
  
      // Winner message
       overlay.innerHTML = `
          <h2 class="text-[10vh] font-honk text-center animate-zoomIn">
            ${winner === 1 ? p1 : p2} Won!
          </h2>
        `;
      container.appendChild(overlay);
    },
    {
      skip2DDraw: true, //not draw in 2d
      render3D: (state: GameState, config: GameConfig) => {
        // Centros 2D
        const p1CenterY = state.paddle1Y + config.paddleHeight / 2;
        const p2CenterY = state.paddle2Y + config.paddleHeight / 2;
        const ballCenterX = state.ballX + config.ballSize / 2;
        const ballCenterY = state.ballY + config.ballSize / 2;

        // map center positions
        p1.position.x = p1X;
        p1.position.z = mapZCenter(p1CenterY);
        p2.position.x = p2X;
        p2.position.z = mapZCenter(p2CenterY);
        ball.position.x = mapXCenter(ballCenterX);
        ball.position.z = mapZCenter(ballCenterY);

        // flash
        if (state.ballFlash > 0) {
          (ball.material as StandardMaterial).diffuseColor = Color3.FromHexString("#2CFF1F");
        } else {
          (ball.material as StandardMaterial).diffuseColor = Color3.FromHexString("#FFFFFF");
        }
      },
      aiPlayer1:false,
      aiPlayer2:true
      // Puedes activar AI si quieres:
      // aiPlayer1: true, aiPlayer2: true,
    }
  );

  // Render Babylon
  let running = true;
  engine.runRenderLoop(() => {
    if (!running) return;
    scene.render();
  });

  // Resize
  const onResize = () => engine!.resize();
  window.addEventListener("resize", onResize);

  // cleaning
  const cleanup = () => {
    running = false;
    window.removeEventListener("resize", onResize);
    stopPong(); // stop 2d pong
    scene.dispose();
    engine!.dispose();
    engine = null;
  };

  backHomeButton.addEventListener("click", cleanup);

  return cleanup;
}
