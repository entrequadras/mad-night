// ui.js - Interface do Usuário (Revisão Alpha-07 - Integração com Menu)

(function() {
    'use strict';
    
    // Variáveis internas
    let messageText = '';
    let messageTime = 0;
    let messageDuration = 3000;
    let mapNameText = '';
    let mapNameTime = 0;
    let mapNameDuration = 3000;
    let deathMessageText = '';
    let deathMessageTime = 0;
    
    // Criar módulo UI
    MadNight.ui = {
        // Inicializar UI
        init: function() {
            console.log('Sistema de UI inicializado');
        },
        
        // Update da UI (para mensagens temporárias)
        update: function(deltaTime) {
            // Atualizar timers de mensagens
            if (messageTime > 0) {
                messageTime -= deltaTime;
            }
            if (mapNameTime > 0) {
                mapNameTime -= deltaTime;
            }
            if (deathMessageTime > 0) {
                deathMessageTime -= deltaTime;
            }
        },
        
        // Renderizar UI completa
        render: function(ctx) {
            if (!ctx) return;
            
            // NÃO renderizar UI se o menu estiver ativo
            if (MadNight.menu && MadNight.menu.active) {
                return;
            }
            
            // Salvar contexto
            ctx.save();
            
            // Resetar transformações
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Obter referências necessárias
            const map = MadNight.maps ? MadNight.maps.getCurrentMap() : null;
            const gameState = MadNight.game ? MadNight.game.state : null;
            const player = MadNight.player;
            const config = MadNight.config;
            
            if (!map || !gameState) {
                ctx.restore();
                return;
            }
            
            // Renderizar componentes da UI
            this.renderMapTitle(ctx, map, gameState);
            this.renderGameStatus(ctx, gameState);
            this.renderLives(ctx, gameState, config);
            this.renderPedalPower(ctx, gameState);
            this.renderInfoTexts(ctx, map, gameState, player);
            
            // Debug info
            if (config && config.debug && config.debug.showCollisions) {
                this.renderDebugInfo(ctx, player);
            }
            
            // Mensagem temporária
            if (messageTime > 0) {
                this.renderMessage(ctx, messageText);
            }
            
            // Nome do mapa (ao entrar)
            if (mapNameTime > 0) {
                this.renderMapNameOverlay(ctx, mapNameText);
            }
            
            // Mensagem de morte (separada)
            if (deathMessageTime > 0) {
                this.renderDeathMessageOverlay(ctx, deathMessageText);
            }
            
            // Instruções iniciais
            if (gameState && gameState.currentMap === 0 && player && !player.lastMove) {
                this.renderInstructions(ctx);
            }
            
            // Pausa
            if (gameState && gameState.isPaused) {
                this.renderPauseOverlay(ctx);
            }
            
            // Restaurar contexto
            ctx.restore();
        },
        
        // Helper para definir fonte pixel
        setPixelFont: function(ctx, size) {
            ctx.font = `${size}px "Press Start 2P"`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
        },
        
        // Renderizar título do mapa
        renderMapTitle: function(ctx, map, gameState) {
            // Cor baseada na fase
            ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#ff0';
            this.setPixelFont(ctx, 20);
            ctx.textAlign = 'center';
            ctx.fillText(map.name, ctx.canvas.width/2, 60);
            
            // Subtítulo
            if (map.subtitle) {
                this.setPixelFont(ctx, 10);
                ctx.fillText(map.subtitle, ctx.canvas.width/2, 90);
            }
            
            // Versão (SEMPRE VISÍVEL)
            ctx.fillStyle = '#666';
            this.setPixelFont(ctx, 8);
            ctx.fillText('v1.57', ctx.canvas.width/2, 115);
            ctx.textAlign = 'left';
        },
        
        // Renderizar status do jogo
        renderGameStatus: function(ctx, gameState) {
            ctx.fillStyle = '#fff';
            this.setPixelFont(ctx, 10);
            
            // Mapa atual
            const totalMaps = MadNight.maps ? MadNight.maps.getCount() : 6;
            ctx.fillText(`Mapa: ${gameState.currentMap + 1}/${totalMaps}`, 20, ctx.canvas.height - 80);
            
            // Inimigos vivos
            const aliveEnemies = MadNight.enemies ? MadNight.enemies.getAliveCount() : 0;
            ctx.fillText(`Inimigos: ${aliveEnemies}`, 20, ctx.canvas.height - 50);
            
            // Fase
            const phaseText = gameState.phase === 'escape' ? 'FUGA!' : 'Infiltração';
            ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
            ctx.fillText(`Fase: ${phaseText}`, 20, ctx.canvas.height - 20);
        },
        
        // Renderizar vidas
        renderLives: function(ctx, gameState, config) {
            ctx.fillStyle = '#fff';
            this.setPixelFont(ctx, 10);
            ctx.fillText('Vidas: ', 20, 40);
            
            // Desenhar indicadores de vida
            const maxDeaths = config ? config.gameplay.maxDeaths : 5;
            for (let i = 0; i < maxDeaths; i++) {
                if (i < gameState.deathCount) {
                    ctx.fillStyle = '#444';
                    ctx.fillText('X', 100 + i * 25, 40);
                } else {
                    ctx.fillStyle = '#f00';
                    ctx.fillText('♥', 100 + i * 25, 40);
                }
            }
        },
        
        // Renderizar força de pedal
        renderPedalPower: function(ctx, gameState) {
            ctx.fillStyle = '#fff';
            this.setPixelFont(ctx, 10);
            ctx.fillText('Força de Pedal: ', 20, 100);
            
            // Barras de energia
            const maxPower = MadNight.config ? MadNight.config.gameplay.maxPedalPower : 4;
            for (let i = 0; i < maxPower; i++) {
                ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
                ctx.fillText('█', 200 + i * 20, 100);
            }
            
            // Indicador de dash
            if (gameState.dashUnlocked) {
                ctx.fillStyle = '#ff0';
                ctx.fillText('[ESPAÇO] Dash', 20, 130);
            }
        },
        
        // Renderizar textos informativos
        renderInfoTexts: function(ctx, map, gameState, player) {
            this.setPixelFont(ctx, 10);
            let yOffset = 180;
            
            // Player na sombra
            if (player && player.inShadow) {
                ctx.fillStyle = '#0f0';
                ctx.fillText('Mocozado na sombra!', 20, yOffset);
                yOffset += 30;
            }
            
            // Orelhão
            if (map.orelhao && !gameState.dashUnlocked) {
                ctx.fillStyle = '#ff0';
                ctx.fillText('Atenda o orelhão!', 20, yOffset);
                yOffset += 30;
            }
            
            // Lixeira
            if (map.lixeira && !gameState.bombPlaced) {
                const aliveEnemies = MadNight.enemies ? MadNight.enemies.getAliveCount() : 0;
                if (aliveEnemies > 0) {
                    ctx.fillStyle = '#f00';
                    ctx.fillText(`Elimine ${aliveEnemies} inimigos primeiro!`, 20, yOffset);
                } else {
                    ctx.fillStyle = '#ff0';
                    ctx.fillText('Plante o explosivo na lixeira!', 20, yOffset);
                }
                yOffset += 30;
            }
            
            // Bomba plantada
            if (gameState.bombPlaced) {
                ctx.fillStyle = '#f00';
                this.setPixelFont(ctx, 12);
                ctx.fillText('CORRE! BOMBA PLANTADA!', 20, yOffset);
                yOffset += 30;
            }
        },
        
        // Renderizar informações de debug
        renderDebugInfo: function(ctx, player) {
            ctx.fillStyle = '#0ff';
            this.setPixelFont(ctx, 8);
            let yOffset = 200;
            
            // Modo debug
            ctx.fillText('DEBUG MODE ON', 20, yOffset);
            yOffset += 20;
            
            // Posição do player
            if (player) {
                ctx.fillText(`Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`, 20, yOffset);
                yOffset += 20;
            }
            
            // Câmera
            if (MadNight.camera) {
                ctx.fillText(`Câmera: ${Math.floor(MadNight.camera.x || 0)}, ${Math.floor(MadNight.camera.y || 0)}`, 20, yOffset);
                yOffset += 20;
            }
            
            // FPS (aproximado)
            if (!this.lastFrameTime) this.lastFrameTime = Date.now();
            const fps = Math.round(1000 / (Date.now() - this.lastFrameTime));
            ctx.fillText(`FPS: ${fps}`, 20, yOffset);
            this.lastFrameTime = Date.now();
        },
        
        // Renderizar overlay de morte
        renderDeathMessageOverlay: function(ctx, message) {
            // Fundo escuro
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Mensagem
            ctx.fillStyle = '#f00';
            this.setPixelFont(ctx, 24);
            ctx.textAlign = 'center';
            ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
            
            // Contador de mortes
            const gameState = MadNight.game ? MadNight.game.state : null;
            const config = MadNight.config;
            if (gameState && config) {
                const maxDeaths = config.gameplay.maxDeaths;
                this.setPixelFont(ctx, 12);
                ctx.fillStyle = '#fff';
                ctx.fillText(`Mortes: ${gameState.deathCount}/${maxDeaths}`, 
                            ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
            }
            
            ctx.textAlign = 'left';
        },
        
        // Renderizar overlay de pausa
        renderPauseOverlay: function(ctx) {
    // Fundo semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Título
    ctx.fillStyle = '#ff0';
    this.setPixelFont(ctx, 32);
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', ctx.canvas.width / 2, ctx.canvas.height / 2 - 120);
    
    // Opções do menu
    const gameState = MadNight.game ? MadNight.game.state : null;
    const options = [
        'CONTINUAR',
        `ÁUDIO: ${gameState && gameState.audioEnabled ? 'LIGADO' : 'DESLIGADO'}`,
        'SAIR PARA MENU'
    ];
    
    this.setPixelFont(ctx, 16);
    options.forEach((option, index) => {
        if (gameState && index === gameState.pauseOption) {
            ctx.fillStyle = '#ff0';
            ctx.fillText('→ ' + option, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20 + index * 40);
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillText(option, ctx.canvas.width / 2 + 20, ctx.canvas.height / 2 - 20 + index * 40);
        }
    });
    
    // Instruções
    this.setPixelFont(ctx, 10);
    ctx.fillStyle = '#888';
    ctx.fillText('↑↓ Selecionar   ENTER Confirmar', ctx.canvas.width / 2, ctx.canvas.height / 2 + 120);
    
    // Controles do jogo
    ctx.fillText('CONTROLES:', ctx.canvas.width / 2, ctx.canvas.height / 2 + 160);
    ctx.fillStyle = '#666';
    ctx.fillText('SETAS - Mover   ESPAÇO - Dash (quando desbloqueado)', ctx.canvas.width / 2, ctx.canvas.height / 2 + 180);
    
    ctx.textAlign = 'left';
},
        
        // Renderizar instruções iniciais
        renderInstructions: function(ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, ctx.canvas.height - 150, ctx.canvas.width, 150);
            
            ctx.fillStyle = '#ff0';
            this.setPixelFont(ctx, 12);
            ctx.textAlign = 'center';
            ctx.fillText('USE AS SETAS PARA MOVER', ctx.canvas.width / 2, ctx.canvas.height - 100);
            
            this.setPixelFont(ctx, 10);
            ctx.fillStyle = '#fff';
            ctx.fillText('Atravesse o Maconhão para começar', ctx.canvas.width / 2, ctx.canvas.height - 60);
            
            ctx.textAlign = 'left';
        },
        
        // Renderizar mensagem temporária
        renderMessage: function(ctx, text) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const lines = text.split('\n');
            const width = Math.max(...lines.map(l => l.length)) * 12 + 40;
            const height = lines.length * 20 + 40;
            const x = (ctx.canvas.width - width) / 2;
            const y = ctx.canvas.height / 2 - height / 2;
            
            ctx.fillRect(x, y, width, height);
            
            ctx.fillStyle = '#ff0';
            this.setPixelFont(ctx, 12);
            ctx.textAlign = 'center';
            
            lines.forEach((line, index) => {
                ctx.fillText(line, ctx.canvas.width / 2, y + 20 + (index * 20));
            });
            
            ctx.textAlign = 'left';
        },
        
        // Renderizar nome do mapa (overlay)
        renderMapNameOverlay: function(ctx, name) {
            const alpha = Math.min(1, mapNameTime / 1000);
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
            ctx.fillRect(0, ctx.canvas.height / 3, ctx.canvas.width, 100);
            
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            this.setPixelFont(ctx, 24);
            ctx.textAlign = 'center';
            ctx.fillText(name, ctx.canvas.width / 2, ctx.canvas.height / 3 + 35);
            ctx.textAlign = 'left';
        },
        
        // Mostrar mensagem temporária
        showMessage: function(text, duration) {
            messageText = text;
            messageTime = duration || messageDuration;
        },
        
        // Mostrar nome do mapa
        showMapName: function(name) {
            mapNameText = name;
            mapNameTime = mapNameDuration;
        },
        
        // Mostrar mensagem de morte
        showDeathMessage: function(text) {
            deathMessageText = text;
            deathMessageTime = 3000;
        },
        
        // Mostrar tela de game over
        showGameOver: function() {
            console.log('Game Over UI');
            // Voltar ao menu após 5 segundos
            setTimeout(() => {
                if (window.MadNightMain && window.MadNightMain.backToMenu) {
                    window.MadNightMain.backToMenu();
                }
            }, 5000);
        },
        
        // Mostrar tela de vitória
        showVictory: function() {
            console.log('Victory UI');
            this.showMessage('VITÓRIA!\n\nVocê escapou com vida!', 5000);
            
            // Voltar ao menu após 5 segundos
            setTimeout(() => {
                if (window.MadNightMain && window.MadNightMain.backToMenu) {
                    window.MadNightMain.backToMenu();
                }
            }, 5000);
        },
        
        // Mostrar tela de novo recorde
        showNewRecord: function(report, newRecords) {
            console.log('Novo recorde!', newRecords);
            
            // Passar para o menu mostrar a tela de entrada de nome
            if (MadNight.menu && MadNight.menu.showNewRecord) {
                MadNight.menu.showNewRecord(report, newRecords);
            }
        },
        
        // Mostrar estatísticas do jogo
        showGameStats: function(report) {
            console.log('Estatísticas finais:', report);
            
            let statsText = 'ESTATÍSTICAS FINAIS\n\n';
            statsText += `Tempo: ${report.timeFormatted}\n`;
            statsText += `Kills: ${report.kills.total}\n`;
            statsText += `Mortes: ${report.deaths}\n`;
            
            if (report.perfect) {
                statsText += '\nRUN PERFEITA!';
            }
            
            this.showMessage(statsText, 8000);
            
            // Voltar ao menu após mostrar stats
            setTimeout(() => {
                if (window.MadNightMain && window.MadNightMain.backToMenu) {
                    window.MadNightMain.backToMenu();
                }
            }, 8000);
        },
        
        // Mostrar/esconder pausa
        showPause: function(isPaused) {
            // A pausa agora é renderizada no renderPauseOverlay
            console.log('Jogo', isPaused ? 'pausado' : 'despausado');
        },
        
        // Atualizar progresso de loading
        updateLoadingProgress: function(progress, assetName) {
            // Pode ser usado para mostrar detalhes do loading se necessário
            console.log(`Loading: ${assetName} (${Math.floor(progress)}%)`);
        }
    };
    
    console.log('Módulo UI carregado');
    
})();
