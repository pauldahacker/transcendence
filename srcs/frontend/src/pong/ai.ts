import { GameState, GameConfig, KeyState } from "./types";

export interface AIController {
  stop: () => void;
}

export function startSimpleAI(
	playerIndex: 0 | 1,
	config: GameConfig,
	state: GameState,
	width: number,
	height: number,
	keys: KeyState
  ): AIController {
	let predictionId: number | null = null;
	let movementId: number | null = null;
	let targetY: number | null = null;
  
	// Every 1000ms, get the ball speed/direction info to predict where to move
	predictionId = window.setInterval(() => {
	  if (!state.gameRunning) return;
  
	  const ballGoingRight = state.ballSpeedX > 0;
  
	  if ((playerIndex === 0 && !ballGoingRight) || (playerIndex === 1 && ballGoingRight)) {
		const paddleX =
		  playerIndex === 0
			? 20 + config.paddleWidth
			: width - 20 - config.paddleWidth;
  
		const framesUntilImpact = Math.abs(
		  (paddleX - state.ballX) / state.ballSpeedX
		);
		targetY = state.ballY + state.ballSpeedY * framesUntilImpact;
	  } else {
		targetY = height / 2 ;
	  }
	}, 1000);
  
	// every 16 ms, move closer to the predicted location
	movementId = window.setInterval(() => {
	  if (!state.gameRunning) return;
  
	  // Reset keys
	  if (playerIndex === 0) {
		keys["w"] = false;
		keys["s"] = false;
	  } else {
		keys["ArrowUp"] = false;
		keys["ArrowDown"] = false;
	  }
  
	  if (targetY !== null) {
		const paddleCenter =
		  playerIndex === 0
			? state.paddle1Y + config.paddleHeight / 2
			: state.paddle2Y + config.paddleHeight / 2;
  
		if (targetY < paddleCenter - 10) {
		  if (playerIndex === 0) keys["w"] = true;
		  else keys["ArrowUp"] = true;
		} else if (targetY > paddleCenter + 10) {
		  if (playerIndex === 0) keys["s"] = true;
		  else keys["ArrowDown"] = true;
		}
	  }
	}, 16); // ~60fps
  
	return {
	  stop: () => {
		if (predictionId) clearInterval(predictionId);
		if (movementId) clearInterval(movementId);
	  },
	};
  }
  