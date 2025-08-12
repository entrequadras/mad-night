// Mad Night v1.40 - Estrutura Modular
// main.js - Ponto de entrada e loop principal

(function() {
    'use strict';
    
    // Variáveis do loop principal
    let lastTime = 0;
    let animationId = null;
    let isRunning = false;
    
    // Referência do canvas
    let canvas = null;
    
    // Inicialização
function init() {
    console.log('Mad Night v1.56 - Loading Progressivo');
    console.log('Iniciando...');
    
    // Obter canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    // Configurar canvas
    canvas.width = MadNight.config.canvas.width;
    canvas.height = MadNight.config.canvas.height;
    
    // Inicializar renderer
    MadNight.renderer.init(canvas);
    
    // Inicializar loader
    MadNight.loader.init();
    
    // Mostrar tela de loading
    const ctx = MadNight.renderer.ctx;
    const loadingInterval = setInterval(() => {
        MadNight.loader.renderLoadingScreen(ctx, canvas);
    }, 100);
    
    // Carregar assets iniciais
    MadNight.loader.loadInitial(() => {
        clearInterval(loadingInterval);
        
        // Inicializar jogo após loading
        MadNight.game.init();
        
        // Aguardar fontes e começar
        document.fonts.ready.then(() => {
            console.log('Fontes carregadas!');
            start();
        }).catch(() => {
            console.log('Erro ao carregar fontes, usando fallback');
            start();
        });
    });
}
    
    // Iniciar loop do jogo
    function start() {
        if (isRunning) return;
        
        console.log('Iniciando loop do jogo...');
        isRunning = true;
        lastTime = performance.now();
        gameLoop(lastTime);
    }
    
    // Parar loop do jogo
    function stop() {
        if (!isRunning) return;
        
        console.log('Parando loop do jogo...');
        isRunning = false;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    // Loop principal do jogo
    function gameLoop(currentTime) {
        if (!isRunning) return;
        
        // Calcular delta time
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Limitar delta time para evitar saltos grandes
        const cappedDeltaTime = Math.min(deltaTime, 100);
        
        // Update e render apenas se não estiver pausado
        if (!MadNight.game.isPaused) {
            // Update
            MadNight.game.update(cappedDeltaTime);
        }
        
        // Sempre renderizar (mesmo pausado)
        MadNight.renderer.render();
        
        // Continuar loop
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // Tratamento de visibilidade da página
    function handleVisibilityChange() {
        if (document.hidden) {
            // Página ficou oculta - pausar música
            if (MadNight.audio.currentMusic) {
                MadNight.audio.currentMusic.pause();
            }
        } else {
            // Página ficou visível - retomar música
            if (MadNight.audio.currentMusic) {
                MadNight.audio.currentMusic.play().catch(() => {});
            }
        }
    }
    
    // Tratamento de redimensionamento
    function handleResize() {
        // Manter aspect ratio
        const targetAspect = 16 / 9;
        const windowAspect = window.innerWidth / window.innerHeight;
        
        if (canvas) {
            if (windowAspect > targetAspect) {
                // Window é mais larga
                canvas.style.height = '90vh';
                canvas.style.width = 'auto';
            } else {
                // Window é mais alta
                canvas.style.width = '90vw';
                canvas.style.height = 'auto';
            }
        }
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        // Visibilidade da página
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Redimensionamento
        window.addEventListener('resize', handleResize);
        handleResize(); // Aplicar uma vez no início
        
        // Tecla ESC para pausar
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                MadNight.game.togglePause();
            }
        });
        
        // Prevenir menu de contexto no canvas
        if (canvas) {
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }
    
    // Verificar suporte do navegador
    function checkBrowserSupport() {
        const required = [
            'requestAnimationFrame',
            'cancelAnimationFrame',
            'performance'
        ];
        
        for (let feature of required) {
            if (!(feature in window)) {
                alert(`Seu navegador não suporta ${feature}. Por favor, use um navegador mais recente.`);
                return false;
            }
        }
        
        return true;
    }
    
    // Debug - tornar funções globais para testes
    if (MadNight.config.debug.enableDebugKeys) {
        window.MadNightDebug = {
            start: start,
            stop: stop,
            restart: () => MadNight.game.restart(),
            spawnEnemy: (type) => {
                const player = MadNight.player;
                MadNight.enemies.create(
                    player.x + 100,
                    player.y,
                    type || 'faquinha'
                );
            },
            killAll: () => {
                MadNight.enemies.list.forEach(e => e.die());
            },
            godMode: false,
            toggleGodMode: function() {
                this.godMode = !this.godMode;
                // Sobrescrever função kill do player
                if (this.godMode) {
                    MadNight.player._originalKill = MadNight.player.kill;
                    MadNight.player.kill = () => {
                        console.log('God mode ativo - ignorando morte');
                    };
                } else if (MadNight.player._originalKill) {
                    MadNight.player.kill = MadNight.player._originalKill;
                }
                console.log(`God mode: ${this.godMode ? 'ATIVO' : 'DESATIVADO'}`);
            }
        };
        
        console.log('🔧 Debug mode ativo!');
        console.log('Use window.MadNightDebug para comandos de debug');
    }
    
    // Ponto de entrada
    window.addEventListener('DOMContentLoaded', () => {
        console.log('DOM carregado');
        
        // Verificar suporte do navegador
        if (!checkBrowserSupport()) {
            return;
        }
        
        // Configurar event listeners
        setupEventListeners();
        
        // Inicializar jogo
        init();
    });
    
    // Cleanup ao sair
    window.addEventListener('beforeunload', () => {
        stop();
        
        // Parar áudio
        MadNight.audio.stopMusic();
        
        // Limpar recursos
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });
    
    // Exportar funções principais para debug
    window.MadNightMain = {
        init: init,
        start: start,
        stop: stop,
        isRunning: () => isRunning
    };
    
})();
