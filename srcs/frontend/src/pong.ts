export function startPong(onGameOver: (winner: number) => void) {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const paddleHeight = canvas.height / 5;
  const paddleWidth = canvas.width / 100;
  const ballSize = canvas.width / 100;

  let paddle1Y = canvas.height / 2 - paddleHeight / 2;
  let paddle2Y = canvas.height / 2 - paddleHeight / 2;

  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballSpeedX = Math.random() > 0.5 ? 4 : -4;
  let ballSpeedY = Math.random() > 0.5 ? 4 : -4;

  let score1 = 0;
  let score2 = 0;
  let gameRunning = true;
  let animationId: number | null = null;

  function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(20, paddle1Y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 20 - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

    ctx.fillRect(ballX, ballY, ballSize, ballSize);

    ctx.font = '20px Arial';
    ctx.fillText(`${score1}`, canvas.width / 4, 30);
    ctx.fillText(`${score2}`, (canvas.width * 3) / 4, 30);
  }

  function update() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;

    if (
      ballX <= 30 &&
      ballY + ballSize >= paddle1Y &&
      ballY <= paddle1Y + paddleHeight
    ) {
      ballSpeedX *= -1;
    }
    if (
      ballX + ballSize >= canvas.width - 30 &&
      ballY + ballSize >= paddle2Y &&
      ballY <= paddle2Y + paddleHeight
    ) {
      ballSpeedX *= -1;
    }

    if (ballX < 0) {
      score2++;
      resetBall();
    } else if (ballX > canvas.width) {
      score1++;
      resetBall();
    }

    if (score1 === 5) {
      gameRunning = false;
      onGameOver(1);
    }
    if (score2 === 5) {
      gameRunning = false;
      onGameOver(2);
    }
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = Math.random() > 0.5 ? 4 : -4;
    ballSpeedY = Math.random() > 0.5 ? 4 : -4;
  }

  function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
  }

  // paddle controls
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'w') paddle1Y = Math.max(0, paddle1Y - 20);
    if (e.key === 's') paddle1Y = Math.min(canvas.height - paddleHeight, paddle1Y + 20);
    if (e.key === 'ArrowUp') paddle2Y = Math.max(0, paddle2Y - 20);
    if (e.key === 'ArrowDown') paddle2Y = Math.min(canvas.height - paddleHeight, paddle2Y + 20);
  }

  document.addEventListener('keydown', handleKeyDown);
  gameLoop();

  // cleanup function
  return () => {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    document.removeEventListener('keydown', handleKeyDown);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // optional, reset canvas
  };
}
