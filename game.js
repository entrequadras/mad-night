// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // Mantém pixels nítidos

// Sistema de assets
const assets = {
    sprites: {
        madmax: [],
        faquinha: [],
        faquinhaAlerta: []
    },
    audio: {
        inicio: null,
        fuga: null,
        creditos: null
    },
    loaded: false
};

// Carregar assets
async function loadAssets() {
    try {
        // Carregar sprites do MadMax
        for (let i = 0; i <= 15; i++) {
            const img = new Image();
            img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            assets.sprites.madmax[i] = img;
        }
        
        // Carregar sprites do Faquinha
        for (let i = 0; i <= 7; i++) {
            const img = new Image();
            img.src = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            assets.sprites.faquinha[i] = img;
        }
        
        // Sprites de alerta do Faquinha (008-011)
        for (let i = 8; i <= 11; i++) {
            const img = new Image();
            img.src = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            assets.sprites.faquinhaAlerta[i-8] = img;
        }
        
        // Carregar áudios
        assets.audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
        assets.audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
        assets.audio.creditos = new Audio('assets/audio/musica_etqgame_end_credits.mp3');
        
        // Configurar loops
        assets.audio.inicio.loop = true;
        assets.audio.fuga.loop = true;
        
        assets.loaded = true;
        console.log('Assets carregados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar assets:', error);
    }
}

// Estado do jogo
const gameState = {
    currentMap: 0,
    deaths: 0,
    dashUnlocked: false,
    pedalPower: 4,
    maxPedalPower: 4,
    pedalRechargeTime: 6000, // 6 segundos
    lastMoveTime: Date.now(),
    lastRechargeTime: Date.now(),
    phase: 'infiltration', // 'infiltration', 'escape'
    currentMusic: null
};

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3,
    dashSpeed: 8,
    isDashing: false,
    dashDuration: 300,
    dashStartTime: 0,
    direction: 'right', // up, down, left, right
    frame: 0,
    animationSpeed: 150, // ms entre frames
    lastFrameTime: 0,
    isDead: false,
    deathFrame: 0
};

// Sistema de input
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
        e.preventDefault();
    }
});

// Tocar música
function playMusic(musicName) {
    // Parar música atual
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    // Tocar nova música
    if (assets.audio[musicName]) {
        assets.audio[musicName].play();
        gameState.currentMusic = assets.audio[musicName];
    }
}

// Função de movimento do player
function updatePlayer(deltaTime) {
    if (player.isDead) return;
    
    let dx = 0;
    let dy = 0;
    let moving = false;
    
    // Movimento normal
    if (keys.ArrowUp) {
        dy = -1;
        player.direction = 'up';
        moving = true;
    }
    if (keys.ArrowDown) {
        dy = 1;
        player.direction = 'down';
        moving = true;
    }
    if (keys.ArrowLeft) {
        dx = -1;
        player.direction = 'left';
        moving = true;
    }
    if (keys.ArrowRight) {
        dx = 1;
        player.direction = 'right';
        moving = true;
    }
    
    // Normalizar movimento diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    // Dash
    if (keys.Space && gameState.dashUnlocked && gameState.pedalPower > 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashStartTime = Date.now();
        gameState.pedalPower--;
        updateUI();
    }
    
    // Aplicar velocidade
    const currentSpeed = player.isDashing ? player.dashSpeed : player.speed;
    player.x += dx * currentSpeed;
    player.y += dy * currentSpeed;
    
    // Limitar ao canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Atualizar dash
    if (player.isDashing && Date.now() - player.dashStartTime > player.dashDuration) {
        player.isDashing = false;
    }
    
    // Recarregar pedal power quando parado
    if (moving) {
        gameState.lastMoveTime = Date.now();
    } else {
        const timeSinceLastMove = Date.now() - gameState.lastMoveTime;
        const timeSinceLastRecharge = Date.now() - gameState.lastRechargeTime;
        
        if (timeSinceLastMove > 1000 && timeSinceLastRecharge > gameState.pedalRechargeTime) {
            if (gameState.pedalPower < gameState.maxPedalPower) {
                gameState.pedalPower++;
                gameState.lastRechargeTime = Date.now();
                updateUI();
            }
        }
    }
    
    // Animação
    if (moving && Date.now() - player.lastFrameTime > player.animationSpeed) {
        player.frame = (player.frame + 1) % 2;
        player.lastFrameTime = Date.now();
    }
}

