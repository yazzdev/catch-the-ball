const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

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
window.addEventListener('resize', () => {
  resizeCanvas();
  if (!gameOver && !isGameStarted) {
    drawStartScreen();
  }
});

let score = 0;
let level = 1;
let lives = 5;
let maxLives = 5;
let balls = [];
let paddle;
let gameOver = false;
let isGameStarted = false;
let spawnInterval = 2000;
let lastSpawnTime = Date.now();

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
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height / 2);
    ctx.quadraticCurveTo(
      this.x + this.width / 2,
      this.y - this.height,
      this.x + this.width,
      this.y + this.height / 2
    );
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
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
    const types = ['zonk', 'extraLife', 'numbered', 'negative'];
    let probabilities;
    if (level >= 2) {
      probabilities = [0.1, 0.1, 0.7, 0.1]; // Level 2 ke atas
    } else {
      probabilities = [0.1, 0.1, 0.8, 0]; // Level 1, tidak ada bola negatif
    }
    let random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < types.length; i++) {
      cumulative += probabilities[i];
      if (random < cumulative) {
        return types[i];
      }
    }
    return 'numbered';
  }

  setProperties() {
    this.y = -20;
    this.speed = Math.random() * 2 + 2 + level * 0.5;
    this.x = Math.random() * (canvas.width - 60) + 30;

    switch (this.type) {
      case 'zonk':
        this.text = 'ZONK';
        this.value = -1; // Mengurangi nyawa jika tertangkap
        this.radius = 35;
        this.color = '#000000'; // Ubah menjadi hitam
        break;
      case 'extraLife':
        this.text = '❤';
        this.value = 0; // Tidak mengubah skor
        this.radius = 30;
        this.color = '#ff9ff3';
        break;
      case 'numbered':
        this.value = Math.floor(Math.random() * 100) + 1;
        this.radius = 25 + (this.value / 5);
        this.color = this.getColorByValue(this.value);
        this.text = this.value.toString();
        break;
      case 'negative':
        this.value = -(Math.floor(Math.random() * 100) + 1); // -1 hingga -100
        this.radius = 25 + (Math.abs(this.value) / 5);
        this.color = this.getNegativeColorByValue(this.value);
        this.text = this.value.toString();
        break;
    }
  }

  getColorByValue(value) {
    // Gradasi dari kuning (60) ke hijau (120) berdasarkan nilai poin positif
    let startHue = 60; // Kuning
    let endHue = 120; // Hijau
    let hue = startHue + ((value - 1) / 99) * (endHue - startHue);
    return `hsl(${hue}, 80%, 50%)`;
  }

  getNegativeColorByValue(value) {
    // Gradasi dari merah (0) ke kuning (60) berdasarkan nilai poin negatif
    let startHue = 0;   // Merah
    let endHue = 60;    // Kuning
    let hue = startHue + ((Math.abs(value) - 1) / 99) * (endHue - startHue);
    return `hsl(${hue}, 80%, 50%)`;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Menambahkan teks pada bola
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold ' + (this.radius / 1.5) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(this.text, this.x, this.y);
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
  spawnInterval = 2000;
  lastSpawnTime = Date.now();
}

function spawnBall() {
  balls.push(new Ball());
}

function updateGame() {
  if (gameOver || !isGameStarted) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paddle.update();

  balls.forEach((ball, index) => {
    ball.update();

    // Deteksi tumbukan dengan paddle
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      switch (ball.type) {
        case 'zonk':
          // Jika bola zonk tertangkap, nyawa berkurang 1
          lives--;
          break;
        case 'extraLife':
          // Menambah nyawa hingga maksimum 5
          if (lives < maxLives) {
            lives++;
          }
          break;
        case 'numbered':
          // Menambah skor sesuai nilai bola
          score += ball.value;
          break;
        case 'negative':
          // Mengurangi skor sesuai nilai bola (nilai negatif)
          score += ball.value;
          // Cek apakah level turun
          let newLevel = Math.floor(score / 300) + 1;
          if (newLevel < level) {
            level = Math.max(1, newLevel);
          }
          break;
      }

      balls.splice(index, 1);

      // Cek apakah level naik
      if (score >= level * 300) {
        level++;
      }
    }

    // Bola jatuh melewati layar
    if (ball.y - ball.radius > canvas.height) {
      if (ball.type === 'numbered') {
        // Jika bola poin tidak ditangkap, nyawa berkurang 1
        lives--;
      }
      // Jika bola zonk, extraLife, atau negative tidak ditangkap, tidak terjadi apa-apa
      balls.splice(index, 1);
    }

    // Cek nyawa
    if (lives <= 0) {
      gameOver = true;
      showGameOverScreen();
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

// Tombol Start
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  canvas.style.display = 'block';
  isGameStarted = true;
  init();
  updateGame();
  spawningBalls();
});

// Spawning balls at intervals
function spawningBalls() {
  if (gameOver || !isGameStarted) return;

  if (Date.now() - lastSpawnTime > spawnInterval) {
    spawnBall();
    lastSpawnTime = Date.now();
    spawnInterval *= 0.98; // Meningkatkan kesulitan
    if (spawnInterval < 500) spawnInterval = 500; // Batas minimum interval
  }
  requestAnimationFrame(spawningBalls);
}

// Layar Game Over
function showGameOverScreen() {
  isGameStarted = false;
  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameOverScreen';
  gameOverScreen.innerHTML = `
        <h1>GAME OVER</h1>
        <p>End Score: ${score}</p>
        <button id="restartButton">Restart</button>
    `;
  document.body.appendChild(gameOverScreen);

  const restartButton = document.getElementById('restartButton');
  restartButton.addEventListener('click', () => {
    gameOverScreen.remove();
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    isGameStarted = true;
    init();
    updateGame();
    spawningBalls();
  });
}

// Gambar Layar Awal
function drawStartScreen() {
  // Ditangani oleh elemen HTML dan CSS
}

init();
