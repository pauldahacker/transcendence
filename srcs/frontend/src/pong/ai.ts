import { GameState, GameConfig, KeyState } from "./types";

/*
How the AI works:

The subject requires the AI to:
- NOT use the A* algo (pathfinding algorithm that finds the shortest path to a destination),
- read the game data once per second,
- simulate keyboard input.

We use setInterval() to execute pieces of code repeatedly at a fixed time interval (in ms).
> One of them will look at the data every 1000 ms to determine where it should move (up or down).
	- if the ball is not moving towards the AI paddle, the targetY will be the center of the canvas height.
	- if the ball is moving towards the AI paddle, the targetY will be the destination of the ball judging by its speed and direction.
		we check how many frames it will take until collision on the x-axis, then we can determine the destination of the ball on y-axis
> One of them will simulate pressing the up or down keys every 16 ms (so that it is consistent with the 60fps game)
	- it will take targetY as its target.

This makes the AI a bit dumb (can only change its prediction once per second) but once a target is set,
it has a "reaction time" of 16 ms, almost exactly the same as the game FPS.
*/

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
		const paddleX = playerIndex === 0 ? 20 + config.paddleWidth : width - 20 - config.paddleWidth;
  
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
  
		if (targetY < paddleCenter - config.paddleSpeed) {
		  if (playerIndex === 0) keys["w"] = true;
		  else keys["ArrowUp"] = true;
		} else if (targetY > paddleCenter + config.paddleSpeed) {
		  if (playerIndex === 0) keys["s"] = true;
		  else keys["ArrowDown"] = true;
		}
	  }
	}, 16); // ~60fps (1000 ms / 16  ms)
  
	return {
	  stop: () => {
		if (predictionId) clearInterval(predictionId);
		if (movementId) clearInterval(movementId);
	  },
	};
  }
  