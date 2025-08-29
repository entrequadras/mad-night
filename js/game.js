// game.js - Lógica Principal do Jogo (v1.65 - Música no Maconhão)

(function() {
   'use strict';
   
   // Estado do jogo (exposto para outros módulos)
   const gameState = {
       initialized: false,
       currentMap: 0,
       phase: 'infiltration', // 'infiltration' ou 'escape'
       dashUnlocked: false,
       bombPlaced: false,
       deathCount: 0,
       pedalPower: 4,
       lastPedalRecharge: 0,
       isPaused: false,
       isGameOver: false,
       pauseOption: 0,
       musicEnabled: true,
       lastEnemySpawn: 0,
       escapeEnemyCount: 0,
       chacalDefeated: false,
       infiniteDashTime: 0,  // ADICIONADO
       infiniteDashActive: false  // ADICIONADO
   };
   
   // Referências dos módulos
   let player = null;
   let enemies = null;
   let projectiles = null;
   let camera = null;
   let renderer = null;
   let audio = null;
   let maps = null;
   let collision = null;
   let lighting = null;
   let traffic = null;
   let ui = null;
   let loader = null;
   let stats = null; // NOVO: Referência do sistema de estatísticas
   
   // Sistema de input
   const keys = {};
   
   // Inicialização do módulo game
   function init() {
       if (gameState.initialized) return true;
       gameState.initialized = true;
    
       console.log('🎮 Inicializando módulo Game...');
       
       // Obter referências dos outros módulos
       player = MadNight.player;
       enemies = MadNight.enemies;
       projectiles = MadNight.projectiles;
       camera = MadNight.camera;
       renderer = MadNight.renderer;
       audio = MadNight.audio;
       maps = MadNight.maps;
       collision = MadNight.collision;
       lighting = MadNight.lighting;
       traffic = MadNight.traffic;
       ui = MadNight.ui;
       loader = MadNight.loader;
       stats = MadNight.stats; // NOVO: Obter referência do stats
       
       // IMPORTANTE: Obter referência do assets também!
       const assets = MadNight.assets;
       
       // Verificar módulos essenciais
       if (!player || !maps) {
           console.error('❌ Módulos essenciais não carregados!');
           return false;
       }
       
       // Inicializar subsistemas (com verificação segura)
       const modules = [
           { name: 'assets', module: assets },
           { name: 'maps', module: maps },
           { name: 'player', module: player },
           { name: 'enemies', module: enemies },
           { name: 'projectiles', module: projectiles },
           { name: 'camera', module: camera },
           { name: 'audio', module: audio },
           { name: 'lighting', module: lighting },
           { name: 'traffic', module: traffic },
           { name: 'stats', module: stats }, // NOVO: Inicializar stats
           { name: 'ui', module: ui }
       ];
       
       modules.forEach(({ name, module }) => {
           if (module && module.init) {
               console.log(`  Inicializando ${name}...`);
               module.init();
           } else if (module) {
               console.log(`  ${name} não possui método init (ok)`);
           } else {
               console.warn(`  ⚠️ Módulo ${name} não encontrado`);
           }
       });
       
       // Carregar primeiro mapa (já carregado pelo loader inicial)
       loadMap(0);
       
       // Configurar input handlers
       setupInputHandlers();
       
       // MÚSICA: Iniciar música do primeiro mapa
       if (audio && audio.playMusic && gameState.musicEnabled) {
           audio.playMusic('inicio');
       }
       
       console.log('✅ Módulo Game inicializado');
       return true;
   }
   
   // Carregar mapa
   function loadMap(mapIndex, isEscape = false) {
       // Verificar se o mapa está carregado
       if (loader && !loader.isMapLoaded(mapIndex)) {
           console.log(`⏳ Mapa ${mapIndex} não carregado, carregando agora...`);
           
           // Mostrar mensagem de loading se houver UI
           if (ui && ui.showMessage) {
               ui.showMessage("Carregando área...");
           }
           
           loader.loadMapAssets(mapIndex, () => {
               loadMap(mapIndex, isEscape); // Tentar novamente após carregar
           });
           return;
       }
       
       const map = maps.getMap(mapIndex);
       if (!map) {
           console.error(`Mapa ${mapIndex} não encontrado!`);
           return;
       }
       
       console.log(`📍 Carregando mapa ${mapIndex}: ${map.name}`);
       
       // Pré-carregar próximo mapa possível
       if (loader) {
           if (gameState.phase === 'infiltration' && mapIndex < 5) {
               // Durante infiltração, pré-carregar próximo mapa
               setTimeout(() => loader.preloadMap(mapIndex + 1), 2000);
           } else if (gameState.phase === 'escape' && mapIndex > 0) {
               // Durante fuga, pré-carregar mapa anterior
               setTimeout(() => loader.preloadMap(mapIndex - 1), 2000);
           }
       }
       
       // Limpar entidades
       if (enemies && enemies.clear) enemies.clear();
       if (projectiles && projectiles.clear) projectiles.clear();
       
       // Posicionar player
       const startPos = (isEscape && map.playerStartEscape) ? 
           map.playerStartEscape : map.playerStart;
       
       if (player && player.setPosition) {
           player.setPosition(startPos.x, startPos.y);
       } else if (player) {
           player.x = startPos.x;
           player.y = startPos.y;
       }
       
       // Reset player state
       if (player) {
           player.isDead = false;
           player.isDashing = false;
       }
       
       // Carregar inimigos
       const enemyList = (isEscape && map.escapeEnemies) ? 
           map.escapeEnemies : map.enemies;
       
       if (enemyList && enemies && enemies.create) {
           enemyList.forEach(enemyData => {
               const enemy = enemies.create(
                   enemyData.x,
                   enemyData.y,
                   enemyData.type || 'faquinha'
               );
               if (isEscape && enemy) {
                   enemy.state = 'chase';
               }
           });
       }
       
       // Atualizar câmera
       if (camera && camera.setTarget) {
           camera.setTarget(player);
       }
       
       // Mostrar nome do mapa
       if (ui && ui.showMapName) {
           ui.showMapName(map.displayName || map.name);
       }
       
       // Limpar assets não utilizados para economizar memória
       if (loader && loader.cleanupUnusedAssets) {
           setTimeout(() => loader.cleanupUnusedAssets(mapIndex), 5000);
       }
   }
   
   // Update principal
   function update(deltaTime) {
       if (gameState.isPaused || gameState.isGameOver) return;
       
       const map = maps.getMap(gameState.currentMap);
       if (!map) return;
      
       // Atualizar sistemas (com verificação segura)
       if (player && player.update) player.update(keys);
       if (enemies && enemies.update) enemies.update(deltaTime);
       if (projectiles && projectiles.update) projectiles.update(deltaTime);
       if (camera && camera.update) camera.update(deltaTime);
       if (lighting && lighting.update) lighting.update(deltaTime);
   
       // Sistema de tráfego no Eixão (mapa 1)
       if (gameState.currentMap === 1 && traffic && traffic.update) {
           traffic.update(deltaTime);
       }
       
       // Verificar interações especiais
       if (player && !player.isDead) {
           checkSpecialInteractions();
           checkMapTransition();
       }
       
       // Sistema de spawn durante fuga
       if (gameState.phase === 'escape') {
           updateEscapeSpawns();
       }
       
       // Atualizar recarga de pedal
       updatePedalPower(deltaTime);
       
       // ADICIONADO - Atualizar power-up de dash infinito
       if (gameState.infiniteDashActive) {
           gameState.infiniteDashTime -= deltaTime;
           if (gameState.infiniteDashTime <= 0) {
               gameState.infiniteDashActive = false;
               console.log('Dash infinito acabou!');
           }
       }
       
       // Atualizar UI
       if (ui && ui.update) ui.update(deltaTime);
   }
   
   // Verificar interações especiais
function checkSpecialInteractions() {
    const map = maps.getMap(gameState.currentMap);
    if (!map || !collision) return;
    
    // ADICIONADO - Verificar power-ups
    if (map.powerups) {
        map.powerups.forEach((powerup, index) => {
            if (!powerup.collected) {
                // COLISÃO MANUAL DIRETA
                const colide = (
                    player.x < powerup.x + 40 && 
                    player.x + player.width > powerup.x && 
                    player.y < powerup.y + 35 && 
                    player.y + player.height > powerup.y
                );
                
                if (colide) {
                    // Marcar como coletado
                    powerup.collected = true;
                    
                    // Ativar dash infinito por 5 segundos
                    gameState.infiniteDashActive = true;
                    gameState.infiniteDashTime = 5000; // 5 segundos
                    
                    // Tocar som
                    if (audio && audio.playSound) {
                        audio.playSound('muleque');
                    }
                    
                    console.log('🚀 DASH INFINITO ATIVADO!');
                    
                    // Mostrar mensagem
                    if (ui && ui.showMessage) {
                        ui.showMessage("ATROPELA, FÍ! 5 SEGUNDOS!");
                    }
                }
            }
        });
    }
       
       // Orelhão - ativar dash
       if (map.orelhao && !gameState.dashUnlocked) {
           if (collision.checkCollision && collision.checkCollision(player, map.orelhao)) {
               gameState.dashUnlocked = true;
               if (audio && audio.playSound) audio.playSound('phone');
               console.log('🏃 Dash desbloqueado!');
               if (ui && ui.showMessage) {
                   ui.showMessage("DASH DESBLOQUEADO!\nPressione ESPAÇO para usar");
               }
           }
       }
       
       // Lixeira - plantar bomba
       if (map.lixeira && !gameState.bombPlaced) {
           if (collision.checkCollision && collision.checkCollision(player, map.lixeira)) {
               // Verificar se todos os inimigos foram eliminados
               const aliveEnemies = (enemies && enemies.getAlive) ? enemies.getAlive() : [];
               if (aliveEnemies.length === 0) {
                   gameState.bombPlaced = true;
                   gameState.phase = 'escape';
                   gameState.lastEnemySpawn = Date.now();
                   
                   if (audio && audio.playMusic) audio.playMusic('fuga');
                   console.log('💣 Bomba plantada! FUGA!');
                   
                   if (ui && ui.showMessage) {
                       ui.showMessage("BOMBA PLANTADA!\nFUJA!");
                   }
                   
                   // Recarregar mapa em modo fuga
                   loadMap(gameState.currentMap, true);
               } else {
                   if (ui && ui.showMessage) {
                       ui.showMessage(`Elimine ${aliveEnemies.length} inimigo(s) primeiro!`);
                   }
               }
           }
       }
   }
   
   // Verificar transição de mapa
   function checkMapTransition() {
       const map = maps.getMap(gameState.currentMap);
       if (!map || !map.exit || !collision) return;
       
       if (collision.checkCollision && collision.checkCollision(player, map.exit)) {
           handleMapTransition();
       }
   }
   
   // Transição entre mapas
   function handleMapTransition() {
       if (gameState.phase === 'escape') {
           // Voltando durante a fuga
           if (gameState.currentMap > 0) {
               gameState.currentMap--;
               loadMap(gameState.currentMap, true);
           } else {
               // Chegou ao início - vitória!
               handleVictory();
           }
       } else if (gameState.phase === 'infiltration') {
           // Avançando durante infiltração
           if (gameState.currentMap < maps.getCount() - 1) {
               gameState.currentMap++;
               loadMap(gameState.currentMap);
           }
       }
   }
   
   // Sistema de spawn durante fuga
   function updateEscapeSpawns() {
       if (gameState.currentMap !== 5 || !enemies) return; // Apenas no mapa 6 (índice 5)
       
       const now = Date.now();
       const config = MadNight.config.gameplay;
       
       if (now - gameState.lastEnemySpawn > config.escapeEnemySpawnDelay) {
           gameState.lastEnemySpawn = now;
           gameState.escapeEnemyCount++;
           
           // Determinar quantidade de inimigos
           let spawnCount = 2;
           if (gameState.escapeEnemyCount > 3) spawnCount = 4;
           if (gameState.escapeEnemyCount > 6) spawnCount = 8;
           
           // Spawnar inimigos
           if (enemies.create) {
               for (let i = 0; i < spawnCount; i++) {
                   const enemy = enemies.create(
                       2000 + Math.random() * 200,
                       300 + Math.random() * 200,
                       'faquinha'
                   );
                   if (enemy) enemy.state = 'chase';
               }
           }
       }
   }
   
   // Atualizar sistema de pedal
   function updatePedalPower(deltaTime) {
       const config = MadNight.config.gameplay;
       
       if (gameState.pedalPower < config.maxPedalPower) {
           if (player && !player.isMoving && Date.now() - gameState.lastPedalRecharge > config.pedalRechargeDelay) {
               gameState.lastPedalRecharge = Date.now();
               gameState.pedalPower++;
               console.log(`Pedal Power: ${gameState.pedalPower}/${config.maxPedalPower}`);
           }
       }
   }
   
   // Configurar input handlers
   function setupInputHandlers() {
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   }
   
  function handleKeyDown(e) {
    keys[e.key] = true;
    
    // Tecla ESC - toggle pause
    if (e.key === 'Escape') {
        togglePause();
        return;
    }
    
    // Se pausado, lidar com menu de pausa
    if (gameState.isPaused) {
        handlePauseMenu(e.key);
        return;
    }
    
    // Passar para o player
    if (player && player.handleKeyDown) {
        player.handleKeyDown(e);
    }
    
    // Debug keys (se habilitado)
    if (MadNight.config.debug.enableDebugKeys) {
        handleDebugKeys(e.key);
    }
}    
       // Tentar tocar música na primeira interação (REMOVIDO - música agora começa no init)
   
   function handleKeyUp(e) {
       keys[e.key] = false;
       
       if (player && player.handleKeyUp) {
           player.handleKeyUp(e);
       }
   }
   
   // Debug keys
   function handleDebugKeys(key) {
       switch(key.toLowerCase()) {
           case 'k':
               console.log('DEBUG: Matando player');
               if (player && player.kill) player.kill();
               break;
               
           case 'e':
               console.log('DEBUG: Spawnando inimigo');
               if (enemies && enemies.create && player) {
                   enemies.create(player.x + 150, player.y, 'faquinha');
               }
               break;
               
           case 'm':
               console.log('DEBUG: Alternando música');
               if (audio && audio.playMusic) {
                   audio.playMusic(gameState.phase === 'infiltration' ? 'fuga' : 'inicio');
               }
               break;
               
           case 'n':
               console.log('DEBUG: Próximo mapa');
               if (maps) {
                   gameState.currentMap = (gameState.currentMap + 1) % maps.getCount();
                   loadMap(gameState.currentMap);
               }
               break;
               
           case 'd':
               console.log('DEBUG: Desbloqueando dash');
               gameState.dashUnlocked = true;
               break;
               
           case 'b':
               console.log('DEBUG: Plantando bomba');
               gameState.bombPlaced = true;
               gameState.phase = 'escape';
               if (audio && audio.playMusic) audio.playMusic('fuga');
               break;
               
           case '`':
           case '~':
               MadNight.config.debug.showCollisions = !MadNight.config.debug.showCollisions;
               console.log('DEBUG: Colisões:', MadNight.config.debug.showCollisions ? 'ON' : 'OFF');
               break;
               
           case 'v':
               console.log('DEBUG: Forçando vitória');
               handleVictory();
               break;
               
           case 'r':
               console.log('DEBUG: Mostrando rankings');
               if (stats) {
                   console.log('Speed Run:', stats.getRankingDisplay('speedRun'));
                   console.log('Enemy Kills:', stats.getRankingDisplay('enemyKills'));
                   console.log('Deathless:', stats.getRankingDisplay('deathless'));
               }
               break;
       }
   }
   
      // Lidar com morte do player
   function handlePlayerDeath() {
       gameState.deathCount++;
       console.log(`Mortes: ${gameState.deathCount}/${MadNight.config.gameplay.maxDeaths}`);
    
       // NOVO: Registrar morte nas estatísticas
       if (stats && stats.registerDeath) {
        stats.registerDeath();
    }
    
       if (gameState.deathCount >= MadNight.config.gameplay.maxDeaths) {
        handleGameOver();
    } else {
        // Mostrar mensagem de morte
        if (ui && ui.showDeathMessage) {
            ui.showDeathMessage("ah véi, se liga carái");
        }
        
        // Recarregar mapa atual
        setTimeout(() => {
            // SÓ recarregar se o jogo NÃO acabou
            if (!gameState.isGameOver) {
                loadMap(gameState.currentMap, gameState.phase === 'escape');
            }
        }, 2000);
    }
}
   
// Game Over
function handleGameOver() {
    gameState.isGameOver = true;
    console.log('💀 GAME OVER');
    
    const report = stats ? stats.finishGame() : null;
    
    // Mostrar SIFUDÊU
    if (ui && ui.showDeathMessage) {
        ui.showDeathMessage("SIFUDÊU");
    }
    
    // Após 3 segundos, trocar para tela de estatísticas
    setTimeout(() => {
        // Esconder mensagem de morte
        if (ui && ui.showingDeathMessage) {
            ui.showingDeathMessage = false;
        }
        
        // Mostrar tela de estatísticas com PNG
        if (ui && ui.showStatsScreen && report) {
            ui.showStatsScreen(report);
        }
        
        // Depois de 8 segundos, ir para rankings
        setTimeout(() => {
            // Esconder tela de stats
            if (ui && ui.hideStatsScreen) {
                ui.hideStatsScreen();
            }
            
            // Ir para menu de rankings
            if (MadNight.menu) {
                MadNight.menu.active = true;
                MadNight.menu.currentScreen = 'rankings';
                if (window.MadNightMain && window.MadNightMain.setAppState) {
                    window.MadNightMain.setAppState('menu');
                }
            }
        }, 8000);
    }, 3000);
}
   
   // Vitória
function handleVictory() {
    console.log('🎉 VITÓRIA!');
    
    const report = stats ? stats.finishGame() : null;
    const newRecords = (stats && report) ? stats.checkHighScore(report) : [];
    
    if (audio && audio.playMusic) {
        audio.playMusic('creditos');
    }
    
    if (ui && ui.showStatsScreen && report) {
        ui.showStatsScreen(report);
    }
    
    setTimeout(() => {
        // Esconder tela de stats
        if (ui && ui.hideStatsScreen) {
            ui.hideStatsScreen();
        }
        
        // NÃO chamar restart() aqui!
        
        if (newRecords.length > 0) {
            if (MadNight.menu) {
                MadNight.menu.active = true;
                MadNight.menu.showNewRecord(report, newRecords);
                if (window.MadNightMain) {
                    window.MadNightMain.setAppState('menu');
                }
            }
        } else {
            if (MadNight.menu) {
                MadNight.menu.active = true;
                MadNight.menu.currentScreen = 'rankings';
                if (window.MadNightMain) {
                    window.MadNightMain.setAppState('menu');
                }
            }
        }
    }, 8000);
}
   
// Reiniciar jogo
function restart() {
    // IMPORTANTE: Re-obter referências dos módulos que podem ter sido perdidas
    if (!maps) maps = MadNight.maps;
    if (!player) player = MadNight.player;
    if (!enemies) enemies = MadNight.enemies;
    if (!ui) ui = MadNight.ui;
    if (!audio) audio = MadNight.audio;
    if (!stats) stats = MadNight.stats;
    
    // Reset game state
    gameState.currentMap = 0;
    gameState.phase = 'infiltration';
    gameState.dashUnlocked = false;
    gameState.bombPlaced = false;
    gameState.deathCount = 0;
    gameState.pedalPower = 4;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.escapeEnemyCount = 0;
    gameState.chacalDefeated = false;
    gameState.infiniteDashTime = 0;  // ADICIONADO
    gameState.infiniteDashActive = false;  // ADICIONADO
    
    // NOVO: Resetar estatísticas da sessão
    if (stats && stats.resetCurrent) {
        stats.resetCurrent();
    }
    
    // Limpar entidades
    if (enemies && enemies.clear) enemies.clear();
    if (projectiles && projectiles.clear) projectiles.clear();
    
    // Parar música
    if (audio && audio.stopMusic) audio.stopMusic();
    
    // Recarregar primeiro mapa
    loadMap(0);
}
   
   // Toggle pause
   function togglePause() {
   gameState.isPaused = !gameState.isPaused;
   
   if (gameState.isPaused) {
       gameState.pauseOption = 0; // Reset para primeira opção
       console.log('Jogo pausado');
   } else {
       console.log('Jogo despausado');
   }
   
   if (ui && ui.showPause) {
       ui.showPause(gameState.isPaused);
   }
}

function handlePauseMenu(key) {
    // ESC para despausar
    if (key === 'Escape') {
        togglePause();
        return;
    }
    
    if (!gameState.isPaused) return;
    
    switch(key) {
        case 'ArrowUp':
            gameState.pauseOption = (gameState.pauseOption - 1 + 3) % 3;
            break;
        case 'ArrowDown':
            gameState.pauseOption = (gameState.pauseOption + 1) % 3;
            break;
        case 'Enter':
        case ' ':
            switch(gameState.pauseOption) {
                case 0: // Continuar
                    togglePause();
                    break;
                case 1: // Música On/Off
                    gameState.musicEnabled = !gameState.musicEnabled;
                    if (audio) {
                        if (gameState.musicEnabled) {
                            // Retomar música atual
                            if (gameState.phase === 'escape') {
                                audio.playMusic('fuga');
                            } else {
                                audio.playMusic('inicio');
                            }
                        } else {
                            // Parar música
                            audio.stopMusic();
                        }
                    }
                    break;
                case 2: // Sair para menu
                    gameState.isPaused = false;
                    if (audio && audio.stopMusic) {
                        audio.stopMusic();
                    }
                    if (window.MadNightMain && window.MadNightMain.backToMenu) {
                        window.MadNightMain.backToMenu();
                    }
                    break;
            }
            break;
    }
}
   
   // Exportar módulo
   MadNight.game = {
       // Estado exposto para outros módulos
       state: gameState,
       keys: keys,
       
       // Métodos principais
    init: init,
    update: update,
    restart: restart,
    togglePause: togglePause,
    handlePlayerDeath: handlePlayerDeath,
    handleVictory: handleVictory,
    handleGameOver: handleGameOver,
    handleMapExit: handleMapTransition,
    loadMap: loadMap,  // Expor loadMap para outros módulos
       
       // Getters para outros módulos
       getState: () => gameState,
       getCurrentMap: () => gameState.currentMap,
       getPhase: () => gameState.phase,
       isDashUnlocked: () => gameState.dashUnlocked,
       getPedalPower: () => gameState.pedalPower,
       usePedal: () => {
           // MODIFICADO - Se dash infinito ativo, não gasta pedal
           if (gameState.infiniteDashActive) {
               if (stats && stats.registerDash) {
                   stats.registerDash();
               }
               return true;
           }
           
           // Comportamento normal
           if (gameState.pedalPower > 0) {
               gameState.pedalPower--;
               gameState.lastPedalRecharge = Date.now();
               // NOVO: Registrar uso de dash nas estatísticas
               if (stats && stats.registerDash) {
                   stats.registerDash();
               }
               return true;
           }
           return false;
       },
       
       // Propriedade para main.js
       get isPaused() { return gameState.isPaused; }
   };
   
   console.log('Módulo Game carregado');
   
})();
