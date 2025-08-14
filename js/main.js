// Mad Night v1.57 - Com Sistema de Menu
// main.js - Ponto de entrada e loop principal

(function() {
    'use strict';
    
    // Variáveis do loop principal
    let lastTime = 0;
    let animationId = null;
    let isRunning = false;
    
    // Referência do canvas
    let canvas = null;
    
    // Estado do aplicativo
    let appState = 'menu'; // 'menu' ou 'game'
    
    // Inicialização
    function init() {
        console.log('Mad Night v1.57 - Sistema de Menu e Rankings');
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
        
        // Inicializar sistemas essenciais
        if (MadNight.assets && MadNight.assets.init) {
            MadNight.assets.init();
        }
        
        // Inicializar stats (para rankings)
        if (MadNight.stats && MadNight.stats.init) {
            MadNight.stats.init();
        }
        
        // Inicializar loader
        if (MadNight.loader && MadNight.loader.init) {
            MadNight.loader.init();
        }
        
        // Mostrar tela de loading
        const ctx = MadNight.renderer.ctx;
        const loadingInterval = setInterval(() => {
            if (MadNight.loader && MadNight.loader.renderLoadingScreen) {
                MadNight.loader.renderLoadingScreen(ctx, canvas);
            }
        }, 100);
        
        // Carregar assets iniciais
if (MadNight.loader && MadNight.loader.loadInitial) {
    MadNight.loader.loadInitial(() => {
        clearInterval(loadingInterval);
        
        // Inicializar e mostrar menu
        if (MadNight.menu && MadNight.menu.init) {
            MadNight.menu.init();
            appState = 'menu';
        }
        
        // Aguardar fontes e começar
        document.fonts.ready.then(() => {
            console.log('Fontes carregadas!');
            start();
        }).catch(() => {
            console.log('Erro ao carregar fontes, usando fallback');
            start();
        });
    });
} else {
    // Fallback se não houver loader
    clearInterval(loadingInterval);
    
    // NÃO INICIALIZAR GAME AQUI! Só assets e menu
    
    // Inicializar assets manualmente
    if (MadNight.assets && MadNight.assets.init) {
        MadNight.assets.init();  // ← ADICIONAR
    }
    
    // Inicializar menu
    if (MadNight.menu && MadNight.menu.init) {
        MadNight.menu.init();
        appState = 'menu';
    }
    
    // Começar
    document.fonts.ready.then(() => {
        start();
    }).catch(() => {
        start();
    });
}
    
    // Iniciar loop do jogo
    function start() {
        if (isRunning) return;
        
        console.log('Iniciando loop principal...');
        isRunning = true;
        lastTime = performance.now();
        gameLoop(lastTime);
    }
    
    // Parar loop do jogo
    function stop() {
        if (!isRunning) return;
        
        console.log('Parando loop principal...');
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

// Update baseado no estado
if (appState === 'menu') {
    if (MadNight.menu && MadNight.menu.active) {
        MadNight.menu.update(cappedDeltaTime); // Update com deltaTime limitado
        
        // Limpar tela e renderizar menu
const ctx = MadNight.renderer.ctx;
if (ctx) {
    MadNight.menu.render(ctx);
}
} else {
    // Menu desativado, mudar para jogo
    appState = 'game';
}
        } else if (appState === 'game') {
            // Update do jogo apenas se não estiver pausado
            if (MadNight.game && !MadNight.game.isPaused) {
                MadNight.game.update(cappedDeltaTime);
            }
            
            // Sempre renderizar (mesmo pausado)
            if (MadNight.renderer && MadNight.renderer.render) {
                MadNight.renderer.render();
            }
        }
        
        // Continuar loop
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // Voltar ao menu
function backToMenu() {
    appState = 'menu';
    if (MadNight.menu) {
        MadNight.menu.active = true;
        MadNight.menu.currentScreen = 'main'; // Voltar para tela principal do menu
        if (MadNight.menu.playMenuMusic) {
            MadNight.menu.playMenuMusic(); // Tocar música do menu
        }
    }
    // Parar o jogo
    if (MadNight.game && MadNight.game.restart) {
        MadNight.game.restart(); // Resetar o jogo para próxima vez
    }
}
    
    // Tratamento de visibilidade da página
    function handleVisibilityChange() {
        if (document.hidden) {
            // Página ficou oculta - pausar música
            if (MadNight.audio && MadNight.audio.currentMusic) {
                MadNight.audio.currentMusic.pause();
            }
        } else {
            // Página ficou visível - retomar música
            if (MadNight.audio && MadNight.audio.currentMusic) {
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
        
        // Tecla ESC para pausar (apenas no jogo)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && appState === 'game') {
                if (MadNight.game && MadNight.game.togglePause) {
                    MadNight.game.togglePause();
                }
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
            backToMenu: backToMenu,
            skipToGame: () => {
                if (MadNight.menu) MadNight.menu.active = false;
                appState = 'game';
                if (MadNight.game) MadNight.game.restart();
            },
            spawnEnemy: (type) => {
                const player = MadNight.player;
                if (player && MadNight.enemies) {
                    MadNight.enemies.create(
                        player.x + 100,
                        player.y,
                        type || 'faquinha'
                    );
                }
            },
            killAll: () => {
                if (MadNight.enemies && MadNight.enemies.list) {
                    MadNight.enemies.list.forEach(e => e.die());
                }
            },
            godMode: false,
            toggleGodMode: function() {
                this.godMode = !this.godMode;
                // Sobrescrever função kill do player
                if (this.godMode && MadNight.player) {
                    MadNight.player._originalKill = MadNight.player.kill;
                    MadNight.player.kill = () => {
                        console.log('God mode ativo - ignorando morte');
                    };
                } else if (MadNight.player && MadNight.player._originalKill) {
                    MadNight.player.kill = MadNight.player._originalKill;
                }
                console.log(`God mode: ${this.godMode ? 'ATIVO' : 'DESATIVADO'}`);
            },
            forceVictory: () => {
                if (MadNight.game && MadNight.game.handleVictory) {
                    // Simular vitória para testar rankings
                    MadNight.game.handleVictory();
                }
            }
        };
        
        console.log('🔧 Debug mode ativo!');
        console.log('Use window.MadNightDebug para comandos de debug');
        console.log('Comandos disponíveis:');
        console.log('  .skipToGame() - Pular menu e ir direto ao jogo');
        console.log('  .backToMenu() - Voltar ao menu');
        console.log('  .forceVictory() - Forçar vitória (testar rankings)');
        console.log('  .toggleGodMode() - Ativar/desativar god mode');
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
        if (MadNight.audio && MadNight.audio.stopMusic) {
            MadNight.audio.stopMusic();
        }
        
        // Limpar recursos
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });
    
    // Exportar funções principais
    window.MadNightMain = {
    init: init,
    start: start,
    stop: stop,
    backToMenu: backToMenu,
    startGame: function() {  // ← ADICIONAR ESTA FUNÇÃO
        // Inicializar o game apenas quando clicar em JOGAR
        if (MadNight.game && !MadNight.game.state.initialized) {
            MadNight.game.init();
        }
        appState = 'game';
    },
    isRunning: () => isRunning,
    getState: () => appState
};
    
})();
