console.log('Mad Night v1.9.61 - Corredor do túnel aberto');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

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
    spawnCorner: 0,
    version: 'v1.9.61 - Corredor do túnel aberto'
};

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3.6,
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

// Sistema de assets
const assets = {
    campo: { img: new Image(), loaded: false },
    campoTraves: { img: new Image(), loaded: false },
    arvore001: { img: new Image(), loaded: false, width: 180, height: 194 },
    arvore002: { img: new Image(), loaded: false, width: 194, height: 200 },
    arvore003: { img: new Image(), loaded: false, width: 162, height: 200 },
    arvore004: { img: new Image(), loaded: false, width: 150, height: 190 },
    arvorebloco001: { img: new Image(), loaded: false, width: 354, height: 186 },
    poste000: { img: new Image(), loaded: false, width: 40, height: 120 },
    poste001: { img: new Image(), loaded: false, width: 40, height: 120 },
    grama000: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama001: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama002: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama003: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama004: { img: new Image(), loaded: false, width: 120, height: 120 },
    caixadeluz: { img: new Image(), loaded: false, width: 45, height: 45 },
    // Assets do Eixão
    eixaoCamada1: { img: new Image(), loaded: false, width: 3000, height: 868 },
    eixaoCamada2: { img: new Image(), loaded: false, width: 3000, height: 868 }
};

// Carregar assets
assets.campo.img.src = 'assets/buildings/campo_de_futebol.png';
assets.campo.img.onload = () => { assets.campo.loaded = true; };

assets.campoTraves.img.src = 'assets/buildings/campo_de_futebol_traves.png';
assets.campoTraves.img.onload = () => { assets.campoTraves.loaded = true; };

assets.arvore001.img.src = 'assets/scenary/arvore001.png';
assets.arvore001.img.onload = () => { assets.arvore001.loaded = true; };

assets.arvore002.img.src = 'assets/scenary/arvore002.png';
assets.arvore002.img.onload = () => { assets.arvore002.loaded = true; };

assets.arvore003.img.src = 'assets/scenary/arvore003.png';
assets.arvore003.img.onload = () => { assets.arvore003.loaded = true; };

assets.arvore004.img.src = 'assets/scenary/arvore004.png';
assets.arvore004.img.onload = () => { assets.arvore004.loaded = true; };

assets.arvorebloco001.img.src = 'assets/scenary/arvorebloco001.png';
assets.arvorebloco001.img.onload = () => { assets.arvorebloco001.loaded = true; };

assets.poste000.img.src = 'assets/scenary/poste000.png';
assets.poste000.img.onload = () => { assets.poste000.loaded = true; };

assets.poste001.img.src = 'assets/scenary/poste001.png';
assets.poste001.img.onload = () => { assets.poste001.loaded = true; };

// Carregar tiles de grama apenas para o mapa 1
assets.grama000.img.src = 'assets/tiles/grama000.png';
assets.grama000.img.onload = () => { assets.grama000.loaded = true; };

assets.grama001.img.src = 'assets/tiles/grama001.png';
assets.grama001.img.onload = () => { assets.grama001.loaded = true; };

assets.grama002.img.src = 'assets/tiles/grama002.png';
assets.grama002.img.onload = () => { assets.grama002.loaded = true; };

assets.grama003.img.src = 'assets/tiles/grama003.png';
assets.grama003.img.onload = () => { assets.grama003.loaded = true; };

assets.grama004.img.src = 'assets/tiles/grama004.png';
assets.grama004.img.onload = () => { assets.grama004.loaded = true; };

// Carregar objetos
assets.caixadeluz.img.src = 'assets/objects/caixadeluz.png';
assets.caixadeluz.img.onload = () => { assets.caixadeluz.loaded = true; };

// Carregar assets do Eixão
assets.eixaoCamada1.img.src = 'assets/floors/eixao_da_morte_camada1.png';
assets.eixaoCamada1.img.onload = () => { assets.eixaoCamada1.loaded = true; };

assets.eixaoCamada2.img.src = 'assets/floors/eixao_da_morte_camada2.png';
assets.eixaoCamada2.img.onload = () => { assets.eixaoCamada2.loaded = true; };

