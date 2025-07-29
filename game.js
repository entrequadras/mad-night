console.log('Mad Night v1.3.9 - Morcego e Ajustes 2');

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
    lastEnemySpawn: 0,
    enemySpawnDelay: 1000,
    spawnCorner: 0
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

// Sistema de Mapas
const maps = [
    {
        name: "Maconhão",
        subtitle: "Tutorial de movimento",
        width: 800,
        height: 600,
        enemies: [],
        walls: [
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
        playerStartEscape: {x: 700, y: 300},
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
            {x: 0, y: 0, w: 800, h: 100},
            {x: 0, y: 500, w: 800, h: 100},
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
        playerStartEscape: {x: 700, y: 300},
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
            {x: 500, y: 400, type: 'morcego'} // Alternando com morcego
        ],
        escapeEnemies: [
            {x: 400, y: 300, type: 'chacal'}, // Boss aparece na fuga!
            {x: 200, y: 200, type: 'caveirinha'},
            {x: 600, y: 400, type: 'caveirinha'}
        ],
        walls: [
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
        playerStartEscape: {x: 700, y: 300},
        exit: {x: 600, y: 480, w: 60, h: 60},
        orelhao: {x: 680, y: 480, w: 40, h: 60},
        direction: 'right'
    },
    {
        name: "Na área da KS",
        subtitle: "Estacionamento estreito",
        width: 600,
        height: 800,
        enemies: [
            {x: 300, y: 200, type: 'morcego'},
            {x: 200, y: 500, type: 'faquinha'}
        ],
        escapeEnemies: [
            {x: 150, y: 350, type: 'caveirinha'},
            {x: 450, y: 250, type: 'caveirinha'},
            {x: 300, y: 600, type: 'faquinha'}
        ],
        walls: [
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
        playerStartEscape: {x: 300, y: 50},
        exit: {x: 250, y: 10, w: 100, h: 30},
        direction: 'up'
    },
    {
        name: "Entre Prédios",
        subtitle: "Muitas sombras",
        width: 600,
        height: 800,
        enemies: [
            {x: 150, y: 400, type: 'morcego'},
            {x: 450, y: 400, type: 'faquinha'}
        ],
        escapeEnemies: [
            {x: 300, y: 200, type: 'janis'},
            {x: 200, y: 600, type: 'caveirinha'},
            {x: 400, y: 350, type: 'caveirinha'}
        ],
        walls: [
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
        playerStartEscape: {x: 300, y: 50},
        exit: {x: 250, y: 10, w: 100, h: 30},
        direction: 'up'
    },
    {
        name: "Ninho dos Ratos",
        subtitle: "Estacionamento da bomba",
        width: 600,
        height: 800,
        enemies: [
            {x: 200, y: 300, type: 'morcego'},
            {x: 400, y: 300, type: 'faquinha'},
            {x: 300, y: 500, type: 'janis'}
        ],
        walls: [
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
        playerStartEscape: {x: 300, y: 50},
        exit: {x: 200, y: 750, w: 150, h: 40},
        lixeira: {x: 280, y: 120, w: 40, h: 40},
        direction: 'up'
    }
];

// Arrays
const enemies = [];
const projectiles = [];
const faquinhaSprites = [];
const morcegoSprites = [];
const caveirinhaSprites = [];
const janisSprites = [];
const chacalSprites = [];

// Audio
const audio = {
    inicio: null,
    fuga: null,
    creditos: null
};

// Funções auxiliares
function isInLight(x, y) {
    const map = maps[gameState.currentMap];
    for (let light of map.lights) {
        const dist = Math.sqrt(Math.pow(x - light.x, 2) + Math.pow(y - light.y, 2));
        if (dist < light.radius) return true;
    }
    return false;
}

function isInShadow(x, y) {
    const map = maps[gameState.currentMap];
    for (let shadow of map.shadows) {
        const dist = Math.sqrt(Math.pow(x - shadow.x, 2) + Math.pow(y - shadow.y, 2));
        if (dist < shadow.radius) return true;
    }
    return false;
}

function checkRectCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.w &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.h &&
           obj1.y + obj1.height > obj2.y;
}

function checkWallCollision(entity, newX, newY) {
    const map = maps[gameState.currentMap];
    const testEntity = {
        x: newX,
        y: newY,
        width: entity.width,
        height: entity.height
    };
    
    for (let wall of map.walls) {
        if (checkRectCollision(testEntity, wall)) {
            return true;
        }
    }
    return false;
}

// Função para encontrar posição válida para spawn
function findValidSpawnPosition(x, y, width, height) {
    // Primeiro tenta a posição original
    if (!checkWallCollision({x, y, width, height}, x, y)) {
        return {x, y};
    }
    
    console.log(`Posição original (${x},${y}) está bloqueada, procurando alternativa...`);
    
    // Se não for válida, procura em espiral ao redor
    const maxDistance = 200;
    const step = 20;
    
    for (let dist = step; dist <= maxDistance; dist += step) {
        // Tenta 8 direções
        const positions = [
            {x: x + dist, y: y},           // direita
            {x: x - dist, y: y},           // esquerda
            {x: x, y: y + dist},           // baixo
            {x: x, y: y - dist},           // cima
            {x: x + dist, y: y + dist},    // diagonal baixo-direita
            {x: x - dist, y: y - dist},    // diagonal cima-esquerda
            {x: x + dist, y: y - dist},    // diagonal cima-direita
            {x: x - dist, y: y + dist}     // diagonal baixo-esquerda
        ];
        
        for (let pos of positions) {
            // Verifica se está dentro dos limites do mapa
            const map = maps[gameState.currentMap];
            if (pos.x >= 0 && pos.x + width <= map.width && 
                pos.y >= 0 && pos.y + height <= map.height) {
                if (!checkWallCollision({x: pos.x, y: pos.y, width, height}, pos.x, pos.y)) {
                    console.log(`Spawn ajustado de (${x},${y}) para (${pos.x},${pos.y})`);
                    return pos;
                }
            }
        }
    }
    
    // Se não encontrar posição válida, retorna a original (último recurso)
    console.warn(`AVISO: Não foi possível encontrar posição válida, usando posição original (${x},${y})`);
    return {x, y};
}

// Classe Enemy melhorada
class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.type = type;
        this.width = 56;  // Todos com mesmo tamanho agora
        this.height = 56;
        this.speed = type === 'caveirinha' ? 2.5 : 2;
        this.patrolSpeed = 1;
        this.direction = 'down';
        this.frame = 0;
        this.state = 'patrol';
        this.isDead = false;
        this.deathFrame = 12;
        this.sprites = [];
        this.visionRange = 150;
        this.alertVisionRange = 200;
        this.patrolRadius = 150;
        this.patrolDirection = this.getRandomDirection();
        this.lastDirectionChange = Date.now();
        this.directionChangeInterval = 2000 + Math.random() * 2000;
        
        // Específico para Janis
        this.attackRange = 200;
        this.lastAttack = 0;
        this.attackCooldown = 2000;
        
        // Específico para Chacal
        this.health = type === 'chacal' ? 3 : 1;
        this.maxHealth = this.health;
        this.isInvulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 500;
    }
    
    getRandomDirection() {
        const dirs = ['up', 'down', 'left', 'right'];
        return dirs[Math.floor(Math.random() * dirs.length)];
    }
    
    throwStone() {
        if (this.type !== 'janis' || Date.now() - this.lastAttack < this.attackCooldown) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < this.attackRange && !player.isDead) {
            this.lastAttack = Date.now();
            
            const stone = {
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: (dx/dist) * 4,
                vy: (dy/dist) * 4,
                width: 10,
                height: 10,
                active: true
            };
            
            projectiles.push(stone);
        }
    }
    
    update() {
        if (this.isDead) return;
        
        if (this.isInvulnerable && Date.now() - this.invulnerableTime > this.invulnerableDuration) {
            this.isInvulnerable = false;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let visionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
        if (player.inShadow) visionRange *= 0.3;
        
        // Comportamento da Janis
        if (this.type === 'janis') {
            if (dist < this.attackRange && !player.isDead) {
                this.state = 'attack';
                this.throwStone();
                this.direction = Math.abs(dx) > Math.abs(dy) ? 
                    (dx > 0 ? 'right' : 'left') : 
                    (dy > 0 ? 'down' : 'up');
            } else {
                this.state = 'patrol';
            }
        }
        
        // Comportamento do Chacal
        if (this.type === 'chacal' && dist < 300 && !player.isDead) {
            this.state = 'chase';
        }
        
        // Comportamento padrão
        if (this.type !== 'janis' && dist < visionRange && !player.isDead) {
            let canSee = false;
            
            switch(this.direction) {
                case 'up': canSee = dy < 0 && Math.abs(dx) < 50; break;
                case 'down': canSee = dy > 0 && Math.abs(dx) < 50; break;
                case 'left': canSee = dx < 0 && Math.abs(dy) < 50; break;
                case 'right': canSee = dx > 0 && Math.abs(dy) < 50; break;
            }
            
            if (this.state === 'chase' || canSee || this.type === 'chacal') {
                this.state = 'chase';
                const moveX = (dx/dist) * this.speed;
                const moveY = (dy/dist) * this.speed;
                
                if (!checkWallCollision(this, this.x + moveX, this.y)) {
                    this.x += moveX;
                }
                if (!checkWallCollision(this, this.x, this.y + moveY)) {
                    this.y += moveY;
                }
                
                this.direction = Math.abs(dx) > Math.abs(dy) ? 
                    (dx > 0 ? 'right' : 'left') : 
                    (dy > 0 ? 'down' : 'up');
                
                if (dist < 30) killPlayer();
            }
        } else if (this.type !== 'janis' || this.state !== 'attack') {
            this.state = 'patrol';
            
            if (Date.now() - this.lastDirectionChange > this.directionChangeInterval) {
                this.patrolDirection = this.getRandomDirection();
                this.lastDirectionChange = Date.now();
                this.directionChangeInterval = 2000 + Math.random() * 2000;
                this.direction = this.patrolDirection;
            }
            
            const distFromOrigin = Math.sqrt(
                Math.pow(this.x - this.originX, 2) + 
                Math.pow(this.y - this.originY, 2)
            );
            
            if (distFromOrigin > this.patrolRadius) {
                const backDx = this.originX - this.x;
                const backDy = this.originY - this.y;
                this.patrolDirection = Math.abs(backDx) > Math.abs(backDy) ?
                    (backDx > 0 ? 'right' : 'left') :
                    (backDy > 0 ? 'down' : 'up');
                this.direction = this.patrolDirection;
                this.lastDirectionChange = Date.now();
            }
            
            let pdx = 0, pdy = 0;
            switch(this.patrolDirection) {
                case 'up': pdy = -this.patrolSpeed; break;
                case 'down': pdy = this.patrolSpeed; break;
                case 'left': pdx = -this.patrolSpeed; break;
                case 'right': pdx = this.patrolSpeed; break;
            }
            
            if (!checkWallCollision(this, this.x + pdx, this.y + pdy)) {
                this.x += pdx;
                this.y += pdy;
            } else {
                this.patrolDirection = this.getRandomDirection();
                this.lastDirectionChange = Date.now();
                this.direction = this.patrolDirection;
            }
        }
        
        if (player.isDashing && dist < 40 && !this.isInvulnerable) {
            if (this.type === 'chacal') {
                this.takeDamage();
            } else {
                this.die();
            }
        }
        
        this.frame = Date.now() % 400 < 200 ? 0 : 1;
    }
    
    takeDamage() {
        if (this.isInvulnerable) return;
        
        this.health--;
        this.isInvulnerable = true;
        this.invulnerableTime = Date.now();
        
        console.log(`Chacal tomou dano! Vida: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.die();
            console.log('CHACAL DERROTADO!');
        }
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathFrame = Math.floor(Math.random() * 4) + 12;
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        const offset = (this.state === 'chase' || this.state === 'attack') ? 8 : this.frame * 4;
        return this.sprites[base + offset];
    }
}

// Funções do jogo
function loadAudio() {
    audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
    audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
    audio.creditos = new Audio('assets/audio/musica_etqgame_end_credits.mp3');
    audio.inicio.loop = true;
    audio.fuga.loop = true;
}

function playMusic(phase) {
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    if (phase === 'inicio' && audio.inicio) {
        audio.inicio.play().catch(e => {});
        gameState.currentMusic = audio.inicio;
        gameState.musicPhase = 'inicio';
    } else if (phase === 'fuga' && audio.fuga) {
        audio.fuga.play().catch(e => {});
        gameState.currentMusic = audio.fuga;
        gameState.musicPhase = 'fuga';
    }
}

function spawnEscapeEnemy() {
    const map = maps[gameState.currentMap];
    const corners = [
        {x: 50, y: 50, dir: 'down'},
        {x: map.width - 100, y: 50, dir: 'down'},
        {x: 50, y: map.height - 100, dir: 'up'},
        {x: map.width - 100, y: map.height - 100, dir: 'up'}
    ];
    
    const corner = corners[gameState.spawnCorner % 4];
    gameState.spawnCorner++;
    
    const types = ['faquinha', 'morcego', 'caveirinha', 'caveirinha']; // Variedade de inimigos
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Encontra posição válida para spawn
    const validPos = findValidSpawnPosition(corner.x, corner.y, 56, 56);
    
    const enemy = new Enemy(validPos.x, validPos.y, randomType);
    
    // Atribui sprites corretos
    switch(randomType) {
        case 'faquinha':
            enemy.sprites = faquinhaSprites;
            break;
        case 'morcego':
            enemy.sprites = morcegoSprites;
            break;
        case 'caveirinha':
            enemy.sprites = caveirinhaSprites;
            break;
    }
    enemy.state = 'chase';
    enemy.alertVisionRange = 400;
    
    const centerX = map.width / 2;
    const centerY = map.height / 2;
    enemy.direction = Math.abs(corner.x - centerX) > Math.abs(corner.y - centerY) ?
        (corner.x < centerX ? 'right' : 'left') :
        (corner.y < centerY ? 'down' : 'up');
    
    enemies.push(enemy);
}

function loadMap(mapIndex, isEscape = false) {
    const map = maps[mapIndex];
    if (!map) return;
    
    enemies.length = 0;
    projectiles.length = 0;
    
    if (isEscape && map.playerStartEscape) {
        player.x = map.playerStartEscape.x;
        player.y = map.playerStartEscape.y;
    } else {
        player.x = map.playerStart.x;
        player.y = map.playerStart.y;
    }
    
    player.isDead = false;
    player.isDashing = false;
    
    const enemyList = (isEscape && map.escapeEnemies) ? map.escapeEnemies : map.enemies;
    
    enemyList.forEach(enemyData => {
        const enemyWidth = enemyData.type === 'chacal' ? 56 : 56; // Todos mesmo tamanho agora
        const enemyHeight = enemyData.type === 'chacal' ? 56 : 56;
        
        // Verifica e ajusta posição se necessário
        const validPos = findValidSpawnPosition(enemyData.x, enemyData.y, enemyWidth, enemyHeight);
        
        const enemy = new Enemy(validPos.x, validPos.y, enemyData.type || 'faquinha');
        
        switch(enemy.type) {
            case 'faquinha':
                enemy.sprites = faquinhaSprites;
                break;
            case 'morcego':
                enemy.sprites = morcegoSprites;
                break;
            case 'caveirinha':
                enemy.sprites = caveirinhaSprites;
                break;
            case 'janis':
                enemy.sprites = janisSprites;
                break;
            case 'chacal':
                enemy.sprites = chacalSprites;
                break;
        }
        
        if (isEscape) enemy.state = 'chase';
        enemies.push(enemy);
        
        console.log(`Inimigo ${enemy.type} criado em (${enemy.x}, ${enemy.y})`);
    });
}

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

function updateProjectiles() {
    projectiles.forEach((stone, index) => {
        if (!stone.active) return;
        
        stone.x += stone.vx;
        stone.y += stone.vy;
        
        if (stone.x < player.x + player.width &&
            stone.x + stone.width > player.x &&
            stone.y < player.y + player.height &&
            stone.y + stone.height > player.y) {
            killPlayer();
            stone.active = false;
        }
        
        const map = maps[gameState.currentMap];
        if (stone.x < 0 || stone.x > map.width || stone.y < 0 || stone.y > map.height) {
            stone.active = false;
        }
        
        if (checkWallCollision(stone, stone.x, stone.y)) {
            stone.active = false;
        }
    });
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!projectiles[i].active) {
            projectiles.splice(i, 1);
        }
    }
}

// Input
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'k' || e.key === 'K') killPlayer();
    
    if (e.key === 'e' || e.key === 'E') {
        const enemy = new Enemy(player.x + 150, player.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
    }
    
    if (e.key === 'm' || e.key === 'M') {
        playMusic(gameState.musicPhase === 'inicio' ? 'fuga' : 'inicio');
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

// Update
let lastFrameTime = 0;
function update() {
    const map = maps[gameState.currentMap];
    
    enemies.forEach(enemy => enemy.update());
    updateProjectiles();
    
    enemies.forEach((enemy, index) => {
        if (enemy.isDead && !enemy.removeTime) {
            enemy.removeTime = Date.now() + 3000;
        }
        if (enemy.removeTime && Date.now() > enemy.removeTime) {
            enemies.splice(index, 1);
        }
    });
    
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
    let dx = 0, dy = 0;
    
    if (player.isDashing) {
        const progress = (Date.now() - player.dashStart) / player.dashDuration;
        
        if (progress >= 1) {
            player.isDashing = false;
        } else {
            const dashSpeed = player.dashDistance / player.dashDuration * 16;
            let dashDx = 0, dashDy = 0;
            
            switch(player.direction) {
                case 'up': dashDy = -dashSpeed; break;
                case 'down': dashDy = dashSpeed; break;
                case 'left': dashDx = -dashSpeed; break;
                case 'right': dashDx = dashSpeed; break;
            }
            
            if (!checkWallCollision(player, player.x + dashDx, player.y + dashDy)) {
                player.x += dashDx;
                player.y += dashDy;
            } else {
                player.isDashing = false;
            }
        }
    } else {
        if (keys['ArrowUp']) { dy = -1; player.direction = 'up'; moving = true; }
        if (keys['ArrowDown']) { dy = 1; player.direction = 'down'; moving = true; }
        if (keys['ArrowLeft']) { dx = -1; player.direction = 'left'; moving = true; }
        if (keys['ArrowRight']) { dx = 1; player.direction = 'right'; moving = true; }
        
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
        
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing && gameState.dashUnlocked) {
            player.isDashing = true;
            player.dashStart = Date.now();
            gameState.pedalPower--;
        }
    }
    
    if (map.orelhao && checkRectCollision(player, map.orelhao)) {
        if (!gameState.dashUnlocked) {
            gameState.dashUnlocked = true;
            console.log('CUTSCENE: Dash desbloqueado!');
        }
    }
    
    if (map.lixeira && checkRectCollision(player, map.lixeira)) {
        if (!gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            gameState.lastEnemySpawn = Date.now();
            playMusic('fuga');
            console.log('BOMBA PLANTADA! FUJA!');
        }
    }
    
    if (map.exit && checkRectCollision(player, map.exit)) {
        if (gameState.phase === 'escape') {
            if (gameState.currentMap === 5) {
                gameState.currentMap = 4;
                loadMap(4, true);
            } else if (gameState.currentMap > 0) {
                gameState.currentMap--;
                loadMap(gameState.currentMap, true);
            } else if (gameState.currentMap === 0) {
                console.log('BOSS do Chacal virá aqui!');
            }
        } else if (gameState.phase === 'infiltration') {
            if (gameState.currentMap < maps.length - 1) {
                gameState.currentMap++;
                loadMap(gameState.currentMap);
            }
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
    
    player.x = Math.max(0, Math.min(map.width - player.width, player.x));
    player.y = Math.max(0, Math.min(map.height - player.height, player.y));
    
    if (moving && !player.isDashing && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}

function getPlayerSprite() {
    if (player.isDead) return player.sprites[player.deathFrame];
    const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
    const base = dirMap[player.direction];
    if (player.isDashing) return player.sprites[8 + base];
    return player.sprites[base + player.frame * 4];
}

// Draw
function draw() {
    const map = maps[gameState.currentMap];
    
    if (canvas.width !== map.width || canvas.height !== map.height) {
        canvas.width = map.width;
        canvas.height = map.height;
    }
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    map.lights.forEach(light => {
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
    });
    
    map.shadows.forEach(shadow => {
        const gradient = ctx.createRadialGradient(shadow.x, shadow.y, 0, shadow.x, shadow.y, shadow.radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(shadow.x - shadow.radius, shadow.y - shadow.radius, shadow.radius * 2, shadow.radius * 2);
    });
    
    ctx.fillStyle = '#333';
    map.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });
    
    if (map.orelhao) {
        ctx.fillStyle = '#00f';
        ctx.fillRect(map.orelhao.x, map.orelhao.y, map.orelhao.w, map.orelhao.h);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText('TEL', map.orelhao.x + 5, map.orelhao.y + 30);
    }
    
    if (map.lixeira) {
        ctx.fillStyle = gameState.bombPlaced ? '#f00' : '#080';
        ctx.fillRect(map.lixeira.x, map.lixeira.y, map.lixeira.w, map.lixeira.h);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(gameState.bombPlaced ? 'BOOM!' : 'LIXO', map.lixeira.x + 2, map.lixeira.y + 25);
    }
    
    if (map.exit) {
        ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
        ctx.fillRect(map.exit.x, map.exit.y, map.exit.w, map.exit.h);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(gameState.phase === 'escape' ? 'VOLTA' : 'SAÍDA', map.exit.x + 5, map.exit.y + 30);
    }
    
    // Desenhar projéteis
    projectiles.forEach(stone => {
        ctx.fillStyle = '#888';
        ctx.fillRect(stone.x - 5, stone.y - 5, stone.width, stone.height);
    });
    
    // Desenhar inimigos
    enemies.forEach(enemy => {
        const loadedCheck = {
            'faquinha': faquinhaLoaded >= 16,
            'morcego': morcegoLoaded >= 16,
            'caveirinha': caveirinhaLoaded >= 16,
            'janis': janisLoaded >= 16,
            'chacal': chacalLoaded >= 16
        };
        
        if (loadedCheck[enemy.type]) {
            const sprite = enemy.getSprite();
            if (sprite) {
                if (isInShadow(enemy.x + enemy.width/2, enemy.y + enemy.height/2)) {
                    ctx.globalAlpha = 0.5;
                }
                
                // Desenhar barra de vida do Chacal
                if (enemy.type === 'chacal' && !enemy.isDead && enemy.health < enemy.maxHealth) {
                    ctx.fillStyle = '#800';
                    ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
                    ctx.fillStyle = '#f00';
                    ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
                }
                
                // Efeito de invulnerabilidade
                if (enemy.isInvulnerable) {
                    ctx.globalAlpha = 0.5;
                }
                
                ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
                ctx.globalAlpha = 1;
            }
        } else {
            // Placeholder colorido por tipo
            if (!enemy.isDead) {
                const colors = {
                    'faquinha': '#808',
                    'morcego': '#408',
                    'caveirinha': '#c0c',
                    'janis': '#0cc',
                    'chacal': '#f80'
                };
                ctx.fillStyle = enemy.state === 'chase' ? '#f0f' : colors[enemy.type];
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
        
        if (!enemy.isDead && gameState.phase === 'escape') {
            ctx.fillStyle = '#f00';
            ctx.font = '10px Arial';
            ctx.fillText('!', enemy.x + 25, enemy.y - 5);
        }
    });
    
    if (madmaxLoaded >= 16) {
        const sprite = getPlayerSprite();
        if (sprite) {
            if (player.inShadow) ctx.globalAlpha = 0.5;
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
            ctx.globalAlpha = 1;
        }
    } else {
        ctx.fillStyle = player.isDashing ? '#ff0' : (player.isDead ? '#800' : '#f00');
        if (player.inShadow) ctx.globalAlpha = 0.5;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.globalAlpha = 1;
    }
    
    ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#ff0';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(map.name, canvas.width/2, 40);
    ctx.font = '16px Arial';
    ctx.fillText(map.subtitle, canvas.width/2, 60);
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Mapa: ${gameState.currentMap + 1}/6 | Fase: ${gameState.phase === 'escape' ? 'FUGA!' : 'Infiltração'}`, 10, canvas.height - 40);
    ctx.fillText(`Inimigos: ${enemies.filter(e => !e.isDead).length}`, 10, canvas.height - 20);
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Vidas: ', 10, 25);
    for (let i = 0; i < 5; i++) {
        ctx.font = '20px Arial';
        if (i < gameState.deaths) {
            // Vidas perdidas - não desenha nada (vazio)
        } else {
            // Vidas restantes - mostra caveira
            ctx.fillStyle = '#f00';
            ctx.fillText('💀', 60 + i * 30, 25);
        }
    }
    ctx.font = '14px Arial';
    
    if (player.inShadow) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('NA SOMBRA - Invisível!', 10, 85);
    }
    
    if (map.orelhao && !gameState.dashUnlocked) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Chegue no TELEFONE azul!', 10, 105);
    }
    
    if (map.lixeira && !gameState.bombPlaced) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Mate todos e coloque a BOMBA!', 10, 105);
    }
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Força de Pedal: ', 10, 65);
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
        ctx.fillText('█', 120 + i * 12, 65);
    }
    
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText('v1.3.9 - Morcego e Ajustes 2', canvas.width - 170, canvas.height - 5);
    
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

