export function showStartScreen(
	canvas: HTMLCanvasElement,
	onStart: () => void
  ) {
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
  
	ctx.fillStyle = "white";
	ctx.font = "40px Honk";
	ctx.textAlign = "center";
	ctx.fillText("Press any key to start", canvas.width / 2, canvas.height / 2);
  
	function handleStart() {
	  document.removeEventListener("keydown", handleStart);
	  document.removeEventListener("click", handleStart); // also allow mouse click
	  onStart();
	}
  
	document.addEventListener("keydown", handleStart);
	document.addEventListener("click", handleStart);
  }
  