// Sistema de flicker para postes
const flickerSystem = {
    lights: {},
    
    update: function(lightId) {
        if (!this.lights[lightId]) {
            this.lights[lightId] = {
                intensity: 1.0,
                targetIntensity: 1.0,
                flickering: false,
                flickerTime: 0,
                nextFlicker: Date.now() + Math.random() * 5000 + 3000
            };
        }
        
        const light = this.lights[lightId];
        const now = Date.now();
        
        if (!light.flickering && now > light.nextFlicker) {
            light.flickering = true;
            light.flickerTime = now + Math.random() * 500 + 200;
            light.targetIntensity = 0.3 + Math.random() * 0.5;
        }
        
        if (light.flickering) {
            if (now < light.flickerTime) {
                light.intensity = light.targetIntensity + Math.sin(now * 0.05) * 0.2;
            } else {
                light.flickering = false;
                light.intensity = 1.0;
                light.nextFlicker = now + Math.random() * 8000 + 4000;
            }
        }
        
        return light.intensity;
    }
};

// Função para gerar tiles de grama (apenas para mapa 1)
function generateGrassTiles(mapWidth, mapHeight, tileSize) {
    const tiles = [];
    const types = ['grama000', 'grama001', 'grama002', 'grama003', 'grama004'];
    
    for (let y = 0; y < mapHeight; y += tileSize) {
        for (let x = 0; x < mapWidth; x += tileSize) {
            const randomType = types[Math.floor(Math.random() * types.length)];
            tiles.push({
                type: randomType,
                x: x,
                y: y
            });
        }
    }
    
    return tiles;
}

