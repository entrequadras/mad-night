console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Estado do jogo
const gameState = {
    deaths: 0,
    pedalPower: 4,
    maxPedalPower: 4
};

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3,
    direction: 'right',
    frame: 0,
    sprites: [],
    isDead: false,
    deathFrame: 12
};

// Teclas
const keys = {};

// Carregar sprites do MadMax (0-15 agora)
let spritesLoaded = 0;
for (let i = 0; i <= 15; i++) {
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
    
    // Teste de morte com K
    if (e.key === 'k' || e.key === 'K') {
        killPlayer();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Matar player
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.deathFrame = Math.floor(Math.random() * 4) + 12; // 12-15
    gameState.deaths++;
    
    console.log(`Morreu! Total: ${gameState.deaths}/5`);
    
    // Resetar após 2 segundos
    setTimeout(() => {
        if (gameState.deaths >= 5) {
            // Reset total
            gameState.deaths = 0;
            console.log('Game Over! Resetando...');
        }
        resetPlayer();
    }, 2000);
}

// Resetar player
function resetPlayer() {
    player.x = 100;
    player.y = 300;
    player.isDead = false;
    player.frame = 0;
}

// Atualizar player
let lastFrameTime = 0;
function update() {
    if (player.isDead) return;
    
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
    if (player.isDead) {
        return player.sprites[player.deathFrame];
    }
    
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
    if (spritesLoaded >= 16) {
        const sprite = getPlayerSprite();
        if (sprite) {
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        }
    } else {
        // Placeholder
        ctx.fillStyle = player.isDead ? '#800' : '#f00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Use as setas para mover | K para testar morte', 10, 30);
    ctx.fillText(`Mortes: ${gameState.deaths}/5`, 10, 50);
    
    // Barra de pedal
    ctx.fillText('Força de Pedal: ', 10, 70);
    ctx.fillStyle = '#0f0';
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillText(i < gameState.pedalPower ? '█' : '░', 120 + i * 10, 70);
    }
    
    // Mensagem de morte
    if (player.isDead) {
        ctx.fillStyle = '#f00';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        const msg = gameState.deaths < 5 ? "ah véi, se liga carái" : "sifudêu";
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar
gameLoop();
console.log('Pressione K para testar morte!');
