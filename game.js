console.log('Mad Night v1.9.40 - Debug Clean');

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
    version: 'v1.9.40 - Debug Clean'
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
assets.caixadeluz.img.src = 'assets/objects/caixadeluz.png';
assets.caixadeluz.img.onload = () => { assets.caixadeluz.loaded = true; };
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

// Função para gerar tiles de grama
function generateGrassTiles(mapWidth, mapHeight, tileSize) {
    const tiles = [];
    const types = ['grama000', 'grama001', 'grama002', 'grama003', 'grama004'];
    for (let y = 0; y < mapHeight; y += tileSize) {
        for (let x = 0; x < mapWidth; x += tileSize) {
            const randomType = types[Math.floor(Math.random() * types.length)];
            tiles.push({ type: randomType, x: x, y: y });
        }
    }
    return tiles;
}

// Sistema de Mapas
const maps = [
    {
        name: "Maconhão",
        subtitle: "Tutorial de movimento",
        width: 1920, height: 1080,
        enemies: [],
        tiles: generateGrassTiles(1920, 1080, 120),
        trees: [
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
            {type: 'arvore002', x: -80, y: -30},
            {type: 'arvore001', x: -60, y: 120},
            {type: 'arvore003', x: -90, y: 270},
            {type: 'arvore004', x: -70, y: 400},
            {type: 'arvorebloco001', x: -120, y: 550},
            {type: 'arvore002', x: -85, y: 730},
            {type: 'arvore001', x: -65, y: 880},
            {type: 'arvore003', x: -95, y: 1000},
            {type: 'arvore001', x: 1820, y: -50},
            {type: 'arvore002', x: 1850, y: 100},
            {type: 'arvore003', x: 1830, y: 250},
            {type: 'arvore004', x: 1860, y: 380},
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
            {x: 0, y: 0, w: 1920, h: 20, invisible: true},
            {x: 0, y: 1060, w: 1920, h: 20, invisible: true},
            {x: 0, y: 20, w: 20, h: 1040, invisible: true},
            {x: 1900, y: 20, w: 20, h: 1040, invisible: true}
        ],
        lights: [], shadows: [],
        playerStart: {x: 200, y: 300},
        playerStartEscape: {x: 1700, y: 540},
        exit: {x: 1800, y: 490, w: 80, h: 100},
        direction: 'right'
    },
    {
        name: "Eixão da Morte",
        subtitle: "Túnel sob as pistas",
        width: 3000, height: 868,
        enemies: [], trees: [], streetLights: [], objects: [],
        walls: [
            // BORDAS
            {x: 0, y: 0, w: 3000, h: 80, invisible: true},
            {x: 0, y: 788, w: 3000, h: 80, invisible: true},
            {x: 0, y: 0, w: 20, h: 868, invisible: true},
            {x: 2980, y: 0, w: 20, h: 868, invisible: true},
            
            // PAREDES DO TÚNEL - VERSÃO SIMPLES PARA DEBUG
            // Bloquear tudo entre X=380 e X=2845 EXCETO o túnel
            {x: 380, y: 80, w: 2465, h: 708, invisible: true}
        ],
        lights: [], shadows: [],
        playerStart: {x: 200, y: 90},
        playerStartEscape: {x: 2850, y: 190},
        exit: {x: 2950, y: 80, w: 50, h: 100},
        direction: 'right',
        hasLayers: true
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

// Variáveis de loading
const spritesLoaded = {
    madmax: 0, faquinha: 0, morcego: 0, caveirinha: 0, janis: 0, chacal: 0
};

// Audio
const audio = {
    inicio: null, fuga: null, creditos: null, failedToLoad: false
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
    const testEntity = { x: newX, y: newY, width: entity.width, height: entity.height };
    
    for (let wall of map.walls) {
        if (checkRectCollision(testEntity, wall)) {
            return true;
        }
    }
    return false;
}

// Classe Enemy básica
class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x; this.y = y; this.type = type;
        this.width = 46; this.height = 46; this.speed = 2;
        this.direction = 'down'; this.frame = 0; this.state = 'patrol';
        this.isDead = false; this.sprites = [];
    }
    
    update() {
        this.frame = Date.now() % 400 < 200 ? 0 : 1;
    }
    
    getSprite() {
        return this.sprites[0] || null;
    }
}

// Funções do jogo
function loadAudio() {
    audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
    audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
    audio.inicio.loop = true;
    audio.fuga.loop = true;
}

function playMusic(phase) {
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    if (phase === 'inicio' && audio.inicio) {
        audio.inicio.play().catch(() => {});
        gameState.currentMusic = audio.inicio;
    }
}

