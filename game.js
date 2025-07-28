console.log('Mad Night v1.3.3 - Correções de Colisão e Respawn');

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
    phase: 'infiltration',
    dashUnlocked: false,
    bombPlaced: false,
    // Novo: controle de spawn de inimigos na fuga
    lastEnemySpawn: 0,
    enemySpawnDelay: 1000, // 1 segundo entre spawns
    spawnCorner: 0 // Para alternar entre os cantos
};

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 4,
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

// Sistema de Mapas - SEM BORDAS (cidade aberta)
const maps = [
    // FASE 1: INFILTRAÇÃO
    {
        name: "Maconhão",
        subtitle: "Tutorial de movimento",
        width: 800,
        height: 600,
        enemies: [],
        walls: [
            // Apenas campo de futebol (sem bordas do mapa)
            {x: 200, y: 150, w: 400, h: 20},
            {x: 200, y: 430, w: 400, h: 20},
        ],
        lights: [
            {x: 400, y: 300, radius: 200}
        ],
        shadows: [
            {x: 100, y: 100, radius: 80},
            {x: 700, y: 500, radius: 80},
            {x: 150, y: 450, radius: 100},
            {x: 650, y: 150, radius: 100}
        ],
        playerStart: {x: 100, y: 300},
        playerStartEscape: {x: 700, y: 300}, // Onde o player começa na fuga
        exit: {x: 700, y: 250, w: 50, h: 100},
        direction: 'right'
    },
    {
        name: "Eixão da Morte",
        subtitle: "Túnel sob as pistas",
        width: 800,
        height: 600,
        enemies: [],
        walls: [
            // Apenas teto e chão do túnel (sem bordas laterais)
            {x: 0, y: 0, w: 800, h: 100},
            {x: 0, y: 500, w: 800, h: 100},
            // Pilares do túnel
            {x: 200, y: 100, w: 60, h: 400},
            {x: 400, y: 100, w: 60, h: 400},
            {x: 600, y: 100, w: 60, h: 400},
        ],
        lights: [
            {x: 130, y: 300, radius: 80},
            {x: 330, y: 300, radius: 80},
            {x: 530, y: 300, radius: 80},
            {x: 730, y: 300, radius: 80}
        ],
        shadows: [],
        playerStart: {x: 80, y: 300},
        playerStartEscape: {x: 700, y: 300}, // Onde o player começa na fuga
        exit: {x: 700, y: 250, w: 50, h: 100},
        direction: 'right'
    },
    {
        name: "Fronteira com o Komando Satânico",
        subtitle: "Primeira superquadra",
        width: 800,
        height: 600,
        enemies: [
            {x: 400, y: 200, type: 'faquinha'},
            {x: 500, y: 400, type: 'faquinha'}
        ],
        // Inimigos diferentes para a fase de fuga
        escapeEnemies: [
            {x: 200, y: 300, type: 'faquinha'},
            {x: 600, y: 200, type: 'faquinha'},
            {x: 450, y: 450, type: 'faquinha'}
        ],
        walls: [
            // Apenas prédios (sem bordas do mapa)
            {x: 150, y: 100, w: 120, h: 150},
            {x: 350, y: 350, w: 120, h: 150},
            {x: 550, y: 150, w: 120, h: 100},
        ],
        lights: [
            {x: 100, y: 100, radius: 100},
            {x: 400, y: 300, radius: 150},
            {x: 700, y: 500, radius: 100}
        ],
        shadows: [
            {x: 210, y: 175, radius: 100},
            {x: 410, y: 425, radius: 100},
            {x: 610, y: 200, radius: 80}
        ],
        playerStart: {x: 80, y: 300},
        playerStartEscape: {x: 700, y: 300}, // Onde o player começa na fuga
        exit: {x: 600, y: 480, w: 60, h: 60},
        orelhao: {x: 680, y: 480, w: 40, h: 60},
        direction: 'right'
    },
    
    // FASE 2: INFILTRAÇÃO AVANÇADA - MAPAS VERTICAIS SEM BORDAS
    {
        name: "Na área da KS",
        subtitle: "Estacionamento estreito",
        width: 600,
        height: 800,
        enemies: [
            {x: 300, y: 200, type: 'faquinha'},
            {x: 200, y: 500, type: 'faquinha'}
        ],
        // Inimigos diferentes para a fase de fuga
        escapeEnemies: [
            {x: 150, y: 350, type: 'faquinha'},
            {x: 450, y: 250, type: 'faquinha'},
            {x: 300, y: 600, type: 'faquinha'}
        ],
        walls: [
            // Apenas carros estacionados (sem bordas do mapa)
            {x: 80, y: 150, w: 120, h: 60},
            {x: 400, y: 150, w: 120, h: 60},
            {x: 80, y: 300, w: 120, h: 60},
            {x: 400, y: 300, w: 120, h: 60},
            {x: 80, y: 450, w: 120, h: 60},
            {x: 400, y: 450, w: 120, h: 60},
        ],
        lights: [
            {x: 300, y: 100, radius: 100},
            {x: 300, y: 300, radius: 100},
            {x: 300, y: 500, radius: 100},
            {x: 300, y: 700, radius: 100}
        ],
        shadows: [
            {x: 140, y: 180, radius: 50},
            {x: 460, y: 180, radius: 50},
            {x: 140, y: 330, radius: 50},
            {x: 460, y: 330, radius: 50},
            {x: 140, y: 480, radius: 50},
            {x: 460, y: 480, radius: 50}
        ],
        playerStart: {x: 300, y: 650},
        playerStartEscape: {x: 300, y: 50}, // Onde o player começa na fuga
        exit: {x: 250, y: 10, w: 100, h: 30},
        direction: 'up'
    },
    {
        name: "Entre Prédios",
        subtitle: "Muitas sombras",
        width: 600,
        height: 800,
        enemies: [
            {x: 150, y: 400, type: 'faquinha'},
            {x: 450, y: 400, type: 'faquinha'}
        ],
        // Inimigos diferentes para a fase de fuga
        escapeEnemies: [
            {x: 300, y: 200, type: 'faquinha'},
            {x: 200, y: 600, type: 'faquinha'},
            {x: 400, y: 350, type: 'faquinha'}
        ],
        walls: [
            // Apenas blocos residenciais (sem bordas do mapa)
            {x: 80, y: 120, w: 160, h: 160},
            {x: 360, y: 120, w: 160, h: 160},
            {x: 80, y: 500, w: 160, h: 160},
            {x: 360, y: 500, w: 160, h: 160},
        ],
        lights: [
            {x: 300, y: 80, radius: 80},
            {x: 300, y: 400, radius: 120},
            {x: 300, y: 720, radius: 80}
        ],
        shadows: [
            {x: 160, y: 200, radius: 100},
            {x: 440, y: 200, radius: 100},
            {x: 160, y: 580, radius: 100},
            {x: 440, y: 580, radius: 100},
            {x: 300, y: 400, radius: 120}
        ],
        playerStart: {x: 300, y: 650},
        playerStartEscape: {x: 300, y: 50}, // Onde o player começa na fuga
        exit: {x: 250, y: 10, w: 100, h: 30},
        direction: 'up'
    },
    {
        name: "Ninho dos Ratos",
        subtitle: "Estacionamento da bomba",
        width: 600,
        height: 800,
        enemies: [
            {x: 200, y: 300, type: 'faquinha'},
            {x: 400, y: 300, type: 'faquinha'},
            {x: 300, y: 500, type: 'faquinha'}
        ],
        walls: [
            // Apenas carros grandes (sem bordas do mapa)
            {x: 120, y: 200, w: 140, h: 80},
            {x: 340, y: 200, w: 140, h: 80},
            {x: 120, y: 400, w: 140, h: 80},
            {x: 340, y: 400, w: 140, h: 80},
        ],
        lights: [
            {x: 150, y: 100, radius: 100},
            {x: 450, y: 100, radius: 100},
            {x: 300, y: 650, radius: 150}
        ],
        shadows: [
            {x: 190, y: 240, radius: 60},
            {x: 410, y: 240, radius: 60},
            {x: 190, y: 440, radius: 60},
            {x: 410, y: 440, radius: 60}
        ],
        playerStart: {x: 300, y: 650},
        playerStartEscape: {x: 300, y: 50}, // Onde o player começa na fuga
        exit: {x: 200, y: 750, w: 150, h: 40},
        lixeira: {x: 280, y: 120, w: 40, h: 40},
        direction: 'up'
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

// Sistema de colisão
function checkRectCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.w &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.h &&
           obj1.y + obj1.height > obj2.y;
}

function checkWallCollision(entity, newX, newY) {
    const currentMapData = maps[gameState.currentMap];
    const testEntity = {
        x: newX,
        y: newY,
        width: entity.width,
        height: entity.height
    };
    
    for (let wall of currentMapData.walls) {
        if (checkRectCollision(testEntity, wall)) {
            return true;
        }
    }
    return false;
}

// Função para spawnar inimigo nos cantos durante a fuga
function spawnEscapeEnemy() {
    const map = maps[gameState.currentMap];
    const corners = [
        {x: 50, y: 50},              // Canto superior esquerdo
        {x: map.width - 100, y: 50}, // Canto superior direito
        {x: 50, y: map.height - 100}, // Canto inferior esquerdo
        {x: map.width - 100, y: map.height - 100} // Canto inferior direito
    ];
    
    const corner = corners[gameState.spawnCorner % 4];
    gameState.spawnCorner++;
    
    const enemy = new Enemy(corner.x, corner.y);
    enemy.sprites = faquinhaSprites;
    enemy.state = 'chase'; // Já começam em perseguição
    enemies.push(enemy);
    
    console.log(`Inimigo spawnou no canto ${(gameState.spawnCorner - 1) % 4}`);
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
        this.alertVisionRange = 200;
    }
    
    update() {
        if (this.isDead) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const currentVisionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
        
        let effectiveVisionRange = currentVisionRange;
        if (player.inShadow) {
            effectiveVisionRange *= 0.3;
        }
        
        if (dist < effectiveVisionRange && !player.isDead) {
            this.state = 'chase';
            
            const moveX = (dx/dist) * this.speed;
            const moveY = (dy/dist) * this.speed;
            
            // Verificação de colisão para X
            if (!checkWallCollision(this, this.x + moveX, this.y)) {
                this.x += moveX;
            }
            
            // Verificação de colisão para Y
            if (!checkWallCollision(this, this.x, this.y + moveY)) {
                this.y += moveY;
            }
            
            // Atualizar direção baseado no movimento
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            // Checar colisão com player
            if (dist < 30) {
                killPlayer();
            }
        } else {
            if (this.state === 'chase') {
                console.log('Perdeu o player!');
            }
            this.state = 'patrol';
        }
        
        // Morte por dash
        if (player.isDashing && dist < 40) {
            this.die();
        }
        
        // Animação de frames
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
function loadMap(mapIndex, isEscape = false) {
    const map = maps[mapIndex];
    if (!map) return;
    
    enemies.length = 0;
    
    // Posicionar player baseado na fase
    if (isEscape && map.playerStartEscape) {
        player.x = map.playerStartEscape.x;
        player.y = map.playerStartEscape.y;
    } else {
        player.x = map.playerStart.x;
        player.y = map.playerStart.y;
    }
    
    player.isDead = false;
    player.isDashing = false;
    
    // Carregar inimigos apropriados
    const enemyList = (isEscape && map.escapeEnemies) ? map.escapeEnemies : map.enemies;
    
    enemyList.forEach(enemyData => {
        const enemy = new Enemy(enemyData.x, enemyData.y);
        enemy.sprites = faquinhaSprites;
        if (isEscape) {
            enemy.state = 'chase'; // Na fuga, já começam alertas
        }
        enemies.push(enemy);
    });
    
    console.log(`Mapa ${mapIndex + 1}: ${map.name} - Fase: ${gameState.phase}`);
}

// Detectar teclas
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'k' || e.key === 'K') killPlayer();
    
    if (e.key === 'e' || e.key === 'E') {
        const enemy = new Enemy(player.x + 150, player.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
        console.log('Inimigo criado!');
    }
    
    if (e.key === 'm' || e.key === 'M') {
        if (gameState.musicPhase === 'inicio') {
            playMusic('fuga');
        } else {
            playMusic('inicio');
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
            gameState.phase = 'infiltration';
            gameState.dashUnlocked = false;
            gameState.bombPlaced = false;
            loadMap(0);
            playMusic('inicio');
        } else {
            loadMap(gameState.currentMap, gameState.phase === 'escape');
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
    
    // Sistema de spawn contínuo durante a fuga no mapa da bomba
    if (gameState.phase === 'escape' && gameState.currentMap === 5 && gameState.bombPlaced) {
        if (Date.now() - gameState.lastEnemySpawn > gameState.enemySpawnDelay) {
            spawnEscapeEnemy();
            gameState.lastEnemySpawn = Date.now();
        }
    }
    
    if (player.isDead) return;
    
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
            let dashDx = 0;
            let dashDy = 0;
            
            switch(player.direction) {
                case 'up': dashDy = -dashSpeed; break;
                case 'down': dashDy = dashSpeed; break;
                case 'left': dashDx = -dashSpeed; break;
                case 'right': dashDx = dashSpeed; break;
            }
            
            const newX = player.x + dashDx;
            const newY = player.y + dashDy;
            
            if (!checkWallCollision(player, newX, newY)) {
                player.x = newX;
                player.y = newY;
            } else {
                player.isDashing = false;
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
        
        // Primeiro tenta mover em X
        if (dx !== 0) {
            const newX = player.x + dx * player.speed;
            if (!checkWallCollision(player, newX, player.y)) {
                player.x = newX;
            }
        }
        
        // Depois tenta mover em Y
        if (dy !== 0) {
            const newY = player.y + dy * player.speed;
            if (!checkWallCollision(player, player.x, newY)) {
                player.y = newY;
            }
        }
        
        // Dash
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing && gameState.dashUnlocked) {
            player.isDashing = true;
            player.dashStart = Date.now();
            gameState.pedalPower--;
        }
    }
    
    // Checar interações especiais
    if (currentMapData.orelhao && checkRectCollision(player, currentMapData.orelhao)) {
        if (!gameState.dashUnlocked) {
            gameState.dashUnlocked = true;
            console.log('CUTSCENE: Orelhão - Dash permanente desbloqueado!');
        }
    }
    
    if (currentMapData.lixeira && checkRectCollision(player, currentMapData.lixeira)) {
        if (!gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            gameState.lastEnemySpawn = Date.now();
            playMusic('fuga');
            console.log('BOMBA PLANTADA! FUJA!');
            
            // Não spawnar inimigos imediatamente, deixar o sistema de spawn contínuo fazer isso
        }
    }
    
    // Checar saída do mapa
    if (currentMapData.exit && checkRectCollision(player, currentMapData.exit)) {
        if (gameState.phase === 'escape' && gameState.currentMap === 5) {
            // Volta do mapa da bomba
            gameState.currentMap = 4;
            loadMap(4, true);
        } else if (gameState.phase === 'escape' && gameState.currentMap > 2) {
            // Voltando pelos mapas durante a fuga
            gameState.currentMap--;
            loadMap(gameState.currentMap, true);
        } else if (gameState.phase === 'infiltration' && gameState.currentMap < maps.length - 1) {
            // Avançando durante infiltração
            gameState.currentMap++;
            loadMap(gameState.currentMap);
        } else if (gameState.phase === 'infiltration' && gameState.currentMap === 5) {
            console.log('Chegou no último mapa! Plante a bomba!');
        } else {
            console.log('Fim da demo!');
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
    
    player.x = Math.max(0, Math.min(currentMapData.width - player.width, player.x));
    player.y = Math.max(0, Math.min(currentMapData.height - player.height, player.y));
    
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
    
    // Ajustar canvas se necessário
    if (canvas.width !== currentMapData.width || canvas.height !== currentMapData.height) {
        canvas.width = currentMapData.width;
        canvas.height = currentMapData.height;
    }
    
    // Fundo
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Luzes
    currentMapData.lights.forEach(light => {
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
    });
    
    // Sombras
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
    
    // Objetos especiais
    if (currentMapData.orelhao) {
        ctx.fillStyle = '#00f';
        ctx.fillRect(currentMapData.orelhao.x, currentMapData.orelhao.y, 
                    currentMapData.orelhao.w, currentMapData.orelhao.h);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText('TEL', currentMapData.orelhao.x + 5, currentMapData.orelhao.y + 30);
    }
    
    if (currentMapData.lixeira) {
        ctx.fillStyle = gameState.bombPlaced ? '#f00' : '#080';
        ctx.fillRect(currentMapData.lixeira.x, currentMapData.lixeira.y, 
                    currentMapData.lixeira.w, currentMapData.lixeira.h);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(gameState.bombPlaced ? 'BOOM!' : 'LIXO', 
                    currentMapData.lixeira.x + 2, currentMapData.lixeira.y + 25);
    }
    
    // Saída
    if (currentMapData.exit) {
        ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
        ctx.fillRect(currentMapData.exit.x, currentMapData.exit.y, 
                    currentMapData.exit.w, currentMapData.exit.h);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        const exitText = gameState.phase === 'escape' ? 'VOLTA' : 'SAÍDA';
        ctx.fillText(exitText, currentMapData.exit.x + 5, currentMapData.exit.y + 30);
    }
    
    // Inimigos
    enemies.forEach(enemy => {
        if (faquinhaLoaded >= 16) {
            const sprite = enemy.getSprite();
            if (sprite) {
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
        
        if (!enemy.isDead && gameState.phase === 'escape') {
            ctx.fillStyle = '#f00';
            ctx.font = '10px Arial';
            ctx.fillText('!', enemy.x + 25, enemy.y - 5);
        }
    });
    
    // Player
    if (madmaxLoaded >= 16) {
        const sprite = getPlayerSprite();
        if (sprite) {
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
    ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#ff0';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentMapData.name, canvas.width/2, 40);
    ctx.font = '16px Arial';
    ctx.fillText(currentMapData.subtitle, canvas.width/2, 60);
    ctx.textAlign = 'left';
    
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Mapa: ${gameState.currentMap + 1}/6 | Fase: ${gameState.phase === 'escape' ? 'FUGA!' : 'Infiltração'}`, 10, canvas.height - 40);
    ctx.fillText(`Mortes: ${gameState.deaths}/5 | Inimigos: ${enemies.filter(e => !e.isDead).length}`, 10, canvas.height - 20);
    
    if (player.inShadow) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('NA SOMBRA - Invisível!', 10, 85);
    }
    
    // Avisos especiais
    if (currentMapData.orelhao && !gameState.dashUnlocked) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Chegue no TELEFONE azul!', 10, 105);
    }
    
    if (currentMapData.lixeira && !gameState.bombPlaced) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Mate todos e coloque a BOMBA!', 10, 105);
    }
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Força de Pedal: ', 10, 65);
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
        ctx.fillText('█', 120 + i * 12, 65);
    }
    
    // Indicador de versão
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText('v1.3.3 - Colisão e Respawn Fix', canvas.width - 150, canvas.height - 5);
    
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
console.log('🎮 Mad Night v1.3.3 - Correções Implementadas! 🎮');
console.log('✅ Sistema de colisão melhorado para todos os inimigos');
console.log('✅ Inimigos diferentes na fase de fuga');
console.log('✅ Player começa na posição correta durante escape');
console.log('✅ Spawn contínuo de inimigos no mapa da bomba (1/segundo)');
console.log('✅ Inimigos surgem dos 4 cantos alternadamente');
console.log('📹 Preparado para sistema de câmera futuro');
