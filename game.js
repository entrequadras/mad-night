console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Estado do jogo
const gameState = {
    deaths: 0,
    pedalPower: 4,
    maxPedalPower: 4,
    lastRecharge: Date.now(),
    musicPhase: 'inicio',
    currentMusic: null,
    currentMap: 0,
    phase: 'infiltration'
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
    deathFrame: 12,
    isDashing: false,
    dashStart: 0,
    dashDuration: 150,
    dashDistance: 60,
    dashStartX: 0,
    dashStartY: 0,
    lastMove: Date.now(),
    inShadow: false
};

// Sistema de Mapas
const maps = [
    {
        name: "Maconhão",
        width: 800,
        height: 600,
        enemies: [],
        walls: [
            {x: 0, y: 0, w: 800, h: 50},
            {x: 0, y: 550, w: 800, h: 50},
            {x: 0, y: 0, w: 50, h: 600},
            {x: 750, y: 0, w: 50, h: 600},
        ],
        lights: [
            {x: 200, y: 200, radius: 120},
            {x: 600, y: 400, radius: 120}
        ],
        shadows: [
            {x: 300, y: 250, radius: 80},
            {x: 500, y: 150, radius: 100}
        ],
        playerStart: {x: 100, y: 300},
        exit: {x: 700, y: 250, w: 50, h: 100}
    },
    {
        name: "Eixão da Morte",
        width: 800,
        height: 600,
        enemies: [],
        walls: [
            {x: 0, y: 0, w: 800, h: 150},
            {x: 0, y: 450, w: 800, h: 150},
            {x: 0, y: 0, w: 50, h: 600},
            {x: 750, y: 0, w: 50, h: 600},
            {x: 200, y: 150, w: 50, h: 300},
            {x: 400, y: 150, w: 50, h: 300},
            {x: 600, y: 150, w: 50, h: 300},
        ],
        lights: [
            {x: 100, y: 300, radius: 100},
            {x: 325, y: 300, radius: 100},
            {x: 525, y: 300, radius: 100},
            {x: 700, y: 300, radius: 100}
        ],
        shadows: [], // Túnel escuro
        playerStart: {x: 100, y: 300},
        exit: {x: 700, y: 250, w: 50, h: 100}
    },
    {
        name: "Fronteira com o Komando Satânico",
        width: 800,
        height: 600,
        enemies: [{x: 400, y: 300, type: 'faquinha'}],
        walls: [
            {x: 0, y: 0, w: 800, h: 50},
            {x: 0, y: 550, w: 800, h: 50},
            {x: 0, y: 0, w: 50, h: 600},
            {x: 750, y: 0, w: 50, h: 600},
            {x: 150, y: 100, w: 100, h: 150},
            {x: 350, y: 400, w: 100, h: 100},
            {x: 550, y: 150, w: 100, h: 100},
        ],
        lights: [
            {x: 100, y: 100, radius: 120},
            {x: 400, y: 200, radius: 150},
            {x: 700, y: 500, radius: 120}
        ],
        shadows: [
            {x: 200, y: 175, radius: 100}, // Sombra do prédio
            {x: 400, y: 450, radius: 80},   // Sombra do prédio
            {x: 600, y: 200, radius: 80}    // Sombra do prédio
        ],
        playerStart: {x: 100, y: 300},
        exit: {x: 700, y: 250, w: 50, h: 100},
        special: 'orelhao'
    }
];

// Inimigos
const enemies = [];

// Áudios
const audio = {
    inicio: null,
    fuga: null,
    creditos: null
};

// Carregar áudios
function loadAudio() {
    audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
    audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
    audio.creditos = new Audio('assets/audio/musica_etqgame_end_credits.mp3');
    
    audio.inicio.loop = true;
    audio.fuga.loop = true;
    
    console.log('Áudios carregados!');
}

