const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let level = 1;
let balls = [];
let paddle;

class Paddle {
  constructor() {
    this.width = 120;
    this.height = 20;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 30;
    this.speed = 7;
    this.dx = 0;
  }

  draw() {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.x += this.dx;

    // Batas layar
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    this.draw();
  }
}

class Ball {
  constructor() {
    this.radius = 15;
    this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
    this.y = -this.radius;
    this.speed = Math.random() * 2 + 2 + level * 0.5;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.y += this.speed;
    this.draw();
  }
}

function init() {
  paddle = new Paddle();
  balls = [];
  score = 0;
  level = 1;
}

function spawnBall() {
  balls.push(new Ball());
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paddle.update();

  balls.forEach((ball, index) => {
    ball.update();

    // Deteksi tumbukan dengan paddle
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      balls.splice(index, 1);
      score++;
      if (score % 5 === 0) {
        level++;
      }
    }

    // Bola jatuh melewati layar
    if (ball.y - ball.radius > canvas.height) {
      balls.splice(index, 1);
      // Kamu bisa menambahkan mekanisme nyawa atau game over di sini
    }
  });

  drawScore();

  requestAnimationFrame(updateGame);
}

function drawScore() {
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '20px Arial';
  ctx.fillText('Skor: ' + score, 20, 30);
  ctx.fillText('Level: ' + level, 20, 60);
}

// Kontrol paddle
function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    paddle.dx = paddle.speed;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    paddle.dx = -paddle.speed;
  }
}

function keyUpHandler(e) {
  if (
    e.key === 'Right' ||
    e.key === 'ArrowRight' ||
    e.key === 'Left' ||
    e.key === 'ArrowLeft'
  ) {
    paddle.dx = 0;
  }
}

document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// Spawning balls at intervals
let spawnInterval = 2000;
let lastSpawnTime = Date.now();

function spawningBalls() {
  if (Date.now() - lastSpawnTime > spawnInterval) {
    spawnBall();
    lastSpawnTime = Date.now();
    spawnInterval *= 0.98; // Meningkatkan kesulitan
  }
  requestAnimationFrame(spawningBalls);
}

init();
updateGame();
spawningBalls();
