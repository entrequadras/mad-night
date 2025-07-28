console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player
const player = {
    x: 100,
    y: 300,
    width: 50,
    height: 50,
    speed: 3
};

// Teclas
const keys = {};

// Detectar teclas
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Atualizar player
function update() {
    // Movimento
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    
    // Limitar na tela
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Desenhar
function draw() {
    // Limpar tela
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar mapa
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(50, 50, 700, 500);
    
    // Desenhar player
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Texto
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Use as setas para mover', 10, 30);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar
gameLoop();
console.log('Jogo rodando! Use as setas para mover o quadrado vermelho.');
