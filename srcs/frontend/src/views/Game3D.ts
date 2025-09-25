// src/views/Game3D.ts
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Color3,
  StandardMaterial,
  AxesViewer,
  BackgroundMaterial
} from "babylonjs";



export function renderGame3D(root: HTMLElement) {
  // Contenedor + canvas (mismo layout que antes)
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

  // Referencias DOM
  const canvas = container.querySelector<HTMLCanvasElement>("#game3d-canvas")!;
  const warn = container.querySelector<HTMLDivElement>("#webgl-warning")!;
  const backHomeButton = container.querySelector<HTMLAnchorElement>("#back-home")!;

  // Crear Engine de Babylon
  let engine: Engine | null = null;
  try {
    engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  } catch (_) {
    warn.classList.remove("hidden");
    return () => {};
  }

  if (!engine) {
    warn.classList.remove("hidden");
    return () => {};
  }

  // Crear escena básica
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0, 0, 0).toColor4(1);


  const camera = new ArcRotateCamera(
    "cam",
    3 * Math.PI / 2,   // alpha: apunta hacia -Z
    Math.PI / 4,       // beta: 45° por encima del plano (elevación)
    10,                 // radius
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2; // evita ir “debajo” de la escena
  camera.wheelPrecision = 40;          // sensibilidad del zoom

  // Luz ambiental
  const light = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  light.diffuse =  new Color3(1, 1, 1);
  light.groundColor = Color3.FromHexString("#FF9A5A");
  light.specular = Color3.FromHexString("#FF9A5A");   
  light.intensity = 0.9;
  
  //new AxesViewer(scene, 2);

  const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 6 }, scene);
  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = Color3.FromHexString("#164E63");
  ground.material = groundMat;

  const p1 = MeshBuilder.CreateBox("rect", { width: ground._width/40, height: 0.3, depth: ground._height/6 }, scene);
  const mat = new StandardMaterial("matP1", scene);
  mat.diffuseColor = Color3.FromHexString("#FF4C98");
  p1.material = mat;
  p1.position._x = -ground._width/2 + ground._width/80;
  p1.position.y = 0.15;

  const p2 = MeshBuilder.CreateBox("rect", { width: ground._width/40, height: 0.3, depth: ground._height/6 }, scene);
  p2.material = mat;
  p2.position._x = ground._width/2 - ground._width/80;
  p2.position.y = 0.15;

  const ball =  MeshBuilder.CreateBox("cube", { size: ground._width/40 }, scene);
  ball.position._x = 0;
  ball.position.y = 0.15;

  // Bucle de render
  let running = true;
  engine.runRenderLoop(() => {
    if (!running) return;
    scene.render();
  });

  // Resize
  const onResize = () => engine!.resize();
  window.addEventListener("resize", onResize);

  // Botón Back Home → limpiar
  backHomeButton.addEventListener("click", () => {
    running = false;
    window.removeEventListener("resize", onResize);
    scene.dispose();
    engine!.dispose();
    engine = null;
  });

  // Cleanup por si desmontas la vista programáticamente
  return () => {
    running = false;
    window.removeEventListener("resize", onResize);
    scene.dispose();
    engine?.dispose();
    engine = null;
  };
}
