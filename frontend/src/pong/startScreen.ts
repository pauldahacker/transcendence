// draws the start screen on the canvas and removes it when a user clicks inside the canvas
export function showStartScreen(
	canvas: HTMLCanvasElement,
	onStart: () => void,
	canStart?: () => boolean
  ) {
	const ctx = canvas.getContext("2d")!;
	const { width, height } = canvas;
  
	let animationFrame: number;
	let hue = 0;
	let pulse = 0;
	let partyMode = false;
  
	function animate() {
	  // Background
	  ctx.fillStyle = "rgba(8, 51, 68, 1)";
	  ctx.fillRect(0, 0, width, height);
  
	  // Pulse the text continuously
	  pulse += 0.03; // slower pulsing
	  const scale = 1 + Math.sin(pulse) * 0.05; // ±5%
	  ctx.save();
	  ctx.translate(width / 2, height / 2);
	  ctx.scale(scale, scale);
	  ctx.fillStyle = "white";
	  ctx.font = "40px Honk";
	  ctx.textAlign = "center";
	  ctx.textBaseline = "middle";
	  ctx.fillText("Click or Press Enter to Start", 0, 0);
	  ctx.restore();
  
	  // Border party effect only if cursor is inside
	  if (partyMode) {
		hue = (hue + 1) % 360;
		const borderColor = `hsl(${hue}, 100%, 60%)`;
		const glow = 10 + Math.sin(hue / 15) * 10;
		canvas.style.boxShadow = `0 0 ${glow}px 4px ${borderColor}`;
	  } else {
		canvas.style.boxShadow = "none";
	  }
  
	  animationFrame = requestAnimationFrame(animate);
	}
  
	animate(); // start animation immediately
  
	function handleMouseMove(event: MouseEvent) {
	  const rect = canvas.getBoundingClientRect();
	  const insideCanvas =
		event.clientX >= rect.left &&
		event.clientX <= rect.right &&
		event.clientY >= rect.top &&
		event.clientY <= rect.bottom;
  
	  partyMode = insideCanvas;
	  canvas.style.cursor = insideCanvas ? "pointer" : "default";
	}

	function handleStart()
	{
		if (!canStart || canStart()) {
			cleanup();
			onStart();
		  }
	}
  
	function handleClick(event: MouseEvent) {
	  const rect = canvas.getBoundingClientRect();
	  const insideCanvas =
		event.clientX >= rect.left &&
		event.clientX <= rect.right &&
		event.clientY >= rect.top &&
		event.clientY <= rect.bottom;
  
	  if (insideCanvas)
		handleStart();
	}

	function handleKey(event: KeyboardEvent) {
		if (event.key === "Enter") handleStart();
	}
  
	function cleanup() {
	  document.removeEventListener("mousemove", handleMouseMove);
	  document.removeEventListener("click", handleStart);
	  cancelAnimationFrame(animationFrame);
	  canvas.style.boxShadow = "none";
	}
  
	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("click", handleClick);
	document.addEventListener("keydown", handleKey);
  }
  