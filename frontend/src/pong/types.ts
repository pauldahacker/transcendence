export interface GameState {
	paddle1Y: number;
	paddle2Y: number;
	ballX: number;
	ballY: number;
	ballSpeedX: number;
	ballSpeedY: number;
	score1: number;
	score2: number;
	gameRunning: boolean;
	animationId?: number;

	ballFlash: number; // number of frames for flashing perfect shot
}
  
export interface GameConfig {
	paddleHeight: number;
	paddleWidth: number;
	paddleSpeed: number;
	ballSize: number;
	minSpeed : number;
	maxSpeed : number;
	maxBounceAngle : number;
}

export interface GameOverState {
	winner: number;
	score1: number;
	score2: number;
	state: GameState;
}

export interface GameSettings {
    map: string;            // path to texture
    ballSpeed: number;      // multiplier (1x = normal)
    paddleSpeed: number;    // multiplier
}
  
export const defaultSettings: GameSettings = {
    map: "",
    ballSpeed: 1,
    paddleSpeed: 1,
};
  
export type KeyState = Record<string, boolean>;
  