// Sistema de Mapas
const maps = [
    {
        name: "Maconhão",
        subtitle: "Tutorial de movimento",
        width: 1920,
        height: 1080,
        enemies: [],
        tiles: generateGrassTiles(1920, 1080, 120),
        trees: [
            // Árvores do mapa original
            {type: 'arvore001', x: 300, y: 150},
            {type: 'arvore002', x: 1400, y: 120},
            {type: 'arvore003', x: 150, y: 700},
            {type: 'arvore004', x: 1600, y: 750},
            {type: 'arvorebloco001', x: 700, y: 50},
            {type: 'arvore002', x: 450, y: 850},
            {type: 'arvore001', x: 1200, y: 880},
            {type: 'arvore003', x: 950, y: 100},
            {type: 'arvore004', x: 100, y: 400},
            {type: 'arvore001', x: 200, y: 180},
            {type: 'arvore002', x: 1580, y: 130},
            {type: 'arvore003', x: 280, y: 780},
            {type: 'arvore004', x: 1480, y: 830},
            {type: 'arvore001', x: 1550, y: 850},
            
            // Barreira de árvores no lado esquerdo
            {type: 'arvore002', x: -80, y: -30},
            {type: 'arvore001', x: -60, y: 120},
            {type: 'arvore003', x: -90, y: 270},
            {type: 'arvore004', x: -70, y: 400},
            {type: 'arvorebloco001', x: -120, y: 550},
            {type: 'arvore002', x: -85, y: 730},
            {type: 'arvore001', x: -65, y: 880},
            {type: 'arvore003', x: -95, y: 1000},
            
            // Barreira de árvores no lado direito (com buraco para passagem)
            {type: 'arvore001', x: 1820, y: -50},
            {type: 'arvore002', x: 1850, y: 100},
            {type: 'arvore003', x: 1830, y: 250},
            {type: 'arvore004', x: 1860, y: 380},
            // BURACO - sem árvores entre Y: 490-650 (160 pixels de espaço)
            {type: 'arvore001', x: 1840, y: 720},
            {type: 'arvore002', x: 1810, y: 850},
            {type: 'arvore003', x: 1870, y: 970},
            {type: 'arvore004', x: 1820, y: 1090}
        ],
        streetLights: [
            {type: 'poste000', x: 960, y: 780, rotation: 0, lightRadius: 100, id: 'post3'},
            {type: 'poste001', x: 1400, y: 540, rotation: 0, lightRadius: 100, id: 'post4'}
        ],
        objects: [
            {type: 'caixadeluz', x: 1750, y: 560, rotation: 0}
        ],
        walls: [
            // Paredes invisíveis para colisão apenas
            {x: 0, y: 0, w: 1920, h: 20, invisible: true},
            {x: 0, y: 1060, w: 1920, h: 20, invisible: true},
            {x: 0, y: 20, w: 20, h: 1040, invisible: true},
            {x: 1900, y: 20, w: 20, h: 1040, invisible: true}
        ],
        lights: [],
        shadows: [],
        playerStart: {x: 200, y: 300},
        playerStartEscape: {x: 1700, y: 540},
        exit: {x: 1800, y: 490, w: 80, h: 100},
        direction: 'right'
    },
    {
        name: "Eixão da Morte",
        subtitle: "Túnel sob as pistas",
        width: 3000,
        height: 868,
        enemies: [],
        trees: [],
        streetLights: [],
        objects: [],
        walls: [
            // ============ TÚNEL EM FORMATO U - PAREDES VISÍVEIS ============
            // Vou construir o túnel em forma de U usando paredes cinzas normais
            
            // ÁREA 1: Entrada livre (X: 0-380)
            // Player pode andar livre até chegar na entrada do túnel
            
            // ÁREA 2: Rampa de descida (X: 380-420)
            // Paredes que forçam descida em diagonal
            {x: 415, y: 80, w: 40, h: 150, invisible: false},  // Parede superior da rampa
            {x: 380, y: 600, w: 40, h: 188, invisible: false}, // Parede inferior da rampa
            
            // PAREDE VERTICAL ESQUERDA - bloqueia entrada lateral do túnel
            {x: 0, y: 190, w: 335, h: 340, invisible: false},  // Parede de X=0 até X=335, Y=190 até Y=530
            
            // ÁREA 3: Túnel horizontal inferior (X: 420-2800)
            // Corredor horizontal no fundo
            {x: 445, y: 80, w: 2340, h: 380, invisible: false},   // Parede superior do túnel (REDUZIDA: w=2340 ao invés de 2355)
            {x: 0, y: 530, w: 3000, h: 258, invisible: false},    // Parede inferior do túnel (SUBIU 70px: Y=600→530)
            
            // PAREDE VERTICAL DIREITA - bloqueia saída lateral do túnel
            {x: 2855, y: 190, w: 335, h: 340, invisible: false}, // Parede direita: X=2665 até X=3000 (335px largura)
            // CORREDOR LIVRE: Y = 460-600 (140px de altura para passar)
            
            // ÁREA 4: Rampa de subida (X: 2800-2850) 
            // Paredes que forçam subida em diagonal
            {x: 2855, y: 80, w: 50, h: 150, invisible: false},  // Parede superior da rampa
            {x: 2855, y: 600, w: 50, h: 188, invisible: false}, // Parede inferior da rampa
            
            // ÁREA 5: Saída livre (X: 2850-3000)
            // Player pode andar livre após sair do túnel
            
            // Bordas do mapa
            {x: 0, y: 0, w: 3000, h: 80, invisible: true},
            {x: 0, y: 788, w: 3000, h: 80, invisible: true},
            {x: 0, y: 0, w: 20, h: 868, invisible: true},
            {x: 2980, y: 0, w: 20, h: 868, invisible: true}
        ],
        lights: [],
        shadows: [],
        playerStart: {x: 100, y: 100},
        playerStartEscape: {x: 2900, y: 190},
        exit: {x: 2950, y: 80, w: 50, h: 100},
        direction: 'right',
        hasLayers: true
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
        trees: [],
        streetLights: [],
        objects: [],
        walls: [
            {x: 150, y: 100, w: 120, h: 150},
            {x: 350, y: 350, w: 120, h: 150},
            {x: 550, y: 150, w: 120, h: 100}
        ],
        lights: [],
        shadows: [],
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
        trees: [],
        streetLights: [],
        objects: [],
        walls: [
            {x: 80, y: 150, w: 120, h: 60},
            {x: 400, y: 150, w: 120, h: 60},
            {x: 80, y: 300, w: 120, h: 60},
            {x: 400, y: 300, w: 120, h: 60},
            {x: 80, y: 450, w: 120, h: 60},
            {x: 400, y: 450, w: 120, h: 60}
        ],
        lights: [],
        shadows: [],
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
        trees: [],
        streetLights: [],
        objects: [],
        walls: [
            {x: 80, y: 120, w: 160, h: 160},
            {x: 360, y: 120, w: 160, h: 160},
            {x: 80, y: 500, w: 160, h: 160},
            {x: 360, y: 500, w: 160, h: 160}
        ],
        lights: [],
        shadows: [],
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
        trees: [],
        streetLights: [],
        objects: [],
        walls: [
            {x: 120, y: 200, w: 140, h: 80},
            {x: 340, y: 200, w: 140, h: 80},
            {x: 120, y: 400, w: 140, h: 80},
            {x: 340, y: 400, w: 140, h: 80}
        ],
        lights: [],
        shadows: [],
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

// Consolidar variáveis de loading
const spritesLoaded = {
    madmax: 0,
    faquinha: 0,
    morcego: 0,
    caveirinha: 0,
    janis: 0,
    chacal: 0
};

// Audio com melhor tratamento de erro
const audio = {
    inicio: null,
    fuga: null,
    creditos: null,
    failedToLoad: false
};

// Funções auxiliares
function isInShadow(x, y) {
    const map = maps[gameState.currentMap];
    
    if (map.trees) {
        for (let tree of map.trees) {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                let shadowRadius = tree.type === 'arvorebloco001' ? 
                    treeAsset.width * 0.35 : treeAsset.width * 0.5;
                
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
    
    for (let wall of map.walls) {
        if (checkRectCollision(testEntity, wall)) {
            return true;
        }
    }
    
    if (map.trees) {
        for (let tree of map.trees) {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                const trunkCollision = {
                    x: tree.x + treeAsset.width * 0.35,
                    y: tree.y + treeAsset.height * 0.75,
                    w: treeAsset.width * 0.3,
                    h: treeAsset.height * 0.2
                };
                
                if (checkRectCollision(testEntity, trunkCollision)) {
                    return true;
                }
            }
        }
    }
    
    if (map.streetLights) {
        for (let light of map.streetLights) {
            const lightAsset = assets[light.type];
            if (lightAsset && lightAsset.loaded) {
                const postCollision = {
                    x: light.x + lightAsset.width * 0.25,
                    y: light.y + lightAsset.height * 0.8,
                    w: lightAsset.width * 0.5,
                    h: lightAsset.height * 0.2
                };
                
                if (checkRectCollision(testEntity, postCollision)) {
                    return true;
                }
            }
        }
    }
    
    // Verificar colisão com objetos
    if (map.objects) {
        for (let obj of map.objects) {
            const objAsset = assets[obj.type];
            if (objAsset && objAsset.loaded) {
                const objCollision = {
                    x: obj.x,
                    y: obj.y,
                    w: objAsset.width,
                    h: objAsset.height
                };
                
                if (checkRectCollision(testEntity, objCollision)) {
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

function renderRotatedObject(obj, assetKey, visibleArea) {
    const asset = assets[assetKey];
    if (!asset || !asset.loaded) return;
    
    if (obj.x + asset.width < visibleArea.left || 
        obj.x > visibleArea.right ||
        obj.y + asset.height < visibleArea.top || 
        obj.y > visibleArea.bottom) return;
    
    ctx.save();
    
    const centerX = obj.x + asset.width / 2;
    const centerY = obj.y + asset.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation || 0) * Math.PI / 180);
    
    ctx.drawImage(
        asset.img,
        -asset.width / 2,
        -asset.height / 2,
        asset.width,
        asset.height
    );
    
    ctx.restore();
}

// Classe Enemy
class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.type = type;
        this.width = 46;
        this.height = 46;
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
    
    audio.inicio.onerror = () => {
        console.error('Erro ao carregar música de início');
        audio.failedToLoad = true;
    };
    
    audio.fuga.onerror = () => {
        console.error('Erro ao carregar música de fuga');
        audio.failedToLoad = true;
    };
}

function playMusic(phase) {
    if (audio.failedToLoad) {
        console.warn('Áudio falhou ao carregar - continuando sem música');
        return;
    }
    
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    if (phase === 'inicio' && audio.inicio) {
        audio.inicio.play().catch(e => {
            console.warn('Não foi possível tocar música:', e);
            audio.failedToLoad = true;
        });
        gameState.currentMusic = audio.inicio;
        gameState.musicPhase = 'inicio';
    } else if (phase === 'fuga' && audio.fuga) {
        audio.fuga.play().catch(e => {
            console.warn('Não foi possível tocar música:', e);
            audio.failedToLoad = true;
        });
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
    
    const validPos = findValidSpawnPosition(corner.x, corner.y, 46, 46);
    
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
        const validPos = findValidSpawnPosition(enemyData.x, enemyData.y, 46, 46);
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
        }
    }
    
    if (map.lixeira && checkRectCollision(player, map.lixeira)) {
        if (!gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            gameState.lastEnemySpawn = Date.now();
            playMusic('fuga');
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
                // TODO: Implementar boss fight
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

// Funções de renderização
function renderTiles(map, visibleArea) {
    if (!map.tiles) return;
    
    map.tiles.forEach(tile => {
        const tileAsset = assets[tile.type];
        if (tileAsset && tileAsset.loaded) {
            if (tile.x + tileAsset.width > visibleArea.left && 
                tile.x < visibleArea.right &&
                tile.y + tileAsset.height > visibleArea.top && 
                tile.y < visibleArea.bottom) {
                
                const x = Math.floor(tile.x);
                const y = Math.floor(tile.y);
                
                ctx.drawImage(
                    tileAsset.img, 
                    0, 0, 120, 120,
                    x, y, 121, 121
                );
            }
        }
    });
}

function renderEixaoLayer1(map) {
    if (gameState.currentMap === 1 && assets.eixaoCamada1.loaded) {
        ctx.drawImage(assets.eixaoCamada1.img, 0, 0);
    }
}

function renderEixaoLayer2(map) {
    if (gameState.currentMap === 1 && assets.eixaoCamada2.loaded) {
        ctx.drawImage(assets.eixaoCamada2.img, 0, 0);
    }
}

function renderCampo(map) {
    if (gameState.currentMap === 0 && assets.campo.loaded) {
        const campoX = (map.width - 800) / 2;
        const campoY = (map.height - 462) / 2;
        ctx.drawImage(assets.campo.img, campoX, campoY);
    }
}

function renderCampoTraves() {
    if (gameState.currentMap === 0 && assets.campoTraves.loaded) {
        const campoX = (maps[0].width - 800) / 2;
        const campoY = (maps[0].height - 462) / 2;
        ctx.drawImage(assets.campoTraves.img, campoX, campoY);
    }
}

function renderTrees(map, visibleArea, layer = 'bottom') {
    if (!map.trees) return;
    
    map.trees.forEach(tree => {
        const treeAsset = assets[tree.type];
        if (treeAsset && treeAsset.loaded) {
            if (tree.x + treeAsset.width > visibleArea.left && 
                tree.x < visibleArea.right &&
                tree.y + treeAsset.height > visibleArea.top && 
                tree.y < visibleArea.bottom) {
                
                if (layer === 'bottom') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(tree.x, tree.y + treeAsset.height * 0.7, treeAsset.width, treeAsset.height * 0.3);
                    ctx.clip();
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    ctx.restore();
                } else if (layer === 'top') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(tree.x, tree.y, treeAsset.width, treeAsset.height * 0.75);
                    ctx.clip();
                    
                    const playerUnderTree = player.x + player.width > tree.x &&
                                          player.x < tree.x + treeAsset.width &&
                                          player.y + player.height > tree.y &&
                                          player.y < tree.y + treeAsset.height * 0.75;
                    
                    if (playerUnderTree) {
                        ctx.globalAlpha = 0.7;
                    }
                    
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    ctx.restore();
                }
            }
        }
    });
}

function renderStreetLights(map, visibleArea) {
    if (!map.streetLights) return;
    
    map.streetLights.forEach(light => {
        renderRotatedObject(light, light.type, visibleArea);
    });
}

function renderObjects(map, visibleArea) {
    if (!map.objects) return;
    
    map.objects.forEach(obj => {
        renderRotatedObject(obj, obj.type, visibleArea);
    });
}

function renderFieldShadow(map) {
    if (gameState.currentMap === 0) {
        const campoX = (map.width - 800) / 2;
        const campoY = (map.height - 462) / 2;
        const centerX = campoX + 400;
        const centerY = campoY + 231;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 450
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.45)');  
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');  
        gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');  
        gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');  
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            centerX - 450,
            centerY - 450,
            900,
            900
        );
        
        const cornerGradient1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 400);
        cornerGradient1.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        cornerGradient1.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        cornerGradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGradient1;
        ctx.fillRect(0, 0, 400, 400);
        
        const cornerGradient2 = ctx.createRadialGradient(map.width, 0, 0, map.width, 0, 400);
        cornerGradient2.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        cornerGradient2.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        cornerGradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGradient2;
        ctx.fillRect(map.width - 400, 0, 400, 400);
        
        const cornerGradient3 = ctx.createRadialGradient(0, map.height, 0, 0, map.height, 400);
        cornerGradient3.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        cornerGradient3.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        cornerGradient3.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGradient3;
        ctx.fillRect(0, map.height - 400, 400, 400);
        
        const cornerGradient4 = ctx.createRadialGradient(map.width, map.height, 0, map.width, map.height, 400);
        cornerGradient4.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        cornerGradient4.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        cornerGradient4.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGradient4;
        ctx.fillRect(map.width - 400, map.height - 400, 400, 400);
    }
}

function renderShadows(map, visibleArea) {
    if (map.trees) {