// Função de morte
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.deathFrame = Math.floor(Math.random() * 4) + 12; // Frames 12-15
    gameState.deaths++;
    
    const deathMsg = document.getElementById('deathMessage');
    if (gameState.deaths < 5) {
        deathMsg.textContent = "ah véi, se liga carái";
    } else {
        deathMsg.textContent = "sifudêu";
    }
    deathMsg.style.display = 'block';
    
    updateUI();
    
    setTimeout(() => {
        deathMsg.style.display = 'none';
        if (gameState.deaths >= 5) {
            // Reiniciar jogo completo
            resetGame();
        } else {
            // Reiniciar mapa atual
            resetMap();
        }
    }, 2000);
}

// Reset do mapa
function resetMap() {
    player.x = 100;
    player.y = 300;
    player.isDead = false;
    player.isDashing = false;
    player.frame = 0;
    gameState.pedalPower = gameState.maxPedalPower;
    updateUI();
}

// Reset completo do jogo
function resetGame() {
    gameState.currentMap = 0;
    gameState.deaths = 0;
    gameState.dashUnlocked = false;
    gameState.phase = 'infiltration';
    resetMap();
    playMusic('inicio');
}

// Atualizar UI
function updateUI() {
    document.getElementById('deathCount').textContent = gameState.deaths;
    
    const powerBar = document.getElementById('pedalPower');
    let bar = '';
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        bar += i < gameState.pedalPower ? '█' : '░';
    }
    powerBar.textContent = bar;
}

// Obter sprite correto do player
function getPlayerSprite() {
    if (!assets.loaded) return null;
    
    if (player.isDead) {
        return assets.sprites.madmax[player.deathFrame];
    }
    
    // Mapeamento de direção para índice base
    const directionMap = {
        'right': 0,
        'down': 1,
        'left': 2,
        'up': 3
    };
    
    const baseIndex = directionMap[player.direction];
    
    if (player.isDashing) {
        // Sprites de ataque (8-11)
        return assets.sprites.madmax[8 + baseIndex];
    } else {
        // Sprites de movimento (0-3 ou 4-7 baseado no frame)
        const offset = player.frame * 4;
        return assets.sprites.madmax[baseIndex + offset];
    }
}

// Função de desenho
function draw() {
    // Limpar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar "mapa" temporário
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(50, 50, 700, 500);
    
    // Desenhar player
    if (assets.loaded) {
        const sprite = getPlayerSprite();
        if (sprite) {
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        }
    } else {
        // Placeholder enquanto carrega
        ctx.fillStyle = player.isDashing ? '#ff0' : '#f00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Texto do mapa atual
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Mapa: ' + (gameState.currentMap + 1), 350, 30);
    
    // Status de carregamento
    if (!assets.loaded) {
        ctx.fillStyle = '#ff0';
        ctx.font = '16px Arial';
        ctx.fillText('Carregando sprites...', 320, 300);
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    updatePlayer(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Teste de morte (pressione K para testar)
window.addEventListener('keydown', (e) => {
    if (e.key === 'k' || e.key === 'K') {
        killPlayer();
    }
});

// Iniciar jogo
async function init() {
    console.log('Mad Night - Iniciando...');
    
    updateUI();
    
    // Iniciar loop imediatamente (com placeholders)
    requestAnimationFrame(gameLoop);
    
    // Carregar assets em paralelo
    await loadAssets();
    
    // Tocar música inicial
    playMusic('inicio');
    
    console.log('Mad Night - Pronto!');
    console.log('Use as setas para mover');
    console.log('Pressione K para testar morte');
}

// Iniciar quando a página carregar
window.addEventListener('load', init);