// Tocar música
function playMusic(phase) {
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    if (phase === 'inicio' && audio.inicio) {
        audio.inicio.play().catch(e => {
            console.log('Clique na tela para ativar áudio');
        });
        gameState.currentMusic = audio.inicio;
        gameState.musicPhase = 'inicio';
    } else if (phase === 'fuga' && audio.fuga) {
        audio.fuga.play().catch(e => {
            console.log('Clique na tela para ativar áudio');
        });
        gameState.currentMusic = audio.fuga;
        gameState.musicPhase = 'fuga';
    }
}

// Checar se ponto está na luz
function isInLight(x, y) {
    const map = maps[gameState.currentMap];
    
    for (let light of map.lights) {
        const dx = x - light.x;
        const dy = y - light.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < light.radius) {
            return true;
        }
    }
    return false;
}

// Checar se ponto está na sombra
function isInShadow(x, y) {
    const map = maps[gameState.currentMap];
    
    for (let shadow of map.shadows) {
        const dx = x - shadow.x;
        const dy = y - shadow.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < shadow.radius) {
            return true;
        }
    }
    return false;
}

// Classe Inimigo
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 56;
        this.height = 56;
        this.speed = 2;
        this.direction = 'down';
        this.frame = 0;
        this.state = 'patrol';
        this.isDead = false;
        this.deathFrame = 12;
        this.sprites = [];
        this.visionRange = 150;
        this.alertVisionRange = 200; // Visão maior quando alerta
    }
    
    update() {
        if (this.isDead) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Ajustar visão baseado no estado
        const currentVisionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
        
        // Se player está na sombra, visão reduzida
        let effectiveVisionRange = currentVisionRange;
        if (player.inShadow) {
            effectiveVisionRange *= 0.3; // 30% da visão na sombra
        }
        
        if (dist < effectiveVisionRange && !player.isDead) {
            this.state = 'chase';
            this.x += (dx/dist) * this.speed;
            this.y += (dy/dist) * this.speed;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            if (dist < 30) {
                killPlayer();
            }
        } else {
            // Perder o player se ele entrar na sombra
            if (this.state === 'chase') {
                console.log('Perdeu o player!');
            }
            this.state = 'patrol';
        }
        
        if (player.isDashing && dist < 40) {
            this.die();
        }
        
        if (Date.now() % 400 < 200) {
            this.frame = 0;
        } else {
            this.frame = 1;
        }
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathFrame = Math.floor(Math.random() * 4) + 12;
        console.log('Inimigo morto!');
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        
        const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        const offset = this.state === 'chase' ? 8 : this.frame * 4;
        
        return this.sprites[base + offset];
    }
}

// Teclas
const keys = {};

// Carregar sprites
let madmaxLoaded = 0;
let faquinhaLoaded = 0;

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
    img.onload = () => madmaxLoaded++;
    player.sprites[i] = img;
}

const faquinhaSprites = [];
for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
    img.onload = () => faquinhaLoaded++;
    faquinhaSprites[i] = img;
}

// Carregar mapa
function loadMap(mapIndex) {
    const map = maps[mapIndex];
    if (!map) return;
    
    enemies.length = 0;
    
    player.x = map.playerStart.x;
    player.y = map.playerStart.y;
    player.isDead = false;
    player.isDashing = false;
    
    map.enemies.forEach(enemyData => {
        const enemy = new Enemy(enemyData.x, enemyData.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
    });
    
    console.log(`Mapa carregado: ${map.name}`);
    
    if (map.special === 'orelhao' && gameState.phase === 'infiltration') {
        setTimeout(() => {
            console.log('CUTSCENE: Orelhão - Dash desbloqueado!');
            gameState.dashUnlocked = true;
        }, 2000);
    }
}

// Checar colisão com retângulo
function checkRectCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.w &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.h &&
           obj1.y + obj1.height > obj2.y;
}

