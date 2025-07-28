console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // Pixels nítidos

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3,
    direction: 'right',
    frame: 0,
    sprites: []
};

// Teclas
const keys = {};

// Carregar sprites do MadMax
let spritesLoaded = 0;
for (let i = 0; i <= 7; i++) {
    const img = new Image();
    img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
    img.onload = () => {
        spritesLoaded++;
        console.log(`Sprite ${i} carregado`);
    };
    player.sprites[i] = img;
}

// Detectar teclas
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Atualizar player
let lastFrameTime = 0;
function update() {
    let moving = false;
    
    // Movimento
    if (keys['ArrowUp']) {
        player.y -= player.speed;
        player.direction = 'up';
        moving = true;
    }
    if (keys['ArrowDown']) {
        player.y += player.speed;
        player.direction = 'down';
        moving = true;
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.direction = 'left';
        moving = true;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.direction = 'right';
        moving = true;
    }
    
    // Limitar na tela
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Animação
    if (moving && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}

// Pegar sprite correto
function getPlayerSprite() {
    const directionMap = {
        'right': 0,
        'down': 1,
        'left': 2,
        'up': 3
    };
    
    const baseIndex = directionMap[player.direction];
    const offset = player.frame * 4;
    
    return player.sprites[baseIndex + offset];
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
    if (spritesLoaded >= 8) {
        const sprite = getPlayerSprite();
        if (sprite) {
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        }
    } else {
        // Placeholder enquanto carrega
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Texto
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Use as setas para mover', 10, 30);
    ctx.fillText(`Sprites carregados: ${spritesLoaded}/8`, 10, 50);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar
gameLoop();
console.log('Carregando sprites do MadMax...');
