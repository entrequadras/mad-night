console.log('Mad Night v1.4.0 - Código Limpo e Otimizado');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ===== ESTADO DO JOGO =====
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
    gameStarted: true, // Mudado para true - sem tela de início por enquanto
    paused: false
};

// ===== PLAYER =====
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3.2,  // Reduzido de 4 para 3.2
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

// ===== SISTEMA DE MAPAS =====
const maps = [
    // FASE 1: INFILTRAÇÃO
    {
        name: "Maconhão",
        subtitle: "Tutorial de movimento",
        width: 800,
        height: 600,
        enemies: [],
        walls: [
            // Campo de futebol
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
            // Teto e chão do túnel
            {x: 0, y: 0, w: 800, h: 100},
            {x: 0, y: 500, w: 800, h: 100},
            // Pilares
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
        walls: [
            // Prédios
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
        exit: {x: 600, y: 480, w: 60, h: 60},
        orelhao: {x: 680, y: 480, w: 40, h: 60},
        direction: 'right'
    },
    
    // FASE 2: INFILTRAÇÃO AVANÇADA
    {
        name: "Na área da KS",
        subtitle: "Estacionamento estreito",
        width: 600,
        height: 800,
        enemies: [
            {x: 300, y: 200, type: 'faquinha'},
            {x: 200, y: 500, type: 'faquinha'}
        ],
        walls: [
            // Carros estacionados
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
        walls: [
            // Blocos residenciais
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
            // Carros grandes
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
        exit: {x: 250, y: 750, w: 100, h: 40},
        lixeira: {x: 280, y: 120, w: 40, h: 40},
        direction: 'up'
    }
];

// ===== CONTAINERS =====
const enemies = [];
const keys = {};

// ===== ÁUDIO =====
const audio = {
    inicio: null,
    fuga: null,
    creditos: null
};

// ===== CLASSE INIMIGO =====
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
        this.patrolOrigin = {x: x, y: y};
        this.patrolRadius = 50;
    }
    
    update() {
        if (this.isDead) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Sistema de visão
        const currentVisionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
        let effectiveVisionRange = currentVisionRange;
        
        if (player.inShadow) {
            effectiveVisionRange *= 0.3;
        }
        
        // Detecção e perseguição
        if (dist < effectiveVisionRange && !player.isDead) {
            this.state = 'chase';
            
            const moveX = (dx/dist) * this.speed;
            const moveY = (dy/dist) * this.speed;
            
            if (!checkWallCollision(this, this.x + moveX, this.y)) {
                this.x += moveX;
            }
            
            if (!checkWallCollision(this, this.x, this.y + moveY)) {
                this.y += moveY;
            }
            
            // Atualizar direção
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
            this.state = 'patrol';
            // Aqui poderia adicionar movimento de patrulha
        }
        
        // Morte por dash
        if (player.isDashing && dist < 40) {
            this.die();
        }
        
        // Animação
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
        console.log('Inimigo eliminado!');
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        
        const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        const offset = this.state === 'chase' ? 8 : this.frame * 4;
        
        return this.sprites[base + offset];
    }
}

// ===== FUNÇÕES DE ÁUDIO =====
function loadAudio() {
    audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
    audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
    audio.creditos = new Audio('assets/audio/musica_etqgame_end_credits.mp3');
    
    audio.inicio.loop = true;
    audio.fuga.loop = true;
    
    // Configurar volumes
    Object.values(audio).forEach(track => {
        if (track) track.volume = 0.5;
    });
    
    console.log('Sistema de áudio inicializado');
}

function playMusic(phase) {
    // Parar música atual
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    // Tocar nova música
    if (phase === 'inicio' && audio.inicio) {
        audio.inicio.play().catch(e => {
            console.log('Clique para ativar áudio');
        });
        gameState.currentMusic = audio.inicio;
        gameState.musicPhase = 'inicio';
    } else if (phase === 'fuga' && audio.fuga) {
        audio.fuga.play().catch(e => {
            console.log('Clique para ativar áudio');
        });
        gameState.currentMusic = audio.fuga;
        gameState.musicPhase = 'fuga';
    } else if (phase === 'creditos' && audio.creditos) {
        audio.creditos.play().catch(e => {
            console.log('Clique para ativar áudio');
        });
        gameState.currentMusic = audio.creditos;
        gameState.musicPhase = 'creditos';
    }
}

// ===== SISTEMA DE ILUMINAÇÃO =====
function isInLight(x, y) {
    const map = maps[gameState.currentMap];
    if (!map) return false;
    
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

function isInShadow(x, y) {
    const map = maps[gameState.currentMap];
    if (!map || !map.shadows) return false;
    
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

// ===== SISTEMA DE COLISÃO =====
function checkRectCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.w &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.h &&
           obj1.y + obj1.height > obj2.y;
}

function checkWallCollision(entity, newX, newY) {
    const currentMapData = maps[gameState.currentMap];
    if (!currentMapData || !currentMapData.walls) return false;
    
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

// ===== SISTEMA DE SPRITES =====
let madmaxLoaded = 0;
let faquinhaLoaded = 0;
const faquinhaSprites = [];

function loadSprites() {
    // Carregar sprites do MadMax
    for (let i = 0; i <= 15; i++) {
        const img = new Image();
        img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
        img.onload = () => {
            madmaxLoaded++;
            if (madmaxLoaded === 16) console.log('Sprites MadMax carregados!');
        };
        player.sprites[i] = img;
    }
    
    // Carregar sprites dos inimigos
    for (let i = 0; i <= 15; i++) {
        const img = new Image();
        img.src = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
        img.onload = () => {
            faquinhaLoaded++;
            if (faquinhaLoaded === 16) console.log('Sprites Faquinha carregados!');
        };
        faquinhaSprites[i] = img;
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

// ===== GERENCIAMENTO DE MAPAS =====
function loadMap(mapIndex) {
    const map = maps[mapIndex];
    if (!map) {
        console.error('Mapa não encontrado:', mapIndex);
        return;
    }
    
    // Limpar inimigos
    enemies.length = 0;
    
    // Resetar player - posição muda baseado na fase
    if (gameState.phase === 'escape' && map.exit) {
        // Durante fuga, spawn onde era a saída
        player.x = map.exit.x;
        player.y = map.exit.y;
    } else {
        // Durante infiltração, spawn normal
        player.x = map.playerStart.x;
        player.y = map.playerStart.y;
    }
    
    player.isDead = false;
    player.isDashing = false;
    
    // Criar inimigos
    if (map.enemies) {
        map.enemies.forEach(enemyData => {
            const enemy = new Enemy(enemyData.x, enemyData.y);
            enemy.sprites = faquinhaSprites;
            enemies.push(enemy);
        });
    }
    
    // Durante fuga, adicionar inimigos extras perseguindo
    if (gameState.phase === 'escape') {
        const spawnPoints = [
            {x: map.width - 100, y: map.height/2},
            {x: map.width - 100, y: map.height/2 - 50},
            {x: map.width - 100, y: map.height/2 + 50}
        ];
        
        spawnPoints.forEach((point, i) => {
            if (point.x > 0 && point.y > 0) {
                setTimeout(() => {
                    const enemy = new Enemy(point.x, point.y);
                    enemy.sprites = faquinhaSprites;
                    enemy.state = 'chase';
                    enemies.push(enemy);
                }, i * 500);
            }
        });
    }
    
    console.log(`Mapa ${mapIndex + 1}/${maps.length}: ${map.name} - ${map.subtitle}`);
}

// ===== SISTEMA DE MORTE =====
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.isDashing = false;
    player.deathFrame = Math.floor(Math.random() * 4) + 12;
    gameState.deaths++;
    
    console.log(`Mortes: ${gameState.deaths}/5`);
    
    setTimeout(() => {
        if (gameState.deaths >= 5) {
            // Game over - reiniciar tudo
            gameState.deaths = 0;
            gameState.currentMap = 0;
            gameState.phase = 'infiltration';
            gameState.dashUnlocked = false;
            gameState.bombPlaced = false;
            gameState.pedalPower = gameState.maxPedalPower;
            loadMap(0);
            playMusic('inicio');
            console.log('GAME OVER - Jogo reiniciado');
        } else {
            // Respawn no mesmo mapa (mas posição muda na fuga)
            loadMap(gameState.currentMap);
        }
    }, 2000);
}

// ===== CONTROLES =====
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Debug controls
    if (e.key === 'k' || e.key === 'K') {
        killPlayer();
    }
    
    if (e.key === 'e' || e.key === 'E') {
        const enemy = new Enemy(player.x + 150, player.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
        console.log('Inimigo criado para teste');
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
    
    if (e.key === 'p' || e.key === 'P') {
        gameState.paused = !gameState.paused;
        console.log(gameState.paused ? 'Jogo pausado' : 'Jogo despausado');
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Clique para ativar áudio
canvas.addEventListener('click', () => {
    if (gameState.currentMusic && gameState.currentMusic.paused) {
        gameState.currentMusic.play();
    }
});

// ===== UPDATE PRINCIPAL =====
let lastFrameTime = 0;

function update() {
    if (!gameState.gameStarted || gameState.paused) return;
    
    const currentMapData = maps[gameState.currentMap];
    if (!currentMapData) return;
    
    // Atualizar inimigos
    enemies.forEach(enemy => enemy.update());
    
    // Remover inimigos mortos após delay
    enemies.forEach((enemy, index) => {
        if (enemy.isDead && !enemy.removeTime) {
            enemy.removeTime = Date.now() + 3000;
        }
        if (enemy.removeTime && Date.now() > enemy.removeTime) {
            enemies.splice(index, 1);
        }
    });
    
    if (player.isDead) return;
    
    // Checar sombra
    const playerCenterX = player.x + player.width/2;
    const playerCenterY = player.y + player.height/2;
    player.inShadow = isInShadow(playerCenterX, playerCenterY);
    
    // Movimento do player
    let moving = false;
    let dx = 0;
    let dy = 0;
    
    if (player.isDashing) {
        // Lógica do dash
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
        // Movimento normal
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
        
        // Aplicar movimento com colisão
        if (dx !== 0) {
            const newX = player.x + dx * player.speed;
            if (!checkWallCollision(player, newX, player.y)) {
                player.x = newX;
            }
        }
        
        if (dy !== 0) {
            const newY = player.y + dy * player.speed;
            if (!checkWallCollision(player, player.x, newY)) {
                player.y = newY;
            }
        }
        
        // Sistema de dash
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing && gameState.dashUnlocked) {
            player.isDashing = true;
            player.dashStart = Date.now();
            gameState.pedalPower--;
            console.log(`Dash! Força restante: ${gameState.pedalPower}`);
        }
    }
    
    // Interações especiais
    if (currentMapData.orelhao && checkRectCollision(player, currentMapData.orelhao)) {
        if (!gameState.dashUnlocked) {
            gameState.dashUnlocked = true;
            console.log('📞 CUTSCENE: Dash desbloqueado!');
            showMessage('DASH DESBLOQUEADO! Use ESPAÇO para dar trancos!', 3000);
        }
    }
    
    if (currentMapData.lixeira && checkRectCollision(player, currentMapData.lixeira)) {
        if (!gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            playMusic('fuga');
            console.log('💣 BOMBA PLANTADA! FUJA!');
            showMessage('BOMBA PLANTADA! VAZA CARÁÁÁÁI!', 3000);
            
            // Spawn de inimigos na fuga
            for (let i = 0; i < 4; i++) {
                const enemy = new Enemy(300, 600 + i * 50);
                enemy.sprites = faquinhaSprites;
                enemy.state = 'chase';
                enemies.push(enemy);
            }
        }
    }
    
    // Sistema de saída/entrada
    if (currentMapData.exit && checkRectCollision(player, currentMapData.exit)) {
        handleMapTransition();
    }
    
    // Recarga de força
    if (moving || player.isDashing) {
        player.lastMove = Date.now();
    } else if (Date.now() - player.lastMove > 1000) {
        if (Date.now() - gameState.lastRecharge > 6000 && gameState.pedalPower < gameState.maxPedalPower) {
            gameState.pedalPower++;
            gameState.lastRecharge = Date.now();
            console.log(`Força recarregada: ${gameState.pedalPower}/${gameState.maxPedalPower}`);
        }
    }
    
    // Limitar player aos limites do mapa
    player.x = Math.max(0, Math.min(currentMapData.width - player.width, player.x));
    player.y = Math.max(0, Math.min(currentMapData.height - player.height, player.y));
    
    // Animação
    if (moving && !player.isDashing && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}

// ===== SISTEMA DE TRANSIÇÃO DE MAPAS =====
function handleMapTransition() {
    if (gameState.phase === 'escape') {
        // Lógica de fuga (volta pelos mapas)
        if (gameState.currentMap > 0) {
            gameState.currentMap--;
            loadMap(gameState.currentMap);
            console.log('Fugindo pelo mapa anterior!');
        } else {
            // Fim do jogo - vitória
            console.log('🏆 VITÓRIA! Você escapou!');
            showMessage('VOCÊ ESCAPOU! ...por enquanto', 5000);
            playMusic('creditos');
            setTimeout(() => {
                resetGame();
            }, 10000);
        }
    } else {
        // Lógica de infiltração (avança pelos mapas)
        if (gameState.currentMap < maps.length - 1) {
            gameState.currentMap++;
            loadMap(gameState.currentMap);
            
            // Mostrar logo após primeiro mapa
            if (gameState.currentMap === 1) {
                showMessage('MAD NIGHT', 2000);
                playMusic('inicio');
            }
        } else {
            console.log('Chegou no último mapa! Elimine todos e plante a bomba!');
        }
    }
}

// ===== SISTEMA DE RENDERIZAÇÃO =====
function draw() {
    const currentMapData = maps[gameState.currentMap];
    if (!currentMapData) return;
    
    // Ajustar canvas se necessário
    if (canvas.width !== currentMapData.width || canvas.height !== currentMapData.height) {
        canvas.width = currentMapData.width;
        canvas.height = currentMapData.height;
    }
    
    // Limpar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Fundo base
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Renderizar luzes
    drawLights(currentMapData);
    
    // Renderizar sombras
    drawShadows(currentMapData);
    
    // Renderizar paredes
    drawWalls(currentMapData);
    
    // Renderizar objetos especiais
    drawSpecialObjects(currentMapData);
    
    // Renderizar inimigos
    drawEnemies();
    
    // Renderizar player
    drawPlayer();
    
    // Renderizar UI
    drawUI(currentMapData);
    
    // Mensagem de morte
    if (player.isDead) {
        drawDeathMessage();
    }
    
    // Pausa
    if (gameState.paused) {
        drawPauseScreen();
    }
}

function drawLights(mapData) {
    if (!mapData.lights) return;
    
    mapData.lights.forEach(light => {
        const gradient = ctx.createRadialGradient(
            light.x, light.y, 0,
            light.x, light.y, light.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            light.x - light.radius,
            light.y - light.radius,
            light.radius * 2,
            light.radius * 2
        );
    });
}

function drawShadows(mapData) {
    if (!mapData.shadows) return;
    
    mapData.shadows.forEach(shadow => {
        const gradient = ctx.createRadialGradient(
            shadow.x, shadow.y, 0,
            shadow.x, shadow.y, shadow.radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            shadow.x - shadow.radius,
            shadow.y - shadow.radius,
            shadow.radius * 2,
            shadow.radius * 2
        );
    });
}

function drawWalls(mapData) {
    ctx.fillStyle = '#333';
    if (mapData.walls) {
        mapData.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        });
    }
}

function drawSpecialObjects(mapData) {
    // Orelhão
    if (mapData.orelhao) {
        ctx.fillStyle = gameState.dashUnlocked ? '#006' : '#00f';
        ctx.fillRect(
            mapData.orelhao.x,
            mapData.orelhao.y,
            mapData.orelhao.w,
            mapData.orelhao.h
        );
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText('TEL', mapData.orelhao.x + 5, mapData.orelhao.y + 30);
    }
    
    // Lixeira/Bomba
    if (mapData.lixeira) {
        ctx.fillStyle = gameState.bombPlaced ? '#f00' : '#080';
        ctx.fillRect(
            mapData.lixeira.x,
            mapData.lixeira.y,
            mapData.lixeira.w,
            mapData.lixeira.h
        );
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(
            gameState.bombPlaced ? 'BOOM!' : 'LIXO',
            mapData.lixeira.x + 2,
            mapData.lixeira.y + 25
        );
    }
    
    // Saída
    if (mapData.exit) {
        ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
        ctx.fillRect(
            mapData.exit.x,
            mapData.exit.y,
            mapData.exit.w,
            mapData.exit.h
        );
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        const exitText = gameState.phase === 'escape' ? 'VOLTA' : 'SAÍDA';
        ctx.fillText(exitText, mapData.exit.x + 5, mapData.exit.y + 30);
    }
}

function drawEnemies() {
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
            // Fallback para retângulo
            if (!enemy.isDead) {
                ctx.fillStyle = enemy.state === 'chase' ? '#f0f' : '#808';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
        
        // Indicador de alerta
        if (!enemy.isDead && enemy.state === 'chase') {
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('!', enemy.x + 25, enemy.y - 5);
        }
    });
}

function drawPlayer() {
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
        // Fallback para retângulo
        ctx.fillStyle = player.isDashing ? '#ff0' : (player.isDead ? '#800' : '#f00');
        if (player.inShadow) {
            ctx.globalAlpha = 0.5;
        }
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.globalAlpha = 1;
    }
}

function drawUI(mapData) {
    // Nome do mapa
    ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#ff0';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(mapData.name, canvas.width/2, 40);
    ctx.font = '16px Arial';
    ctx.fillText(mapData.subtitle, canvas.width/2, 60);
    ctx.textAlign = 'left';
    
    // Status
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(
        `Mapa: ${gameState.currentMap + 1}/${maps.length} | Fase: ${gameState.phase === 'escape' ? 'FUGA!' : 'Infiltração'}`,
        10, canvas.height - 40
    );
    ctx.fillText(
        `Mortes: ${gameState.deaths}/5 | Inimigos: ${enemies.filter(e => !e.isDead).length}`,
        10, canvas.height - 20
    );
    
    // Indicador de sombra
    if (player.inShadow) {
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('NA SOMBRA - Invisível!', 10, 85);
    }
    
    // Avisos especiais
    if (mapData.orelhao && !gameState.dashUnlocked) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Chegue no TELEFONE azul!', 10, 105);
    }
    
    if (mapData.lixeira && !gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Coloque a BOMBA na lixeira!', 10, 105);
    }
    
    // Força de Pedal
    if (gameState.dashUnlocked) {
        ctx.fillStyle = '#fff';
        ctx.fillText('Força de Pedal: ', 10, 65);
        for (let i = 0; i < gameState.maxPedalPower; i++) {
            ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
            ctx.fillText('█', 120 + i * 12, 65);
        }
    }
    
    // Versão
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('v1.4.0 - CÓDIGO LIMPO', canvas.width - 150, canvas.height - 5);
}

function drawDeathMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    const msg = gameState.deaths < 5 ? "ah véi, se liga carái" : "sifudêu";
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px Arial';
    ctx.fillText('Pressione P para continuar', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
}

// ===== SISTEMA DE MENSAGENS =====
let currentMessage = null;
let messageTimeout = null;

function showMessage(text, duration = 2000) {
    currentMessage = text;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        currentMessage = null;
    }, duration);
}

// ===== GAME LOOP =====
function gameLoop() {
    update();
    draw();
    
    // Desenhar mensagem se houver
    if (currentMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 30, 400, 60);
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentMessage, canvas.width/2, canvas.height/2 + 5);
        ctx.textAlign = 'left';
    }
    
    requestAnimationFrame(gameLoop);
}

// ===== INICIALIZAÇÃO =====
function initGame() {
    loadAudio();
    loadSprites();
    loadMap(0);
    
    setTimeout(() => {
        playMusic('inicio');
    }, 1000);
    
    console.log('🎮 Mad Night iniciado!');
    console.log('Controles: Setas para mover, Espaço para dash (após desbloquear)');
    console.log('Debug: K=morte, E=spawn inimigo, M=trocar música, N=próximo mapa, P=pausar');
}

function resetGame() {
    gameState.deaths = 0;
    gameState.currentMap = 0;
    gameState.phase = 'infiltration';
    gameState.dashUnlocked = false;
    gameState.bombPlaced = false;
    gameState.pedalPower = gameState.maxPedalPower;
    
    loadMap(0);
    playMusic('inicio');
    
    console.log('Jogo reiniciado!');
}

// ===== INÍCIO DO JOGO =====
initGame();
gameLoop();

console.log('🎮 Mad Night v1.4.0 - Pronto para jogar! 🎮');
console.log('📝 Código limpo e otimizado');
console.log('🚴 Sistema completo de gameplay');
console.log('🏙️ Mapas sem bordas mantidos');
console.log('⚡ Melhorias de performance aplicadas');