// Detectar teclas
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'k' || e.key === 'K') killPlayer();
    
    if (e.key === 'e' || e.key === 'E') {
        const enemy = new Enemy(player.x + 150, player.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
    }
    
    if (e.key === 'm' || e.key === 'M') {
        if (gameState.musicPhase === 'inicio') {
            playMusic('fuga');
            console.log('Música de fuga!');
        } else {
            playMusic('inicio');
            console.log('Música inicial!');
        }
    }
    
    if (e.key === 'n' || e.key === 'N') {
        gameState.currentMap = (gameState.currentMap + 1) % maps.length;
        loadMap(gameState.currentMap);
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('click', () => {
    if (gameState.currentMusic && gameState.currentMusic.paused) {
        gameState.currentMusic.play();
        console.log('Áudio ativado!');
    }
});

// Matar player
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.isDashing = false;
    player.deathFrame = Math.floor(Math.random() * 4) + 12;
    gameState.deaths++;
    
    setTimeout(() => {
        if (gameState.deaths >= 5) {
            gameState.deaths = 0;
            gameState.currentMap = 0;
            loadMap(0);
            playMusic('inicio');
        } else {
            loadMap(gameState.currentMap);
        }
    }, 2000);
}

// Atualizar
let lastFrameTime = 0;
function update() {
    const currentMapData = maps[gameState.currentMap];
    
    enemies.forEach(enemy => enemy.update());
    
    enemies.forEach((enemy, index) => {
        if (enemy.isDead && !enemy.removeTime) {
            enemy.removeTime = Date.now() + 3000;
        }
        if (enemy.removeTime && Date.now() > enemy.removeTime) {
            enemies.splice(index, 1);
        }
    });
    
    if (player.isDead) return;
    
    // Checar se player está na sombra
    const playerCenterX = player.x + player.width/2;
    const playerCenterY = player.y + player.height/2;
    player.inShadow = isInShadow(playerCenterX, playerCenterY);
    
    let moving = false;
    let dx = 0;
    let dy = 0;
    
    if (player.isDashing) {
        const progress = (Date.now() - player.dashStart) / player.dashDuration;
        
        if (progress >= 1) {
            player.isDashing = false;
        } else {
            const dashSpeed = player.dashDistance / player.dashDuration * 16;
            switch(player.direction) {
                case 'up': player.y -= dashSpeed; break;
                case 'down': player.y += dashSpeed; break;
                case 'left': player.x -= dashSpeed; break;
                case 'right': player.x += dashSpeed; break;
            }
        }
    } else {
        if (keys['ArrowUp']) {
            dy = -1;
            player.direction = 'up';
            moving = true;
        }
        if (keys['ArrowDown']) {
            dy = 1;
            player.direction = 'down';
            moving = true;
        }
        if (keys['ArrowLeft']) {
            dx = -1;
            player.direction = 'left';
            moving = true;
        }
        if (keys['ArrowRight']) {
            dx = 1;
            player.direction = 'right';
            moving = true;
        }
        
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        const testPlayer = {x: newX, y: newY, width: player.width, height: player.height};
        
        let canMove = true;
        currentMapData.walls.forEach(wall => {
            if (checkRectCollision(testPlayer, wall)) {
                canMove = false;
            }
        });
        
        if (canMove) {
            player.x = newX;
            player.y = newY;
        }
        
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing) {
            player.isDashing = true;
            player.dashStart = Date.now();
            player.dashStartX = player.x;
            player.dashStartY = player.y;
            gameState.pedalPower--;
        }
    }
    
    if (currentMapData.exit && checkRectCollision(player, currentMapData.exit)) {
        gameState.currentMap++;
        if (gameState.currentMap < maps.length) {
            loadMap(gameState.currentMap);
        } else {
            console.log('Fim da demo! Voltando ao início...');
            gameState.currentMap = 0;
            loadMap(0);
        }
    }
    
    if (moving || player.isDashing) {
        player.lastMove = Date.now();
    } else if (Date.now() - player.lastMove > 1000) {
        if (Date.now() - gameState.lastRecharge > 6000 && gameState.pedalPower < gameState.maxPedalPower) {
            gameState.pedalPower++;
            gameState.lastRecharge = Date.now();
        }
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    if (moving && !player.isDashing && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}

function getPlayerSprite() {
    if (player.isDead) return player.sprites[player.deathFrame];
    
    const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
    const base = dirMap[player.direction];
    
    if (player.isDashing) {
        return player.sprites[8 + base];
    }
    
    const offset = player.frame * 4;
    return player.sprites[base + offset];
}

function draw() {
    const currentMapData = maps[gameState.currentMap];
    
    // Fundo
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Chão base
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar áreas de luz (mais claras)
    currentMapData.lights.forEach(light => {
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
    });
    
    // Desenhar áreas de sombra (mais escuras)
    currentMapData.shadows.forEach(shadow => {
        const gradient = ctx.createRadialGradient(shadow.x, shadow.y, 0, shadow.x, shadow.y, shadow.radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(shadow.x - shadow.radius, shadow.y - shadow.radius, shadow.radius * 2, shadow.radius * 2);
    });
    
    // Paredes
    ctx.fillStyle = '#333';
    currentMapData.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });
    
    // Saída
    if (currentMapData.exit) {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(currentMapData.exit.x, currentMapData.exit.y, 
                    currentMapData.exit.w, currentMapData.exit.h);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('SAÍDA', currentMapData.exit.x + 5, currentMapData.exit.y + 50);
    }
    
    // Inimigos
    enemies.forEach(enemy => {
        if (faquinhaLoaded >= 16) {
            const sprite = enemy.getSprite();
            if (sprite) {
                // Escurecer sprite se estiver na sombra
                if (isInShadow(enemy.x + enemy.width/2, enemy.y + enemy.height/2)) {
                    ctx.globalAlpha = 0.5;
                }
                ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
                ctx.globalAlpha = 1;
            }
        } else {
            if (!enemy.isDead) {
                ctx.fillStyle = enemy.state === 'chase' ? '#f0f' : '#808';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
        
        if (!enemy.isDead) {
            ctx.fillStyle = enemy.state === 'chase' ? '#ff0' : '#0f0';
            ctx.font = '10px Arial';
            ctx.fillText(enemy.state, enemy.x, enemy.y - 5);
        }
    });
    
    // Player
    if (madmaxLoaded >= 16) {
        const sprite = getPlayerSprite();
        if (sprite) {
            // Escurecer se estiver na sombra
            if (player.inShadow) {
                ctx.globalAlpha = 0.5;
            }
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
            ctx.globalAlpha = 1;
        }
    } else {
        ctx.fillStyle = player.isDashing ? '#ff0' : (player.isDead ? '#800' : '#f00');
        if (player.inShadow) {
            ctx.globalAlpha = 0.5;
        }
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.globalAlpha = 1;
    }
    
    // Nome do mapa
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentMapData.name, canvas.width/2, 40);
    ctx.textAlign = 'left';
    
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('ESPAÇO: dash | N: próximo mapa', 10, canvas.height - 40);
    ctx.fillText(`Mortes: ${gameState.deaths}/5 | Inimigos: ${enemies.filter(e => !e.isDead).length}`, 10, canvas.height - 20);
    
    // Status de sombra
    if (player.inShadow) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('NA SOMBRA - Invisível!', 10, 85);
    }
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Força de Pedal: ', 10, 65);
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
        ctx.fillText('█', 120 + i * 12, 65);
    }
    
    if (player.isDead) {
        ctx.fillStyle = '#f00';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        const msg = gameState.deaths < 5 ? "ah véi, se liga carái" : "sifudêu";
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicializar
loadAudio();
loadMap(0);

setTimeout(() => {
    playMusic('inicio');
}, 1000);

gameLoop();
console.log('Entre nas SOMBRAS para ficar invisível!');
