// init-fix.js - Corretor de problemas de inicialização
// Adicione este arquivo ANTES do main.js no HTML

console.log('🔧 Aplicando correções de inicialização...');

// Garantir namespace
window.MadNight = window.MadNight || {};
MadNight.game = MadNight.game || {};
MadNight.config = MadNight.config || {};

// Garantir arrays e objetos essenciais
MadNight.game.keys = MadNight.game.keys || {};
MadNight.game.enemies = MadNight.game.enemies || [];
MadNight.game.projectiles = MadNight.game.projectiles || [];
MadNight.game.maps = MadNight.game.maps || [];

// Criar alias global para keys (compatibilidade)
window.keys = MadNight.game.keys;

// Garantir gameState
MadNight.gameState = MadNight.gameState || {
    currentMap: 0,
    deaths: 0,
    phase: 'infiltration',
    dashUnlocked: false,
    bombPlaced: false,
    pedalPower: 4,
    maxPedalPower: 4,
    lastRecharge: Date.now(),
    musicPhase: 'inicio',
    currentMusic: null,
    lastEnemySpawn: 0,
    spawnCorner: 0,
    lastFrameTime: 0
};

// Garantir player
MadNight.game.player = MadNight.game.player || {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3.6,
    direction: 'right',
    frame: 0,
    sprites: [],
    isDead: false,
    isDashing: false,
    inShadow: false
};

// Criar função init se não existir
if (!MadNight.game.init) {
    MadNight.game.init = function() {
        console.log('🎮 Inicializando Mad Night (via init-fix)...');
        
        // Canvas
        MadNight.game.canvas = document.getElementById('gameCanvas');
        if (!MadNight.game.canvas) {
            console.error('Canvas não encontrado!');
            return;
        }
        
        MadNight.game.ctx = MadNight.game.canvas.getContext('2d');
        if (!MadNight.game.ctx) {
            console.error('Contexto 2D não disponível!');
            return;
        }
        
        // Configurar canvas
        MadNight.game.canvas.width = MadNight.config.canvas?.width || 1920;
        MadNight.game.canvas.height = MadNight.config.canvas?.height || 1080;
        MadNight.game.ctx.imageSmoothingEnabled = false;
        
        // Câmera
        MadNight.game.camera = {
            x: 0,
            y: 0,
            width: MadNight.config.camera?.width || 960,
            height: MadNight.config.camera?.height || 540,
            zoom: MadNight.config.camera?.zoom || 2
        };
        
        console.log('✅ Canvas configurado:', {
            width: MadNight.game.canvas.width,
            height: MadNight.game.canvas.height,
            camera: MadNight.game.camera
        });
        
        // Carregar primeiro mapa se a função existir
        if (typeof MadNight.game.loadMap === 'function') {
            MadNight.game.loadMap(0);
        } else {
            console.warn('Função loadMap não encontrada');
            // Posição inicial do player
            MadNight.game.player.x = 100;
            MadNight.game.player.y = 300;
        }
        
        // Esconder loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        // Mostrar canvas
        MadNight.game.canvas.style.display = 'block';
        
        // Iniciar game loop se existir
        if (typeof MadNight.game.gameLoop === 'function') {
            console.log('Iniciando game loop...');
            MadNight.game.gameLoop();
        } else if (typeof MadNight.game.update === 'function' && typeof MadNight.game.draw === 'function') {
            console.log('Criando game loop básico...');
            MadNight.game.gameLoop = function() {
                MadNight.game.update();
                MadNight.game.draw();
                requestAnimationFrame(MadNight.game.gameLoop);
            };
            MadNight.game.gameLoop();
        } else {
            console.error('Funções update/draw não encontradas!');
            // Game loop mínimo de emergência
            function emergencyLoop() {
                if (MadNight.game.ctx) {
                    // Limpar tela
                    MadNight.game.ctx.fillStyle = '#000';
                    MadNight.game.ctx.fillRect(0, 0, MadNight.game.canvas.width, MadNight.game.canvas.height);
                    
                    // Mostrar mensagem
                    MadNight.game.ctx.fillStyle = '#f00';
                    MadNight.game.ctx.font = '20px Arial';
                    MadNight.game.ctx.fillText('MODO EMERGÊNCIA - Verificar console', 50, 50);
                    
                    // Desenhar player
                    if (MadNight.game.player) {
                        MadNight.game.ctx.fillStyle = '#f00';
                        MadNight.game.ctx.fillRect(
                            MadNight.game.player.x * 2,
                            MadNight.game.player.y * 2,
                            MadNight.game.player.width * 2,
                            MadNight.game.player.height * 2
                        );
                    }
                }
                requestAnimationFrame(emergencyLoop);
            }
            emergencyLoop();
        }
    };
}

// Criar gameLoop se não existir
if (!MadNight.game.gameLoop) {
    MadNight.game.gameLoop = function() {
        if (MadNight.game.update) MadNight.game.update();
        if (MadNight.game.draw) MadNight.game.draw();
        requestAnimationFrame(MadNight.game.gameLoop);
    };
}

// Criar update mínimo se não existir
if (!MadNight.game.update) {
    MadNight.game.update = function() {
        // Movimento básico do player
        if (MadNight.game.keys['ArrowUp']) MadNight.game.player.y -= MadNight.game.player.speed;
        if (MadNight.game.keys['ArrowDown']) MadNight.game.player.y += MadNight.game.player.speed;
        if (MadNight.game.keys['ArrowLeft']) MadNight.game.player.x -= MadNight.game.player.speed;
        if (MadNight.game.keys['ArrowRight']) MadNight.game.player.x += MadNight.game.player.speed;
        
        // Limitar aos bounds
        const mapWidth = MadNight.game.maps[0]?.width || 1920;
        const mapHeight = MadNight.game.maps[0]?.height || 1080;
        MadNight.game.player.x = Math.max(0, Math.min(mapWidth - MadNight.game.player.width, MadNight.game.player.x));
        MadNight.game.player.y = Math.max(0, Math.min(mapHeight - MadNight.game.player.height, MadNight.game.player.y));
    };
}

// Criar draw mínimo se não existir
if (!MadNight.game.draw) {
    MadNight.game.draw = function() {
        const ctx = MadNight.game.ctx;
        if (!ctx) return;
        
        // Limpar
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, MadNight.game.canvas.width, MadNight.game.canvas.height);
        
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, MadNight.game.canvas.width, MadNight.game.canvas.height);
        
        // Player (quadrado vermelho)
        ctx.fillStyle = MadNight.game.player.isDead ? '#800' : '#f00';
        ctx.fillRect(
            MadNight.game.player.x * 2,
            MadNight.game.player.y * 2,
            MadNight.game.player.width * 2,
            MadNight.game.player.height * 2
        );
        
        // UI básica
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('Mad Night v1.40 - Use as setas', 20, 30);
        ctx.fillText(`Posição: ${Math.floor(MadNight.game.player.x)}, ${Math.floor(MadNight.game.player.y)}`, 20, 50);
    };
}

console.log('✅ Correções aplicadas!');
