// config.js - Configurações globais do jogo

console.log('Mad Night v1.40 - Estrutura Modular');

// Namespace global do jogo
window.MadNight = window.MadNight || {};

// Configurações da câmera e canvas
MadNight.config = {
    // Versão do jogo
    version: 'v1.40',
    versionName: 'Estrutura Modular',
    
    // Configurações de câmera
    camera: {
        width: 960,
        height: 540,
        zoom: 2
    },
    
    // Configurações do canvas
    canvas: {
        get width() {
            return MadNight.config.camera.width * MadNight.config.camera.zoom;
        },
        get height() {
            return MadNight.config.camera.height * MadNight.config.camera.zoom;
        }
    },
    
    // Configurações do player
    player: {
        width: 56,
        height: 56,
        speed: 3.6,
        startPosition: { x: 100, y: 300 },
        dashDuration: 150,
        dashDistance: 60
    },
    
    // Configurações de inimigos
    enemy: {
        width: 46,
        height: 46,
        baseSpeed: 2,
        patrolSpeed: 1,
        visionRange: 150,
        alertVisionRange: 200,
        patrolRadius: 150,
        attackRange: 200,
        attackCooldown: 2000,
        removeDelay: 3000
    },
    
    // Configurações específicas por tipo de inimigo
    enemyTypes: {
        faquinha: {
            speed: 2,
            health: 1
        },
        morcego: {
            speed: 2,
            health: 1
        },
        caveirinha: {
            speed: 2.5,
            health: 1
        },
        janis: {
            speed: 2,
            health: 1,
            isRanged: true
        },
        chacal: {
            speed: 2,
            health: 3,
            invulnerableDuration: 500
        }
    },
    
    // Configurações de gameplay
    gameplay: {
        maxDeaths: 5,
        maxPedalPower: 4,
        pedalRechargeTime: 6000,
        pedalRechargeDelay: 1000,
        escapeEnemySpawnDelay: 1000,
        projectileSpeed: 4
    },
    
    // Configurações de áudio
    audio: {
        sfxVolume: 0.7,
        musicVolume: 0.5
    },
    
    // Configurações de iluminação
    lighting: {
        shadowOpacity: 0.5,
        nightOverlayOpacity: 0.4,
        lightIntensity: 0.4,
        flickerMinTime: 3000,
        flickerMaxTime: 8000
    },
    
    // Configurações do sistema de tráfego
    traffic: {
        mainLanes: {
            minInterval: 6000,
            maxInterval: 12000,
            rushChance: 0.15
        },
        carSpeed: {
            min: 4.5,
            max: 6
        },
        maxCars: 10,
        northSouthLanes: [1305, 1390, 1470, 1550],
        southNorthLanes: [1637, 1706, 1790, 1883]
    },
    
    // Configurações de debug
    debug: {
        showCollisions: false,
        showFPS: false,
        enableDebugKeys: true
    },
    
    // Tamanhos de tiles
    tiles: {
        size: 120
    },
    
    // Cores do jogo
    colors: {
        background: '#1a1a1a',
        nightOverlay: 'rgba(0, 0, 40, 0.4)',
        shadowBase: 'rgba(0, 0, 0, 0.72)',
        lightWarm: 'rgba(255, 200, 100, 0.4)',
        enemyAlert: '#f00',
        playerDash: '#ff0',
        playerDead: '#800',
        phonePrompt: '#ff0',
        bombPrompt: '#ff0',
        escapeExit: '#f00',
        normalExit: '#0f0'
    },
    
    // Configurações de animação
    animation: {
        frameDelay: 150,
        enemyFrameDelay: 400,
        deathFrames: 4
    }
};
// Teste de configuração
console.log('Config carregada:', {
    version: MadNight.config.version,
    canvasSize: `${MadNight.config.canvas.width}x${MadNight.config.canvas.height}`,
    playerSize: `${MadNight.config.player.width}x${MadNight.config.player.height}`
});
