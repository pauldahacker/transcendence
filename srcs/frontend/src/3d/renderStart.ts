// src/3d/renderStart3D.ts
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

  
  export function renderStart3D(canvas: HTMLCanvasElement, engine: Engine) {
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
  }
  