// Carregar sprites
let madmaxLoaded = 0;
let faquinhaLoaded = 0;
let morcegoLoaded = 0;
let caveirinhaLoaded = 0;
let janisLoaded = 0;
let chacalLoaded = 0;

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
    img.onload = () => madmaxLoaded++;
    player.sprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
    img.onload = () => faquinhaLoaded++;
    faquinhaSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/morcego${String(i).padStart(3, '0')}.png`;
    img.onload = () => {
        morcegoLoaded++;
        if (morcegoLoaded === 1) console.log('Morcego sprites carregando...');
        if (morcegoLoaded === 16) console.log('Todos sprites Morcego carregados!');
    };
    img.onerror = () => console.error(`Erro ao carregar morcego${String(i).padStart(3, '0')}.png`);
    morcegoSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/caveirinha${String(i).padStart(3, '0')}.png`;
    img.onload = () => {
        caveirinhaLoaded++;
        if (caveirinhaLoaded === 1) console.log('Caveirinha sprites carregando...');
        if (caveirinhaLoaded === 16) console.log('Todos sprites Caveirinha carregados!');
    };
    img.onerror = () => console.error(`Erro ao carregar caveirinha${String(i).padStart(3, '0')}.png`);
    caveirinhaSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/janis${String(i).padStart(3, '0')}.png`;
    img.onload = () => {
        janisLoaded++;
        if (janisLoaded === 1) console.log('Janis sprites carregando...');
        if (janisLoaded === 16) console.log('Todos sprites Janis carregados!');
    };
    img.onerror = () => console.error(`Erro ao carregar janis${String(i).padStart(3, '0')}.png`);
    janisSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/chacal${String(i).padStart(3, '0')}.png`;
    img.onload = () => {
        chacalLoaded++;
        if (chacalLoaded === 1) console.log('Chacal sprites carregando...');
        if (chacalLoaded === 16) console.log('Todos sprites Chacal carregados!');
    };
    img.onerror = () => console.error(`Erro ao carregar chacal${String(i).padStart(3, '0')}.png`);
    chacalSprites[i] = img;
}

// Inicializar
loadAudio();
loadMap(0);
setTimeout(() => playMusic('inicio'), 1000);
gameLoop();

console.log('🎮 Mad Night v1.3.9 - Morcego e Ajustes 2! 🎮');
console.log('🦇 Morcego: Novo inimigo básico (igual ao Faquinha)');
console.log('💀 Sistema de vidas: caveiras somem conforme morre');
console.log('🏴‍☠️ Caveirinha: 25% mais rápido');
console.log('👧 Janis: Ataca com pedras à distância');
console.log('🐺 Chacal: Boss com 3 vidas (agora 56x56 pixels)');
console.log('✅ Sistema de spawn seguro implementado');
console.log('⚠️ NOTA: Se os sprites do Morcego não carregarem, o jogo usará placeholders coloridos');
