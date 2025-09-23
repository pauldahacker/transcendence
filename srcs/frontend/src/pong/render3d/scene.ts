import {
  Engine, Scene, ArcRotateCamera, Vector3,
  HemisphericLight, MeshBuilder, GlowLayer
} from "@babylonjs/core";
import type { GameConfig, GameState } from "../types";

export async function createScene3D(container: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  container.appendChild(canvas);

  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true });
  const scene = new Scene(engine);

  const cam = new ArcRotateCamera("cam", Math.PI/2, Math.PI/3, 80, Vector3.Zero(), scene);
  cam.attachControl(canvas, true);
  new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  new GlowLayer("glow", scene);

  // Plano “visual” (no afecta a tu física)
  const table = MeshBuilder.CreateGround("table", { width: 100, height: 60 }, scene);

  // Palas y bola
  const left  = MeshBuilder.CreateBox("left",  { width: 1.2, height: 2, depth: 10 }, scene);
  const right = MeshBuilder.CreateBox("right", { width: 1.2, height: 2, depth: 10 }, scene);
  left.position.x  = -48;
  right.position.x =  48;

  const ball = MeshBuilder.CreateSphere("ball", { diameter: 2 }, scene);
  ball.position.y = 1;

  // Fondo parecido al 2D
  scene.clearColor.set(0.03, 0.2, 0.27, 1);

  window.addEventListener("resize", () => engine.resize());
  engine.runRenderLoop(() => scene.render());

  return { engine, scene, meshes: { table, left, right, ball } };
}

/** Mapea tu estado 2D (en píxeles) a coordenadas 3D “visuales” */
export function updateMeshesFromState(
  meshes: { left:any; right:any; ball:any },
  state: GameState,
  c: GameConfig,
  canvas2D: HTMLCanvasElement
) {
  // 0..w → -50..50 ; 0..h → -30..30
  const toX = (x:number) => (x / canvas2D.width)  * 100 - 50;
  const toZ = (y:number) => (y / canvas2D.height) *  60 - 30;

  const leftX  = toX(20 + c.paddleWidth / 2);
  const rightX = toX(canvas2D.width - 20 - c.paddleWidth / 2);

  meshes.left.position.x  = leftX;
  meshes.right.position.x = rightX;

  meshes.left.position.z  = toZ(state.paddle1Y + c.paddleHeight / 2);
  meshes.right.position.z = toZ(state.paddle2Y + c.paddleHeight / 2);

  meshes.ball.position.x  = toX(state.ballX + c.ballSize / 2);
  meshes.ball.position.z  = toZ(state.ballY + c.ballSize / 2);
}
