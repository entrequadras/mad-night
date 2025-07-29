console.log('Mad Night v1.6.3 - Tree Shadows Fix');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Sistema de assets
const assets = {
    campo: { img: new Image(), loaded: false },
    arvore001: { img: new Image(), loaded: false, width: 180, height: 194 },
    arvore002: { img: new Image(), loaded: false, width: 194, height: 200 },
    arvore003: { img: new Image(), loaded: false, width: 162, height: 200 },
    arvore004: { img: new Image(), loaded: false, width: 150, height: 190 },
    arvorebloco001: { img: new Image(), loaded: false, width: 354, height: 186 }
};

// Carregar assets
assets.campo.img.src = 'assets/buildings/campo_de_futebol.png';
assets.campo.img.onload = () => {
    assets.campo.loaded = true;
    console.log('Campo de futebol carregado!');
};

// Carregar árvores
assets.arvore001.img.src = 'assets/scenary/arvore001.png';
assets.arvore001.img.onload = () => {
    assets.arvore001.loaded = true;
    console.log('Árvore 001 carregada!');
};

assets.arvore002.img.src = 'assets/scenary/arvore002.png';
assets.arvore002.img.onload = () => {
    assets.arvore002.loaded = true;
    console.log('Árvore 002 carregada!');
};

assets.arvore003.img.src = 'assets/scenary/arvore003.png';
assets.arvore003.img.onload = () => {
    assets.arvore003.loaded = true;
    console.log('Árvore 003 carregada!');
};

assets.arvore004.img.src = 'assets/scenary/arvore004.png';
assets.arvore004.img.onload = () => {
    assets.arvore004.loaded = true;
    console.log('Árvore 004 carregada!');
};

assets.arvorebloco001.img.src = 'assets/scenary/arvorebloco001.png';
assets.arvorebloco001.img.onload = () => {
    assets.arvorebloco001.loaded = true;
    console.log('Árvore bloco carregada!');
};

// Configurações de câmera
const camera = {
    x: 0,
    y: 0,
    width: 960,
    height: 540,
    zoom: 2
};

