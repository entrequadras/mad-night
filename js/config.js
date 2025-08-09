==================================================
ARQUIVO 1/10: index.html (salvar na raiz do projeto)
==================================================
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mad Night v1.40 - Estrutura Modular</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: 'Press Start 2P', monospace;
        }
        
        #gameCanvas {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            border: 2px solid #333;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <!-- Módulos do jogo na ordem correta de dependências -->
    <script src="js/config.js"></script>
    <script src="js/assets.js"></script>
    <script src="js/audio.js"></script>
    <script src="js/collision.js"></script>
    <script src="js/lighting.js"></script>
    <script src="js/camera.js"></script>
    <script src="js/projectiles.js"></script>
    <script src="js/enemy.js"></script>
    <script src="js/player.js"></script>
    <script src="js/traffic.js"></script>
    <script src="js/maps.js"></script>
    <script src="js/renderer.js"></script>
    <script src="js/ui.js"></script>
    <script src="js/game.js"></script>
    <script src="js/main.js"></script>
</body>
</html>

==================================================
ARQUIVO 2/10: js/config.js
==================================================
// Mad Night v1.40 - Estrutura Modular
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

window.MadNight.config = MadNight.config;
