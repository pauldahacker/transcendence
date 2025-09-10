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
  }
  
  export interface GameConfig {
	paddleHeight: number;
	paddleWidth: number;
	ballSize: number;
  }
  
  export type KeyState = Record<string, boolean>;
  