// Configurar canvas
canvas.width = camera.width * camera.zoom;
canvas.height = camera.height * camera.zoom;

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
        width: 1920,
        height: 1080,
        enemies: [],
        // Árvores espalhadas pelo mapa
        trees: [
            {type: 'arvore001', x: 300, y: 150},
            {type: 'arvore002', x: 1400, y: 120},
            {type: 'arvore003', x: 150, y: 700},
            {type: 'arvore004', x: 1600, y: 750},
            {type: 'arvorebloco001', x: 700, y: 50},
            {type: 'arvore002', x: 450, y: 850},
            {type: 'arvore001', x: 1200, y: 880},
            {type: 'arvore003', x: 950, y: 100},
            {type: 'arvore004', x: 100, y: 400}
        ],
        walls: [
            // Paredes externas apenas
            {x: 0, y: 0, w: 1920, h: 20},      // topo
            {x: 0, y: 1060, w: 1920, h: 20},   // fundo
            {x: 0, y: 20, w: 20, h: 1040},     // esquerda
            {x: 1900, y: 20, w: 20, h: 1040},  // direita
            // Alguns obstáculos nos cantos
            {x: 200, y: 200, w: 80, h: 80},
            {x: 1600, y: 150, w: 80, h: 80},
            {x: 300, y: 800, w: 80, h: 80},
            {x: 1500, y: 850, w: 80, h: 80}
        ],
        lights: [
            {x: 960, y: 540, radius: 300},
            {x: 300, y: 300, radius: 150},
            {x: 1620, y: 300, radius: 150},
            {x: 300, y: 780, radius: 150},
            {x: 1620, y: 780, radius: 150}
        ],
        shadows: [
            {x: 240, y: 240, radius: 100},
            {x: 1640, y: 190, radius: 100},
            {x: 340, y: 840, radius: 100},
            {x: 1540, y: 890, radius: 100}
        ],
        playerStart: {x: 200, y: 300},  // Movido mais para cima
        playerStartEscape: {x: 1700, y: 540},
        exit: {x: 1800, y: 490, w: 80, h: 100},
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
            {x: 200, y: 100, w: 60, h: 100},
            {x: 200, y: 400, w: 60, h: 100},
            {x: 400, y: 100, w: 60, h: 100},
            {x: 400, y: 400, w: 60, h: 100},
            {x: 600, y: 100, w: 60, h: 100},
            {x: 600, y: 400, w: 60, h: 100},
            {x: 260, y: 150, w: 140, h: 20},
            {x: 260, y: 430, w: 140, h: 20},
            {x: 460, y: 150, w: 140, h: 20},
            {x: 460, y: 430, w: 140, h: 20}
        ],
        lights: [
            {x: 100, y: 300, radius: 100},
            {x: 700, y: 300, radius: 100},
            {x: 330, y: 300, radius: 70},
            {x: 530, y: 300, radius: 70}
        ],
        shadows: [
            {x: 230, y: 300, radius: 40},
            {x: 430, y: 300, radius: 40},
            {x: 630, y: 300, radius: 40}
        ],
        playerStart: {x: 100, y: 300},
        playerStartEscape: {x: 700, y: 300},
        exit: {x: 720, y: 250, w: 50, h: 100},
        direction: 'right'
    },
    {
        name: "Fronteira com o Komando Satânico",
        subtitle: "Primeira superquadra",
        width: 800,
        height: 600,
        enemies: [
            {x: 400, y: 200, type: 'faquinha'},
            {x: 500, y: 400, type: 'janis'}
        ],
        escapeEnemies: [
            {x: 400, y: 300, type: 'chacal'},
            {x: 200, y: 200, type: 'caveirinha'},
            {x: 600, y: 400, type: 'caveirinha'}
        ],
        walls: [
            {x: 150, y: 100, w: 120, h: 150},
            {x: 350, y: 350, w: 120, h: 150},
            {x: 550, y: 150, w: 120, h: 100}
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
            {x: 400, y: 450, w: 120, h: 60}
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
            {x: 360, y: 500, w: 160, h: 160}
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
            {x: 340, y: 400, w: 140, h: 80}
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
    
    // Checar sombras manuais
    for (let shadow of map.shadows) {
        const dist = Math.sqrt(Math.pow(x - shadow.x, 2) + Math.pow(y - shadow.y, 2));
        if (dist < shadow.radius) return true;
    }
    
    // Checar sombras das árvores
    if (map.trees) {
        for (let tree of map.trees) {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                let shadowRadius = tree.type === 'arvorebloco001' ? 
                    treeAsset.width * 0.25 : treeAsset.width * 0.35;
                
                const shadowX = tree.x + treeAsset.width * 0.5;
                const shadowY = tree.y + treeAsset.height * 0.85;
                
                const dist = Math.sqrt(Math.pow(x - shadowX, 2) + Math.pow(y - shadowY, 2));
                if (dist < shadowRadius) return true;
            }
        }
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
    
    // Checar paredes
    for (let wall of map.walls) {
        if (checkRectCollision(testEntity, wall)) {
            return true;
        }
    }
    
    // Checar colisão com troncos das árvores
    if (map.trees) {
        for (let tree of map.trees) {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                // Área de colisão do tronco (parte inferior central da árvore)
                const trunkCollision = {
                    x: tree.x + treeAsset.width * 0.35,  // 35% da largura
                    y: tree.y + treeAsset.height * 0.75, // 75% da altura
                    w: treeAsset.width * 0.3,             // 30% de largura
                    h: treeAsset.height * 0.2             // 20% de altura
                };
                
                if (checkRectCollision(testEntity, trunkCollision)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function findValidSpawnPosition(x, y, width, height) {
    if (!checkWallCollision({x, y, width, height}, x, y)) {
        return {x, y};
    }
    
    const maxDistance = 200;
    const step = 20;
    
    for (let dist = step; dist <= maxDistance; dist += step) {
        const positions = [
            {x: x + dist, y: y},
            {x: x - dist, y: y},
            {x: x, y: y + dist},
            {x: x, y: y - dist},
            {x: x + dist, y: y + dist},
            {x: x - dist, y: y - dist},
            {x: x + dist, y: y - dist},
            {x: x - dist, y: y + dist}
        ];
        
        for (let pos of positions) {
            const map = maps[gameState.currentMap];
            if (pos.x >= 0 && pos.x + width <= map.width && 
                pos.y >= 0 && pos.y + height <= map.height) {
                if (!checkWallCollision({x: pos.x, y: pos.y, width, height}, pos.x, pos.y)) {
                    return pos;
                }
            }
        }
    }
    
    return {x, y};
}

// Classe Enemy
class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.type = type;
        this.width = 46;  // MUDANÇA: de 50 para 46
        this.height = 46; // MUDANÇA: de 50 para 46
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
        
        this.attackRange = 200;
        this.lastAttack = 0;
        this.attackCooldown = 2000;
        
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
        
        if (this.type === 'chacal' && dist < 300 && !player.isDead) {
            this.state = 'chase';
        }
        
        if (this.type !== 'janis' && dist < visionRange && !player.isDead) {
            let canSee = false;
            const angleThreshold = 50;
            
            switch(this.direction) {
                case 'up': 
                    canSee = dy < 0 && Math.abs(dx) < angleThreshold;
                    break;
                case 'down': 
                    canSee = dy > 0 && Math.abs(dx) < angleThreshold;
                    break;
                case 'left': 
                    canSee = dx < 0 && Math.abs(dy) < angleThreshold;
                    break;
                case 'right': 
                    canSee = dx > 0 && Math.abs(dy) < angleThreshold;
                    break;
            }
            
            if (this.state === 'chase' || canSee || this.type === 'chacal') {
                this.state = 'chase';
                
                const angle = Math.atan2(dy, dx);
                const moveX = Math.cos(angle) * this.speed;
                const moveY = Math.sin(angle) * this.speed;
                
                if (!checkWallCollision(this, this.x + moveX, this.y)) {
                    this.x += moveX;
                }
                
                if (!checkWallCollision(this, this.x, this.y + moveY)) {
                    this.y += moveY;
                }
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.direction = dx > 0 ? 'right' : 'left';
                } else {
                    this.direction = dy > 0 ? 'down' : 'up';
                }
                
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
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathFrame = Math.floor(Math.random() * 4) + 12;
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        
        // Mapeamento unificado para todos os personagens
        const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
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
    
    const types = ['faquinha', 'morcego', 'caveirinha', 'caveirinha'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const validPos = findValidSpawnPosition(corner.x, corner.y, 46, 46); // MUDANÇA: de 50 para 46
    
    const enemy = new Enemy(validPos.x, validPos.y, randomType);
    
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
        const validPos = findValidSpawnPosition(enemyData.x, enemyData.y, 46, 46); // MUDANÇA: de 50 para 46
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

// Função para obter sprite do player
function getPlayerSprite() {
    if (player.isDead) return player.sprites[player.deathFrame];
    
    // Mapeamento unificado: baixo, direita, esquerda, cima
    const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
    const base = dirMap[player.direction];
    
    if (player.isDashing) return player.sprites[8 + base];
    return player.sprites[base + player.frame * 4];
}

// Update principal
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
    
    // Atualizar câmera
    camera.x = player.x + player.width/2 - camera.width/2;
    camera.y = player.y + player.height/2 - camera.height/2;
    camera.x = Math.max(0, Math.min(map.width - camera.width, camera.x));
    camera.y = Math.max(0, Math.min(map.height - camera.height, camera.y));
    
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

// Função de desenho principal
function draw() {
    const map = maps[gameState.currentMap];
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    
    const visibleArea = {
        left: camera.x - 100,
        right: camera.x + camera.width + 100,
        top: camera.y - 100,
        bottom: camera.y + camera.height + 100
    };
    
    // Renderizar elementos do mapa
    renderCampo(map);
    renderLights(map, visibleArea);
    renderShadows(map, visibleArea); // Sombras ANTES das árvores
    renderTrees(map, visibleArea, 'bottom'); // Troncos
    renderWalls(map, visibleArea);
    renderSpecialObjects(map);
    renderProjectiles(visibleArea);
    renderEnemies(visibleArea);
    renderPlayer();
    renderTrees(map, visibleArea, 'top'); // Copas (por último)
    
    ctx.restore();
    
    // Renderizar UI
    renderUI(map);
}

// Funções de renderização
function renderCampo(map) {
    // Renderizar campo apenas no Maconhão
    if (gameState.currentMap === 0 && assets.campo.loaded) {
        // Posicionar o campo no centro do mapa
        const campoX = (map.width - 800) / 2; // Campo de 800px de largura
        const campoY = (map.height - 462) / 2; // Campo de 462px de altura (dimensão real)
        
        ctx.drawImage(assets.campo.img, campoX, campoY);
    }
}

function renderTrees(map, visibleArea, layer = 'bottom') {
    if (!map.trees) return;
    
    map.trees.forEach(tree => {
        const treeAsset = assets[tree.type];
        if (treeAsset && treeAsset.loaded) {
            // Só renderizar se estiver na área visível
            if (tree.x + treeAsset.width > visibleArea.left && 
                tree.x < visibleArea.right &&
                tree.y + treeAsset.height > visibleArea.top && 
                tree.y < visibleArea.bottom) {
                
                if (layer === 'bottom') {
                    // Renderizar apenas o tronco (parte inferior)
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(tree.x, tree.y + treeAsset.height * 0.7, treeAsset.width, treeAsset.height * 0.3);
                    ctx.clip();
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    ctx.restore();
                } else if (layer === 'top') {
                    // Renderizar apenas a copa (parte superior)
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(tree.x, tree.y, treeAsset.width, treeAsset.height * 0.75);
                    ctx.clip();
                    
                    // Verificar se o player está sob a copa
                    const playerUnderTree = player.x + player.width > tree.x &&
                                          player.x < tree.x + treeAsset.width &&
                                          player.y + player.height > tree.y &&
                                          player.y < tree.y + treeAsset.height * 0.75;
                    
                    // Se o player estiver sob a copa, aplicar transparência
                    if (playerUnderTree) {
                        ctx.globalAlpha = 0.7; // 70% opacidade (30% transparência)
                    }
                    
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    ctx.restore();
                }
            }
        }
    });
}

function renderLights(map, visibleArea) {
    map.lights.forEach(light => {
        if (light.x + light.radius > visibleArea.left && 
            light.x - light.radius < visibleArea.right &&
            light.y + light.radius > visibleArea.top && 
            light.y - light.radius < visibleArea.bottom) {
            
            const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
        }
    });
}

function renderShadows(map, visibleArea) {
    // Sombras manuais do mapa
    map.shadows.forEach(shadow => {
        if (shadow.x + shadow.radius > visibleArea.left && 
            shadow.x - shadow.radius < visibleArea.right &&
            shadow.y + shadow.radius > visibleArea.top && 
            shadow.y - shadow.radius < visibleArea.bottom) {
            
            const gradient = ctx.createRadialGradient(shadow.x, shadow.y, 0, shadow.x, shadow.y, shadow.radius);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(shadow.x - shadow.radius, shadow.y - shadow.radius, shadow.radius * 2, shadow.radius * 2);
        }
    });
    
    // Sombras das árvores
    if (map.trees) {
        map.trees.forEach(tree => {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                // Calcular posição e tamanho da sombra baseado no tipo de árvore
                let shadowRadius;
                if (tree.type === 'arvorebloco001') {
                    shadowRadius = treeAsset.width * 0.25; // Bloco tem sombra mais larga
                } else {
                    shadowRadius = treeAsset.width * 0.35; // Árvores individuais
                }
                
                const shadowX = tree.x + treeAsset.width * 0.5;
                const shadowY = tree.y + treeAsset.height * 0.85;
                
                if (shadowX + shadowRadius > visibleArea.left && 
                    shadowX - shadowRadius < visibleArea.right &&
                    shadowY + shadowRadius > visibleArea.top && 
                    shadowY - shadowRadius < visibleArea.bottom) {
                    
                    const gradient = ctx.createRadialGradient(
                        shadowX, shadowY, 0,
                        shadowX, shadowY, shadowRadius
                    );
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)'); // Mais claro (era 0.9)
                    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)'); // Mais claro (era 0.6)
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        shadowX - shadowRadius,
                        shadowY - shadowRadius,
                        shadowRadius * 2,
                        shadowRadius * 2
                    );
                }
            }
        });
    }
}

function renderWalls(map, visibleArea) {
    ctx.fillStyle = '#333';
    map.walls.forEach(wall => {
        if (wall.x + wall.w > visibleArea.left && 
            wall.x < visibleArea.right &&
            wall.y + wall.h > visibleArea.top && 
            wall.y < visibleArea.bottom) {
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        }
    });
}

function renderSpecialObjects(map) {
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
}

function renderProjectiles(visibleArea) {
    projectiles.forEach(stone => {
        if (stone.x > visibleArea.left && stone.x < visibleArea.right &&
            stone.y > visibleArea.top && stone.y < visibleArea.bottom) {
            ctx.fillStyle = '#888';
            ctx.fillRect(stone.x - 5, stone.y - 5, stone.width, stone.height);
        }
    });
}

function renderEnemies(visibleArea) {
    enemies.forEach(enemy => {
        if (enemy.x + enemy.width > visibleArea.left && 
            enemy.x < visibleArea.right &&
            enemy.y + enemy.height > visibleArea.top && 
            enemy.y < visibleArea.bottom) {
            
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
                    
                    if (enemy.type === 'chacal' && !enemy.isDead && enemy.health < enemy.maxHealth) {
                        ctx.fillStyle = '#800';
                        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
                        ctx.fillStyle = '#f00';
                        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
                    }
                    
                    if (enemy.isInvulnerable) {
                        ctx.globalAlpha = 0.5;
                    }
                    
                    ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
                    ctx.globalAlpha = 1;
                }
            } else {
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
                ctx.fillText('!', enemy.x + 23, enemy.y - 5); // MUDANÇA: ajustado posição do ! (de 25 para 23)
            }
        }
    });
}

function renderPlayer() {
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
}

function renderUI(map) {
    // Nome do mapa
    ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#ff0';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(map.name, canvas.width/2, 80);
    ctx.font = '32px Arial';
    ctx.fillText(map.subtitle, canvas.width/2, 120);
    ctx.textAlign = 'left';
    
    // Info
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.fillText(`Mapa: ${gameState.currentMap + 1}/6`, 20, canvas.height - 80);
    ctx.fillText(`Inimigos: ${enemies.filter(e => !e.isDead).length}`, 20, canvas.height - 40);
    
    // Vidas
    ctx.fillText('Vidas: ', 20, 50);
    for (let i = 0; i < 5; i++) {
        ctx.font = '40px Arial';
        if (i >= gameState.deaths) {
            ctx.fillStyle = '#f00';
            ctx.fillText('💀', 120 + i * 60, 50);
        }
    }
    ctx.font = '28px Arial';
    
    // Status
    if (player.inShadow) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('NA SOMBRA - Invisível!', 20, 170);
    }
    
    // Avisos
    if (map.orelhao && !gameState.dashUnlocked) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Chegue no TELEFONE azul!', 20, 210);
    }
    
    if (map.lixeira && !gameState.bombPlaced) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Mate todos e coloque a BOMBA!', 20, 210);
    }
    
    // Força de Pedal
    ctx.fillStyle = '#fff';
    ctx.fillText('Força de Pedal: ', 20, 130);
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
        ctx.fillText('█', 240 + i * 24, 130);
    }
    
    // Versão
    ctx.fillStyle = '#666';
    ctx.font = '20px Arial';
    ctx.fillText('v1.6.3 - Tree Shadows Fix', canvas.width - 350, canvas.height - 10); // MUDANÇA: versão atualizada
    
    // Morte
    if (player.isDead) {
        ctx.fillStyle = '#f00';
        ctx.font = '64px Arial';
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
    img.onload = () => morcegoLoaded++;
    morcegoSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/caveirinha${String(i).padStart(3, '0')}.png`;
    img.onload = () => caveirinhaLoaded++;
    caveirinhaSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/janis${String(i).padStart(3, '0')}.png`;
    img.onload = () => janisLoaded++;
    janisSprites[i] = img;
}

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/chacal${String(i).padStart(3, '0')}.png`;
    img.onload = () => chacalLoaded++;
    chacalSprites[i] = img;
}

// Inicializar
loadAudio();
loadMap(0);
setTimeout(() => playMusic('inicio'), 1000);
gameLoop();

console.log('🎮 Mad Night v1.6.3 - Tree Shadows Fix! 🎮');
console.log('🌑 Sombras renderizadas ANTES das árvores');
console.log('💡 Sombras mais claras (60% → 30% opacidade)');
console.log('🌳 Copas das árvores não são mais escurecidas');
console.log('✅ Ordem de renderização corrigida!');
