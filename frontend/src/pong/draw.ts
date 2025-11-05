import { GameState, GameConfig } from "./types";

let cachedBg: { src: string; img: HTMLImageElement | null } = { src: "", img: null };

// draws the paddles, scores and ball on the canvas for a single frame
export function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  config: GameConfig,
  map?: string
) {
  const { paddleHeight, paddleWidth, ballSize } = config;
  const { paddle1Y, paddle2Y, ballX, ballY, score1, score2 } = state;

  //Cache background image
  if (map) {
    // cache the background image
    if (!(draw as any)._cachedImage || (draw as any)._cachedImage.src !== map) {
      const img = new Image();
      img.src = map;
      (draw as any)._cachedImage = img;
    }
  
    const img = (draw as any)._cachedImage as HTMLImageElement;
    if (img.complete) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      ctx.fillStyle = "rgba(8, 51, 68, 1)";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "rgba(8, 51, 68, 1)";
    ctx.fillRect(0, 0, width, height);
  }
  
  let paddleColor = "white";
  let ballColor = "white";

  if (map?.includes("moscow")) {
    paddleColor = "#ff66cc"; // pink
    ballColor = "#ff99cc";
  } else if (map?.includes("barcelona")) {
    paddleColor = "#ffd700"; // gold
    ballColor = "#ffd700";
  } else if (map?.includes("space")) {
    paddleColor = "#e5375d"; // pink
    ballColor = "#e5375d";
  }

  // Paddles
  ctx.fillStyle = paddleColor;
  ctx.fillRect(20, paddle1Y, paddleWidth, paddleHeight);
  ctx.fillStyle = paddleColor;
  ctx.fillRect(width - 20 - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

  // Ball
  ctx.fillStyle = state.ballFlash > 0 ? "lime" :  ballColor;
  ctx.fillRect(ballX, ballY, ballSize, ballSize);

  // Score
  ctx.font = "50px Honk";
  ctx.fillText(`${score1}`, width / 4, 50);
  ctx.fillText(`${score2}`, (width * 3) / 4, 50);
}
