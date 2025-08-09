// config.js - Configurações globais do jogo
console.log('Mad Night v1.40 - Refatorado e Modular');

const CONFIG = {
    // Canvas
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 540,
    ZOOM: 2,
    
    // Player
    PLAYER_WIDTH: 56,
    PLAYER_HEIGHT: 56,
    PLAYER_SPEED: 3.6,
    DASH_DURATION: 150,
    DASH_DISTANCE: 60,
    MAX_PEDAL_POWER: 4,
    PEDAL_RECHARGE_TIME: 6000,
    
    // Enemy
    ENEMY_WIDTH: 46,
    ENEMY_HEIGHT: 46,
    ENEMY_SPEED: 2,
    ENEMY_PATROL_SPEED: 1,
    ENEMY_VISION_RANGE: 150,
    ENEMY_ALERT_VISION_RANGE: 200,
    ENEMY_PATROL_RADIUS: 150,
    
    // Game
    MAX_DEATHS: 5,
    ENEMY_SPAWN_DELAY: 1000,
    ENEMY_REMOVE_DELAY: 3000,
    
    // Audio
    SFX_VOLUME: 0.7,
    MUSIC_VOLUME: 0.5,
    
    // Rendering
    TILE_SIZE: 120,
    SHADOW_ALPHA: 0.5,
    NIGHT_OVERLAY_ALPHA: 0.4,
    
    // Debug
    DEBUG_MODE: false,
    VERSION: 'v1.40'
};

// Estado global do jogo
const gameState = {
    deaths: 0,
    pedalPower: CONFIG.MAX_PEDAL_POWER,
    maxPedalPower: CONFIG.MAX_PEDAL_POWER,
    lastRecharge: Date.now(),
    musicPhase: 'inicio',
    currentMusic: null,
    currentMap: 0,
    phase: 'infiltration',
    dashUnlocked: false,
    bombPlaced: false,
    lastEnemySpawn: 0,
    enemySpawnDelay: CONFIG.ENEMY_SPAWN_DELAY,
    spawnCorner: 0,
    lastFrameTime: 0,
    version: CONFIG.VERSION
};

// Arrays globais
const enemies = [];
const projectiles = [];

// Canvas e contexto
let canvas, ctx, camera;

// Teclas pressionadas
const keys = {};
