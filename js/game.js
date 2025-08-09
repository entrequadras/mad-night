// game.js - Lógica Principal do Jogo (Revisão Alpha-02)

(function() {
    'use strict';
    
    // Estado do jogo (exposto para outros módulos)
    const gameState = {
        currentMap: 0,
        phase: 'infiltration', // 'infiltration' ou 'escape'
        dashUnlocked: false,
        bombPlaced: false,
        deathCount: 0,
        pedalPower: 4,
        lastPedalRecharge: 0,
        isPaused: false,
        isGameOver: false,
        lastEnemySpawn: 0,
        escapeEnemyCount: 0,
        chacalDefeated: false
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
    
    // Sistema de input
    const keys = {};
    
    // Inicialização do módulo game
    function init() {
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
        
        // Verificar módulos essenciais
        if (!player || !maps) {
            console.error('❌ Módulos essenciais não carregados!');
            return false;
        }
        
        // Inicializar subsistemas
        if (player.init) player.init();
        if (enemies.init) enemies.init();
        if (projectiles.init) projectiles.init();
        if (camera.init) camera.init();
        if (audio.init) audio.init();
        if (lighting.init) lighting.init();
        if (traffic.init) traffic.init();
        if (ui.init) ui.init();
        
        // Carregar primeiro mapa
        loadMap(0);
        
        // Configurar input handlers
        setupInputHandlers();
        
        console.log('✅ Módulo Game inicializado');
        return true;
    }
    
    // Carregar mapa
    function loadMap(mapIndex, isEscape = false) {
        const map = maps.getMap(mapIndex);
        if (!map) {
            console.error(`Mapa ${mapIndex} não encontrado!`);
            return;
        }
        
        console.log(`📍 Carregando mapa ${mapIndex}: ${map.name}`);
        
        // Limpar entidades
        if (enemies.clear) enemies.clear();
        if (projectiles.clear) projectiles.clear();
        
        // Posicionar player
        const startPos = (isEscape && map.playerStartEscape) ? 
            map.playerStartEscape : map.playerStart;
        
        if (player.setPosition) {
            player.setPosition(startPos.x, startPos.y);
        } else {
            player.x = startPos.x;
            player.y = startPos.y;
        }
        
        // Reset player state
        player.isDead = false;
        player.isDashing = false;
        
        // Carregar inimigos
        const enemyList = (isEscape && map.escapeEnemies) ? 
            map.escapeEnemies : map.enemies;
        
        if (enemyList && enemies.create) {
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
        if (camera.setTarget) {
            camera.setTarget(player);
        }
        
        // Mostrar nome do mapa
        if (ui && ui.showMapName) {
            ui.showMapName(map.displayName || map.name);
        }
    }
    
    // Update principal
    function update(deltaTime) {
        if (gameState.isPaused || gameState.isGameOver) return;
        
        const map = maps.getMap(gameState.currentMap);
        if (!map) return;
        
        // Atualizar sistemas
        if (player.update) player.update(keys);
        if (enemies.update) enemies.update(deltaTime);
        if (projectiles.update) projectiles.update(deltaTime);
        if (camera.update) camera.update(deltaTime);
        if (lighting.update) lighting.update(deltaTime);
        
        // Sistema de tráfego no Eixão (mapa 1)
        if (gameState.currentMap === 1 && traffic.update) {
            traffic.update(deltaTime);
        }
        
        // Verificar interações especiais
        if (!player.isDead) {
            checkSpecialInteractions();
            checkMapTransition();
        }
        
        // Sistema de spawn durante fuga
        if (gameState.phase === 'escape') {
            updateEscapeSpawns();
        }
        
        // Atualizar recarga de pedal
        updatePedalPower(deltaTime);
        
        // Atualizar UI
        if (ui.update) ui.update(deltaTime);
    }
    
    // Verificar interações especiais
    function checkSpecialInteractions() {
        const map = maps.getMap(gameState.currentMap);
        if (!map) return;
        
        // Orelhão - ativar dash
        if (map.orelhao && !gameState.dashUnlocked) {
            if (collision.checkCollision(player, map.orelhao)) {
                gameState.dashUnlocked = true;
                if (audio.playSound) audio.playSound('phone');
                console.log('🏃 Dash desbloqueado!');
                if (ui.showMessage) {
                    ui.showMessage("DASH DESBLOQUEADO!\nPressione ESPAÇO para usar");
                }
            }
        }
        
        // Lixeira - plantar bomba
        if (map.lixeira && !gameState.bombPlaced) {
            if (collision.checkCollision(player, map.lixeira)) {
                // Verificar se todos os inimigos foram eliminados
                const aliveEnemies = enemies.getAlive ? enemies.getAlive() : [];
                if (aliveEnemies.length === 0) {
                    gameState.bombPlaced = true;
                    gameState.phase = 'escape';
                    gameState.lastEnemySpawn = Date.now();
                    
                    if (audio.playMusic) audio.playMusic('fuga');
                    console.log('💣 Bomba plantada! FUGA!');
                    
                    if (ui.showMessage) {
                        ui.showMessage("BOMBA PLANTADA!\nFUJA!");
                    }
                    
                    // Recarregar mapa em modo fuga
                    loadMap(gameState.currentMap, true);
                } else {
                    if (ui.showMessage) {
                        ui.showMessage(`Elimine ${aliveEnemies.length} inimigo(s) primeiro!`);
                    }
                }
            }
        }
    }
    
    // Verificar transição de mapa
    function checkMapTransition() {
        const map = maps.getMap(gameState.currentMap);
        if (!map || !map.exit) return;
        
        if (collision.checkCollision(player, map.exit)) {
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
                
                // Tocar música após primeiro mapa
                if (gameState.currentMap === 1 && audio.playMusic) {
                    audio.playMusic('inicio');
                }
            }
        }
    }
    
    // Sistema de spawn durante fuga
    function updateEscapeSpawns() {
        if (gameState.currentMap !== 5) return; // Apenas no mapa 6 (índice 5)
        
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
    
    // Atualizar sistema de pedal
    function updatePedalPower(deltaTime) {
        const config = MadNight.config.gameplay;
        
        if (gameState.pedalPower < config.maxPedalPower) {
            if (!player.isMoving && Date.now() - gameState.lastPedalRecharge > config.pedalRechargeDelay) {
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
        
        // Passar para o player
        if (player.handleKeyDown) {
            player.handleKeyDown(e);
        }
        
        // Debug keys (se habilitado)
        if (MadNight.config.debug.enableDebugKeys) {
            handleDebugKeys(e.key);
        }
        
        // Tentar tocar música na primeira interação
        if (!audio.currentMusic && gameState.currentMap > 0) {
            if (audio.playMusic) audio.playMusic('inicio');
        }
    }
    
    function handleKeyUp(e) {
        keys[e.key] = false;
        
        if (player.handleKeyUp) {
            player.handleKeyUp(e);
        }
    }
    
    // Debug keys
    function handleDebugKeys(key) {
        switch(key.toLowerCase()) {
            case 'k':
                console.log('DEBUG: Matando player');
                if (player.kill) player.kill();
                break;
                
            case 'e':
                console.log('DEBUG: Spawnando inimigo');
                if (enemies.create) {
                    enemies.create(player.x + 150, player.y, 'faquinha');
                }
                break;
                
            case 'm':
                console.log('DEBUG: Alternando música');
                if (audio.playMusic) {
                    audio.playMusic(gameState.phase === 'infiltration' ? 'fuga' : 'inicio');
                }
                break;
                
            case 'n':
                console.log('DEBUG: Próximo mapa');
                gameState.currentMap = (gameState.currentMap + 1) % maps.getCount();
                loadMap(gameState.currentMap);
                break;
                
            case 'd':
                console.log('DEBUG: Desbloqueando dash');
                gameState.dashUnlocked = true;
                break;
                
            case 'b':
                console.log('DEBUG: Plantando bomba');
                gameState.bombPlaced = true;
                gameState.phase = 'escape';
                if (audio.playMusic) audio.playMusic('fuga');
                break;
                
            case '`':
            case '~':
                MadNight.config.debug.showCollisions = !MadNight.config.debug.showCollisions;
                console.log('DEBUG: Colisões:', MadNight.config.debug.showCollisions ? 'ON' : 'OFF');
                break;
        }
    }
    
    // Lidar com morte do player
    function handlePlayerDeath() {
        gameState.deathCount++;
        console.log(`Mortes: ${gameState.deathCount}/${MadNight.config.gameplay.maxDeaths}`);
        
        if (gameState.deathCount >= MadNight.config.gameplay.maxDeaths) {
            handleGameOver();
        } else {
            // Recarregar mapa atual
            setTimeout(() => {
                loadMap(gameState.currentMap, gameState.phase === 'escape');
            }, 2000);
        }
    }
    
    // Game Over
    function handleGameOver() {
        gameState.isGameOver = true;
        console.log('💀 GAME OVER');
        
        if (ui.showGameOver) {
            ui.showGameOver();
        }
        
        // Reiniciar após 5 segundos
        setTimeout(() => {
            restart();
        }, 5000);
    }
    
    // Vitória
    function handleVictory() {
        console.log('🎉 VITÓRIA!');
        
        if (audio.playMusic) {
            audio.playMusic('creditos');
        }
        
        if (ui.showVictory) {
            ui.showVictory();
        }
    }
    
    // Reiniciar jogo
    function restart() {
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
        
        // Limpar entidades
        if (enemies.clear) enemies.clear();
        if (projectiles.clear) projectiles.clear();
        
        // Parar música
        if (audio.stopMusic) audio.stopMusic();
        
        // Recarregar primeiro mapa
        loadMap(0);
    }
    
    // Toggle pause
    function togglePause() {
        gameState.isPaused = !gameState.isPaused;
        console.log('Jogo', gameState.isPaused ? 'pausado' : 'despausado');
        
        if (ui.showPause) {
            ui.showPause(gameState.isPaused);
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
        handleMapExit: handleMapTransition,
        
        // Getters para outros módulos
        getState: () => gameState,
        getCurrentMap: () => gameState.currentMap,
        getPhase: () => gameState.phase,
        isDashUnlocked: () => gameState.dashUnlocked,
        getPedalPower: () => gameState.pedalPower,
        usePedal: () => {
            if (gameState.pedalPower > 0) {
                gameState.pedalPower--;
                gameState.lastPedalRecharge = Date.now();
                return true;
            }
            return false;
        },
        
        // Propriedade para main.js
        get isPaused() { return gameState.isPaused; }
    };
    
    console.log('Módulo Game carregado');
    
})();
