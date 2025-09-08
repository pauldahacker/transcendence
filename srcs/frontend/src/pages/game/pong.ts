export function startPong(canvas: HTMLCanvasElement, onGameOver: (winner: number) => void) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const paddleHeight = canvas.height / 5;
  const paddleWidth = canvas.width / 50;
  const ballSize = canvas.width / 50;

  let paddle1Y = canvas.height / 2 - paddleHeight / 2;
  let paddle2Y = canvas.height / 2 - paddleHeight / 2;
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballSpeedX = Math.random() > 0.5 ? 4 : -4;
  let ballSpeedY = 0;

  let score1 = 0;
  let score2 = 0;
  let gameRunning = true;
  let animationId: number;

  // Track which keys are pressed
  const keys: Record<string, boolean> = {};

  function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(20, paddle1Y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 20 - paddleWidth, paddle2Y, paddleWidth, paddleHeight);
    ctx.fillRect(ballX, ballY, ballSize, ballSize);

    ctx.font = "50px Honk";
    ctx.fillText(`${score1}`, canvas.width / 4, 30);
    ctx.fillText(`${score2}`, (canvas.width * 3) / 4, 30);
  }

  function update() {
    const paddleSpeed = 8;

    if (keys["w"]) paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
    if (keys["s"]) paddle1Y = Math.min(canvas.height - paddleHeight, paddle1Y + paddleSpeed);
    if (keys["ArrowUp"]) paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
    if (keys["ArrowDown"]) paddle2Y = Math.min(canvas.height - paddleHeight, paddle2Y + paddleSpeed);

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= 0) {
      ballY = 0;
      ballSpeedY *= -1;
    }
    if (ballY + ballSize >= canvas.height) {
      ballY = canvas.height - ballSize;
      ballSpeedY *= -1;
    }
    const minSpeedX = 6;
    const baseSpeed = 8;
    const maxSpeedX = 14;
    const maxBounceAngle = Math.PI / 4; // 45 degrees
    
    // Right paddle
    if (
      ballX + ballSize >= canvas.width - 20 - paddleWidth &&
      ballY + ballSize >= paddle2Y &&
      ballY <= paddle2Y + paddleHeight
    ) {
      ballX = canvas.width - 20 - paddleWidth - ballSize;
    
      const relativeIntersectY = (ballY + ballSize / 2) - (paddle2Y + paddleHeight / 2);
      const normalized = relativeIntersectY / (paddleHeight / 2);
      const bounceAngle = normalized * maxBounceAngle;

      const speedRatio = 1 - Math.abs(normalized);
    
      ballSpeedX = -1 * Math.max(maxSpeedX * speedRatio, minSpeedX);
      ballSpeedY = baseSpeed * Math.sin(bounceAngle);
    }
    
    // Left paddle
    if (
      ballX <= 20 + paddleWidth &&
      ballY + ballSize >= paddle1Y &&
      ballY <= paddle1Y + paddleHeight
    ) {
      ballX = 20 + paddleWidth;
    
      const relativeIntersectY = (ballY + ballSize / 2) - (paddle1Y + paddleHeight / 2);
      const normalized = relativeIntersectY / (paddleHeight / 2);
      const bounceAngle = normalized * maxBounceAngle;
      
      const speedRatio = 1 - Math.abs(normalized);
      ballSpeedX = Math.max(maxSpeedX * speedRatio, minSpeedX);
      ballSpeedY = baseSpeed * Math.sin(bounceAngle);
    }

    if (ballX < 0) {
      score2++;
      resetBall();
    } else if (ballX > canvas.width) {
      score1++;
      resetBall();
    }

    if (score1 === 3) {
      gameRunning = false;
      onGameOver(1);
    }
    if (score2 === 3) {
      gameRunning = false;
      onGameOver(2);
    }
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = Math.random() > 0.5 ? 4 : -4;
    ballSpeedY = 0;
  }

  function loop() {
    if (!gameRunning) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // Handle key state instead of instant moves
  function handleKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  loop();

  return () => {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}
