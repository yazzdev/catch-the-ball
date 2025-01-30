const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mengatur ukuran canvas dengan rasio 4:3
function resizeCanvas() {
  let width = window.innerWidth;
  let height = window.innerHeight;

  if (width / height > 4 / 3) {
    width = height * (4 / 3);
  } else {
    height = width * (3 / 4);
  }

  canvas.width = width;
  canvas.height = height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let score = 0;
let level = 1;
let lives = 5;
let balls = [];
let paddle;
let gameOver = false;

class Paddle {
  constructor() {
    this.width = canvas.width / 6;
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
    this.type = this.randomType();
    this.setProperties();
  }

  randomType() {
    const types = ['normal', 'zonk', 'extraLife', 'numbered'];
    const probabilities = [0.6, 0.1, 0.1, 0.2]; // Probabilitas kemunculan
    let random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < types.length; i++) {
      cumulative += probabilities[i];
      if (random < cumulative) {
        return types[i];
      }
    }
    return 'normal';
  }

  setProperties() {
    this.y = -20;
    this.speed = Math.random() * 2 + 2 + level * 0.5;
    this.x = Math.random() * (canvas.width - 40) + 20;

    switch (this.type) {
      case 'zonk':
        this.radius = 20;
        this.color = '#e74c3c';
        break;
      case 'extraLife':
        this.radius = 20;
        this.color = '#ff9ff3';
        break;
      case 'numbered':
        this.value = Math.floor(Math.random() * 100) + 1;
        this.radius = 15 + (this.value / 10);
        this.color = this.getColorByValue(this.value);
        break;
      default:
        this.radius = 15;
        this.color = '#f1c40f';
        break;
    }
  }

  getColorByValue(value) {
    // Gradasi dari kuning ke hijau
    let r = Math.floor(241 - (value * 1.4));
    let g = Math.floor(196 + (value * 0.59));
    let b = 15;
    return `rgb(${r}, ${g}, ${b})`;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Menambahkan teks pada bola
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold ' + (this.radius) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.type === 'zonk') {
      ctx.fillText('ZONK', this.x, this.y);
    } else if (this.type === 'extraLife') {
      ctx.fillText('❤', this.x, this.y);
    } else if (this.type === 'numbered') {
      ctx.fillText(this.value, this.x, this.y);
    }
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
  lives = 5;
  gameOver = false;
}

function spawnBall() {
  balls.push(new Ball());
}

function updateGame() {
  if (gameOver) {
    displayGameOver();
    return;
  }

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
      switch (ball.type) {
        case 'zonk':
          lives--;
          break;
        case 'extraLife':
          lives++;
          break;
        case 'numbered':
          score += ball.value;
          break;
        default:
          score++;
          break;
      }

      balls.splice(index, 1);

      if (score >= level * 50) {
        level++;
      }
    }

    // Bola jatuh melewati layar
    if (ball.y - ball.radius > canvas.height) {
      if (ball.type !== 'zonk' && ball.type !== 'extraLife') {
        lives--;
      }
      balls.splice(index, 1);
    }

    // Cek nyawa
    if (lives <= 0) {
      gameOver = true;
    }
  });

  drawHUD();

  requestAnimationFrame(updateGame);
}

function drawHUD() {
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Skor: ' + score, 20, 30);
  ctx.fillText('Level: ' + level, 20, 60);
  ctx.fillText('Nyawa: ' + lives, 20, 90);
}

function displayGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ecf0f1';
  ctx.font = '50px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = '30px Arial';
  ctx.fillText('Skor Akhir: ' + score, canvas.width / 2, canvas.height / 2);

  ctx.font = '20px Arial';
  ctx.fillText('Tekan "Space" untuk bermain lagi', canvas.width / 2, canvas.height / 2 + 50);
}

// Kontrol paddle
function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    paddle.dx = paddle.speed;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    paddle.dx = -paddle.speed;
  } else if (e.key === ' ' && gameOver) {
    init();
    updateGame();
    spawningBalls();
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
  if (gameOver) return;

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
