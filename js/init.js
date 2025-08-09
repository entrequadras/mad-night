// init.js - Adicione este arquivo APÓS todos os outros no HTML
// Ele tenta consertar o problema de escopo

console.log('🔧 Tentando consertar escopo das funções...');

// Se as funções principais não existirem, criar versões mínimas
if (typeof window.initGame !== 'function') {
    console.log('Criando initGame...');
    window.initGame = function() {
        console.log('🎮 Iniciando Mad Night (modo de recuperação)');
        
        // Canvas
        window.canvas = document.getElementById('gameCanvas');
        window.ctx = window.canvas.getContext('2d');
        window.ctx.imageSmoothingEnabled = false;
        
        // Configurar tamanho
        window.canvas.width = 1920;
        window.canvas.height = 1080;
        
        // Câmera
        window.camera = {
            x: 0,
            y: 0,
            width: 960,
            height: 540,
            zoom: 2
        };
        
        // Garantir arrays
        window.enemies = window.enemies || [];
        window.projectiles = window.projectiles || [];
        window.keys = window.keys || {};
        
        // Garantir player
        window.player = window.player || {
            x: 100,
            y: 300,
            width: 56,
            height: 56,
            speed: 3.6,
            direction: 'right',
            isDead: false,
            isDashing: false
        };
        
        // Garantir gameState
        window.gameState = window.gameState || {
            currentMap: 0,
            deaths: 0,
            phase: 'infiltration',
            dashUnlocked: false,
            pedalPower: 4,
            maxPedalPower: 4
        };
        
        // Garantir maps
        if (!window.maps || window.maps.length === 0) {
            window.maps = [{
                name: "Mapa de Teste",
                subtitle: "Recuperação",
                width: 1920,
                height: 1080,
                walls: [],
                enemies: [],
                playerStart: {x: 100, y: 300}
            }];
        }
        
        // Carregar mapa
        if (window.loadMap) {
            window.loadMap(0);
        } else {
            window.player.x = 100;
            window.player.y = 300;
        }
        
        // Esconder loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        // Mostrar canvas
        window.canvas.style.display = 'block';
        
        // Iniciar loop
        window.gameLoop();
    };
}

if (typeof window.gameLoop !== 'function') {
    console.log('Criando gameLoop...');
    window.gameLoop = function() {
        if (window.update) window.update();
        if (window.draw) window.draw();
        requestAnimationFrame(window.gameLoop);
    };
}

if (typeof window.update !== 'function') {
    console.log('Criando update...');
    window.update = function() {
        if (!window.player || !window.keys) return;
        
        // Movimento básico
        if (window.keys['ArrowUp']) window.player.y -= window.player.speed;
        if (window.keys['ArrowDown']) window.player.y += window.player.speed;
        if (window.keys['ArrowLeft']) window.player.x -= window.player.speed;
        if (window.keys['ArrowRight']) window.player.x += window.player.speed;
        
        // Limitar ao mapa
        const map = window.maps[window.gameState.currentMap];
        if (map) {
            window.player.x = Math.max(0, Math.min(map.width - window.player.width, window.player.x));
            window.player.y = Math.max(0, Math.min(map.height - window.player.height, window.player.y));
        }
        
        // Atualizar câmera
        if (window.camera) {
            window.camera.x = window.player.x + window.player.width/2 - window.camera.width/2;
            window.camera.y = window.player.y + window.player.height/2 - window.camera.height/2;
        }
        
        // Atualizar inimigos
        if (window.enemies && window.updateEnemies) {
            window.updateEnemies();
        }
    };
}

if (typeof window.draw !== 'function') {
    console.log('Criando draw...');
    window.draw = function() {
        if (!window.ctx) return;
        
        // Limpar
        window.ctx.fillStyle = '#000';
        window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
        
        // Câmera
        window.ctx.save();
        if (window.camera) {
            window.ctx.scale(window.camera.zoom, window.camera.zoom);
            window.ctx.translate(-window.camera.x, -window.camera.y);
        }
        
        // Background
        window.ctx.fillStyle = '#1a1a1a';
        const map = window.maps[window.gameState.currentMap];
        if (map) {
            window.ctx.fillRect(0, 0, map.width, map.height);
        }
        
        // Inimigos
        if (window.enemies) {
            window.enemies.forEach(enemy => {
                window.ctx.fillStyle = enemy.isDead ? '#444' : '#808';
                window.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            });
        }
        
        // Player
        if (window.player) {
            window.ctx.fillStyle = window.player.isDead ? '#800' : '#f00';
            window.ctx.fillRect(window.player.x, window.player.y, window.player.width, window.player.height);
        }
        
        window.ctx.restore();
        
        // UI básica
        window.ctx.fillStyle = '#fff';
        window.ctx.font = '12px Arial';
        window.ctx.fillText('Mad Night v1.40 - Modo Recuperação', 10, 30);
        window.ctx.fillText('Use as setas para mover', 10, 50);
        if (window.gameState) {
            window.ctx.fillText(`Mortes: ${window.gameState.deaths || 0}`, 10, 70);
        }
    };
}

if (typeof window.loadMap !== 'function') {
    console.log('Criando loadMap...');
    window.loadMap = function(index) {
        console.log('Carregando mapa', index);
        if (window.maps && window.maps[index]) {
            const map = window.maps[index];
            if (map.playerStart) {
                window.player.x = map.playerStart.x;
                window.player.y = map.playerStart.y;
            }
        }
    };
}

if (typeof window.killPlayer !== 'function') {
    console.log('Criando killPlayer...');
    window.killPlayer = function() {
        window.player.isDead = true;
        window.gameState.deaths++;
        setTimeout(() => {
            window.player.isDead = false;
            window.loadMap(window.gameState.currentMap);
        }, 2000);
    };
}

if (typeof window.checkRectCollision !== 'function') {
    window.checkRectCollision = function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.w &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.h &&
               obj1.y + obj1.height > obj2.y;
    };
}

if (typeof window.checkWallCollision !== 'function') {
    window.checkWallCollision = function() {
        return false; // Simplificado
    };
}

// Input handlers
if (!window.keysSetup) {
    window.keysSetup = true;
    window.keys = window.keys || {};
    
    window.addEventListener('keydown', (e) => {
        window.keys[e.key] = true;
        if (window.handleDebugKeys) {
            window.handleDebugKeys(e.key);
        }
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        window.keys[e.key] = false;
    });
}

// Tentar inicializar após um pequeno delay
setTimeout(() => {
    console.log('🚀 Tentando inicializar o jogo...');
    if (window.initGame) {
        window.initGame();
    } else {
        console.error('initGame ainda não existe!');
    }
}, 100);

console.log('✅ init.js carregado - modo de recuperação ativo');
