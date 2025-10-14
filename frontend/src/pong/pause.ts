// draw the pause screen inside the canvas
export function showPauseScreen(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext("2d")!;
	
	// Draw semi-transparent overlay
	ctx.fillStyle = "rgba(50, 50, 50, 0.7)"; // greyed-out background
	ctx.fillRect(0, 0, canvas.width, canvas.height);
  
	// Draw pause text
	ctx.fillStyle = "white";
	ctx.font = "60px Honk";
	ctx.textAlign = "center";
	ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
	ctx.font = "30px Honk";
	ctx.fillText("Press Space to Resume", canvas.width / 2, canvas.height / 2 + 50);
  }