function loadMap(mapIndex) {
    const map = maps[mapIndex];
    if (!map) return;
    
    enemies.length = 0;
    projectiles.length = 0;
    
    player.x = map.playerStart.x;
    player.y = map.playerStart.y;
    player.isDead = false;
    player.isDashing = false;
}

function killPlayer() {
    if (player.isDead) return;
    player.isDead = true;
    gameState.deaths++;
    
    setTimeout(() => {
        if (gameState.deaths >= 5) {
            gameState.deaths = 0;
            gameState.currentMap = 0;
            loadMap(0);
        } else {
            loadMap(gameState.currentMap);
        }
    }, 2000);
}

// Input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'n' || e.key === 'N') {
        gameState.currentMap = (gameState.currentMap + 1) % maps.length;
        loadMap(gameState.currentMap);
    }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Update
function update() {
    if (player.isDead) return;
    
    let dx = 0, dy = 0;
    if (keys['ArrowUp']) { dy = -1; player.direction = 'up'; }
    if (keys['ArrowDown']) { dy = 1; player.direction = 'down'; }
    if (keys['ArrowLeft']) { dx = -1; player.direction = 'left'; }
    if (keys['ArrowRight']) { dx = 1; player.direction = 'right'; }
    
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
    
    // Atualizar câmera
    const map = maps[gameState.currentMap];
    camera.x = player.x + player.width/2 - camera.width/2;
    camera.y = player.y + player.height/2 - camera.height/2;
    camera.x = Math.max(0, Math.min(map.width - camera.width, camera.x));
    camera.y = Math.max(0, Math.min(map.height - camera.height, camera.y));
}

// Render functions
function renderDebugWalls(map, visibleArea) {
    map.walls.forEach(wall => {
        if (wall.x + wall.w > visibleArea.left && wall.x < visibleArea.right &&
            wall.y + wall.h > visibleArea.top && wall.y < visibleArea.bottom) {
            
            if (wall.invisible) {
                // Paredes invisíveis em vermelho
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                ctx.strokeStyle = '#f00';
                ctx.lineWidth = 2;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            } else {
                ctx.fillStyle = '#333';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            }
        }
    });
}

function renderDebugPath() {
    if (gameState.currentMap === 1) {
        // Linha verde do caminho
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(200, 90);
        ctx.lineTo(380, 190);
        ctx.lineTo(420, 537);
        ctx.lineTo(2820, 537);
        ctx.lineTo(2845, 190);
        ctx.lineTo(2950, 80);
        ctx.stroke();
    }
}

function renderPlayer() {
    // Player em azul para debug
    ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeStyle = '#00f';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
}

function renderUI() {
    const map = maps[gameState.currentMap];
    
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(map.name, canvas.width/2, 60);
    ctx.fillStyle = '#666';
    ctx.font = '20px Arial';
    ctx.fillText(gameState.version, canvas.width/2, 90);
    
    // Debug info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f0';
    ctx.font = '16px Arial';
    ctx.fillText(`Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`, 20, canvas.height - 60);
    
    if (gameState.currentMap === 1) {
        ctx.fillStyle = '#fff';
        ctx.fillText('VERMELHO = Paredes invisíveis', 20, canvas.height - 40);
        ctx.fillText('VERDE = Caminho esperado', 20, canvas.height - 20);
    }
}

// Draw
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const map = maps[gameState.currentMap];
    
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    
    const visibleArea = {
        left: camera.x - 100, right: camera.x + camera.width + 100,
        top: camera.y - 100, bottom: camera.y + camera.height + 100
    };
    
    // Render ordem
    if (map.hasLayers && gameState.currentMap === 1 && assets.eixaoCamada1.loaded) {
        ctx.drawImage(assets.eixaoCamada1.img, 0, 0);
    }
    
    renderDebugWalls(map, visibleArea);
    renderDebugPath();
    renderPlayer();
    
    if (map.hasLayers && gameState.currentMap === 1 && assets.eixaoCamada2.loaded) {
        ctx.drawImage(assets.eixaoCamada2.img, 0, 0);
    }
    
    ctx.restore();
    renderUI();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Carregar sprites básicos
for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
    player.sprites[i] = img;
}

// Inicializar
loadAudio();
loadMap(0);
setTimeout(() => playMusic('inicio'), 1000);
gameLoop();

console.log('🎮 Mad Night v1.9.40 - Debug Clean');
console.log('🔍 Versão simplificada para debug');
console.log('🔴 Vermelho = Paredes invisíveis');
console.log('🟢 Verde = Caminho esperado');
console.log('🔵 Azul = Player');
console.log('🎯 Pressione N para Mapa 2!');
