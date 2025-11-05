// src/3d/renderStart3D.ts
import { startPong } from "@/pong/startPong";
import type { GameState, GameConfig, GameOverState, GameSettings } from "@/pong/types";
import { ScoreLights, buildborders, addSkyDome } from "@/3d/sceneUtils"
import {
	Engine,
	Scene,
	ArcRotateCamera,
	Vector3,
	HemisphericLight,
	MeshBuilder,
	Color3,
	StandardMaterial,
	DynamicTexture,
	AbstractMesh
  } from "babylonjs";



  
  type Start3DOptions = {
	aiPlayer1?: boolean;
	aiPlayer2?: boolean;
	settings?: GameSettings;
  };

  export function startPong3D(
	canvas3D: HTMLCanvasElement,
  	onGameEnd: (result: GameOverState) => void,
  	options: Start3DOptions = {},
	skipRef?: { current: boolean }
	): () => void {
		let engine: Engine | null = null;
  		try {
  		  engine = new Engine(canvas3D, true, { preserveDrawingBuffer: true, stencil: true });
  		} catch {
  		  return () => {};
  		}
  		if (!engine) return () => {};
	
  		const scene = new Scene(engine);
  		scene.clearColor = new Color3(0, 0, 0).toColor4(1);

		//camera
		let alpha = (3 * Math.PI) / 2;
		let beta = Math.PI / 4;
		let radius = 10;
		const target = new Vector3(0, 0, 0);
		if (options.aiPlayer1 && !options.aiPlayer2) {
			alpha = 0;
			beta = Math.PI / 2.7; 
		} else if (options.aiPlayer2 && !options.aiPlayer1) {
		  	alpha = Math.PI;
			beta = Math.PI / 2.7; 
		}
		const camera = new ArcRotateCamera("cam", alpha, beta, radius, target, scene);
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

		//Board
		const W = 10; // X
		const H = 6;  // Z
		const ground = MeshBuilder.CreateGround("ground", { width: W, height: H }, scene);
		const groundMat = new StandardMaterial("groundMat", scene);
		groundMat.diffuseColor = Color3.FromHexString("#164E63");
		ground.material = groundMat;

		//borders
		buildborders(scene, W, H);
		addSkyDome(scene, options.settings?.map);
		//paddle sizes
		const paddleXThickness = W / 40; // X
		const paddleDepth = H / 6;       // Z
		const paddleHeightY = 0.3;       // Y
		const ballSize3D = W / 40;

		//paddle 1
		const p1 = MeshBuilder.CreateBox(
			"p1",
			{ width: paddleXThickness, height: paddleHeightY, depth: paddleDepth },
			scene
		);
		const matP1 = new StandardMaterial("matP1", scene);
		matP1.diffuseColor = Color3.FromHexString("#FF4C98");
		p1.material = matP1;
		p1.position.y = paddleHeightY / 2;

		//paddle 2
		const p2 = MeshBuilder.CreateBox(
			"p2",
			{ width: paddleXThickness, height: paddleHeightY, depth: paddleDepth },
			scene
		);
		const matP2 = new StandardMaterial("matP2", scene);
		matP2.diffuseColor = Color3.FromHexString("#FF4C98");
		p2.material = matP2;
		p2.position.y = paddleHeightY / 2;

		//Ball
		const ball = MeshBuilder.CreateBox("ball", { size: ballSize3D }, scene);
		const matBall = new StandardMaterial("matBall", scene);
		matBall.diffuseColor = Color3.FromHexString("#FFFFFF");
		ball.material = matBall;
		ball.position.y = paddleHeightY / 2;

		// Power-up coin (flat disc always facing camera)
		const powerUp3D = MeshBuilder.CreateDisc("powerUp3D", { radius: ballSize3D, tessellation: 32 }, scene);
		// make it visually coin-shaped (not flattened)
		powerUp3D.scaling.y = 1.0;
		powerUp3D.rotation.x = Math.PI; // face camera correctly
		// small visible elevation above the playing surface
		const POWER_ELEVATION = paddleHeightY / 2 + 0.2;
		powerUp3D.position.y = POWER_ELEVATION; // slightly above the ground
				
		// Create a DynamicTexture to draw a "?" on it
		const dynTex = new DynamicTexture("powerText", { width: 256, height: 256 }, scene, true);
		const ctx = dynTex.getContext();

		ctx.clearRect(0, 0, 256, 256);
		ctx.fillStyle = "#FFD700";
		ctx.fillRect(0, 0, 256, 256); // base fill for emissive look
		ctx.fillStyle = "#000";
		ctx.font = "bold 200px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("?", 128, 160);
		dynTex.update();

		const matPower = new StandardMaterial("matPower", scene);
		matPower.diffuseTexture = dynTex;
		matPower.emissiveTexture = dynTex;
		matPower.disableLighting = true;
		matPower.backFaceCulling = false;
		powerUp3D.material = matPower;
		powerUp3D.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

		// don't overwrite the elevation later — keep it at POWER_ELEVATION
		powerUp3D.isVisible = false;

		const lightSize = 0.25;
		const marginX = 1;  // separa del borde X
		const elevY = 0;    // altura base de la luz inferior
		const rightX =  (W / 2) - marginX;
		const leftX  = -(W / 2) + marginX;
		const zFront = H/2 + lightSize/2;     // ponlo más cerca o más lejos si quieres
		
		//scoreboard1

		const leftScore = new ScoreLights(scene, {
			lightSize,
			position: new Vector3(leftX, elevY, zFront),
  		});

  		const rightScore = new ScoreLights(scene, {
			lightSize,
			position: new Vector3(rightX, elevY, zFront),
  		});

		//2d->3d params
		const BASE_WIDTH = 900;
  		const BASE_HEIGHT = 600;
  		const sx = W / BASE_WIDTH;
  		const sz = H / BASE_HEIGHT;
  		const wallMargin2D = 20;
  		const p1X = -W / 2 + wallMargin2D * sx + paddleXThickness / 2;
  		const p2X =  W / 2 - wallMargin2D * sx - paddleXThickness / 2;
  		p1.position.x = p1X;
  		p2.position.x = p2X;
  		const mapXCenter = (xCenter2D: number) => (xCenter2D - BASE_WIDTH / 2) * sx;
  		const mapZCenter = (yCenter2D: number) => (BASE_HEIGHT / 2 - yCenter2D) * sz;

		//Hidden 2d engine
		const hidden2D = document.createElement("canvas");
  		hidden2D.width = BASE_WIDTH;
  		hidden2D.height = BASE_HEIGHT;
  		hidden2D.style.display = "none";
  		canvas3D.parentElement?.appendChild(hidden2D);

		const overlayParent = canvas3D.parentElement;
        const overlay = document.createElement("div");
        overlay.className =
          "absolute inset-0 flex items-center justify-center pointer-events-none";
        const overlayText = document.createElement("span");
        overlayText.className = "font-honk text-white text-4xl drop-shadow-lg";
        overlayText.textContent = "Press Enter to Start";
        overlay.appendChild(overlayText)
        const removeOverlay = () => {
          window.removeEventListener("keydown", handleEnterToStart);
          overlay.remove();
        }
        const handleEnterToStart = (event: KeyboardEvent) => {
          if (event.key === "Enter") {
            removeOverlay();
          }
        }
        if (overlayParent) {
          overlayParent.appendChild(overlay);
          window.addEventListener("keydown", handleEnterToStart);
        }

		const stopPong2D = startPong(
		hidden2D,
		(result: GameOverState) => {
		  onGameEnd(result);
		},
		{
			skip2DDraw: true, //not draw in 2d
		  	render3D: (state: GameState, config: GameConfig) => {
				// centros en 2D
				const p1CenterY = state.paddle1Y + config.paddleHeight / 2;
				const p2CenterY = state.paddle2Y + config.paddleHeight / 2;
				const ballCenterX = state.ballX + config.ballSize / 2;
				const ballCenterY = state.ballY + config.ballSize / 2;
			
				// posición en 3D
				p1.position.x = p1X;
				p1.position.z = mapZCenter(p1CenterY);
				p2.position.x = p2X;
				p2.position.z = mapZCenter(p2CenterY);
				ball.position.x = mapXCenter(ballCenterX);
				ball.position.z = mapZCenter(ballCenterY);

				// Power-up
				if (state.powerUpActive && state.powerUpX !== undefined && state.powerUpY !== undefined) {
					// Map 2D coordinates to 3D (center)
					const powerX3D = mapXCenter(state.powerUpX);
					const powerZ3D = mapZCenter(state.powerUpY);
  
					powerUp3D.position.x = powerX3D;
					powerUp3D.position.z = powerZ3D;
					powerUp3D.isVisible = true;
  
					// Match its visual size with 2D radius
					const powerRadius2D = config.ballSize * 1.0;
					const scaleFactor = (powerRadius2D / (config.ballSize / 2)) * 1.0;
					powerUp3D.scaling.setAll(scaleFactor);
					// ensure Y stays at elevation
					powerUp3D.position.y = POWER_ELEVATION;
				} else {
					powerUp3D.isVisible = false;
				}
			
				// flash bola
				(ball.material as StandardMaterial).diffuseColor =
				  state.ballFlash > 0 ? Color3.FromHexString("#2CFF1F") : Color3.FromHexString("#FFFFFF");
				leftScore.update(state.score1);
				rightScore.update(state.score2);
			},
			aiPlayer1: options.aiPlayer1 ?? false,
    		aiPlayer2: options.aiPlayer2 ?? false,
			onStart: removeOverlay,
			settings: options?.settings,
		},
		skipRef//skipvalue
		);

		let running = true;
		engine.runRenderLoop(() => {
		  if (!running) return;
		  scene.render();
		});
		const onResize = () => engine!.resize();
		window.addEventListener("resize", onResize);
	  

		const stop = () => {
		  running = false;
		  window.removeEventListener("resize", onResize);
		  try { stopPong2D(); } catch {}
		  try { scene.dispose(); } catch {}
		  try { engine!.dispose(); } catch {}
		  try { hidden2D.remove(); } catch {}
		  if (overlayParent?.contains(overlay)) {removeOverlay();}
		  engine = null;
		};
	  
	return stop;
}
