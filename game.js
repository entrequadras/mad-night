// game.js - Lógica Principal do Jogo

// Carregar mapa
function loadMap(mapIndex, isEscape = false) {
    const map = maps[mapIndex];
    if (!map) {
        console.error(`Mapa ${mapIndex} não encontrado!`);
        return;
    }
    
    console.log(`📍 Carregando mapa ${mapIndex}: ${map.name}`);
    
    // Limpar entidades
    enemies.length = 0;
    projectiles.length = 0;
    
    // Posicionar player
    if (isEscape && map.playerStartEscape) {
        player.x = map.playerStartEscape.x;
        player.y = map.playerStartEscape.y;
    } else {
        player.x = map.playerStart.x;
        player.y = map.playerStart.y;
    }
    
    // Reset player
    player.isDead = false;
    player.isDashing = false;
    
    // Carregar inimigos
    const enemyList = (isEscape && map.escapeEnemies) ? map.escapeEnemies : map.enemies;
    
    if (enemyList) {
        enemyList.forEach(enemyData => {
            // Converter posição central para posição top-left
            const enemyX = enemyData.x - CONFIG.ENEMY_WIDTH/2;
            const enemyY = enemyData.y - CONFIG.ENEMY_HEIGHT/2;
            
            const validPos = findValidSpawnPosition(enemyX, enemyY, CONFIG.ENEMY_WIDTH, CONFIG.ENEMY_HEIGHT);
            const enemy = new Enemy(validPos.x, validPos.y, enemyData.type || 'faquinha');
            
            if (isEscape) enemy.state = 'chase';
            enemies.push(enemy);
        });
    }
}

// Verificar interações especiais
function checkSpecialInteractions() {
    const map = maps[gameState.currentMap];
    
    // Orelhão - ativar dash
    if (map.orelhao && checkRectCollision(player, map.orelhao)) {
        if (!gameState.dashUnlocked) {
            gameState.dashUnlocked = true;
            if (audio.phone_ring) audio.phone_ring.pause();
            console.log('🏃 Dash desbloqueado!');
            // TODO: Mostrar cutscene/diálogo
        }
    }
    
    // Lixeira - plantar bomba
    if (map.lixeira && checkRectCollision(player, map.lixeira)) {
        if (!gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            gameState.lastEnemySpawn = Date.now();
            playMusic('fuga');
            console.log('💣 Bomba plantada! FUGA!');
            // TODO: Mostrar cutscene/diálogo
        }
    }
    
    // Saída do mapa
    if (map.exit && checkRectCollision(player, map.exit)) {
        handleMapTransition();
    }
}

// Transição entre mapas
function handleMapTransition() {
    if (gameState.phase === 'escape') {
        // Voltando durante a fuga
        if (gameState.currentMap === 5) {
            gameState.currentMap = 4;
            loadMap(4, true);
        } else if (gameState.currentMap > 0) {
            gameState.currentMap--;
            loadMap(gameState.currentMap, true);
        } else if (gameState.currentMap === 0) {
            // Chegou ao início - vitória!
            console.log('🎉 Vitória! Você escapou!');
            // TODO: Implementar tela de vitória/créditos
            playMusic('creditos');
        }
    } else if (gameState.phase === 'infiltration') {
        // Avançando durante infiltração
        if (gameState.currentMap < maps.length - 1) {
            gameState.currentMap++;
            loadMap(gameState.currentMap);
            
            // Tocar música após primeiro mapa
            if (gameState.currentMap === 1 && !gameState.currentMusic) {
                playMusic('inicio');
            }
        }
    }
}

// Update principal
function update() {
    const map = maps[gameState.currentMap];
    if (!map) return;
    
    // Atualizar sistemas
    updatePlayer();
    updateEnemies();
    updateProjectiles();
    updateCamera();
    updateProximitySounds();
    
    // Sistema de tráfego no Eixão
    if (gameState.currentMap === 1) {
        trafficSystem.update();
    }
    
    // Verificar interações
    if (!player.isDead) {
        checkSpecialInteractions();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicializar jogo
function initGame() {
    console.log('🎮 Iniciando Mad Night ' + CONFIG.VERSION);
    
    // Obter canvas e contexto
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Configurar canvas
    canvas.width = CONFIG.CANVAS_WIDTH * CONFIG.ZOOM;
    canvas.height = CONFIG.CANVAS_HEIGHT * CONFIG.ZOOM;
    
    // Configurar fonte padrão
    ctx.font = '10px "Press Start 2P"';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    // Inicializar câmera
    camera = {
        x: 0,
        y: 0,
        width: CONFIG.CANVAS_WIDTH,
        height: CONFIG.CANVAS_HEIGHT,
        zoom: CONFIG.ZOOM
    };
    
    // Carregar recursos
    loadAssets();
    loadAudio();
    loadPlayerSprites();
    loadEnemySprites();
    
    // Carregar primeiro mapa
    loadMap(0);
    
    // Aguardar fontes e iniciar
    document.fonts.ready.then(() => {
        console.log('✅ Fontes carregadas');
        document.getElementById('loading').style.display = 'none';
        gameLoop();
        
        // Tentar tocar música após interação
        setTimeout(() => {
            if (gameState.currentMap > 0 && !gameState.currentMusic) {
                playMusic('inicio');
            }
        }, 1000);
    }).catch(() => {
        console.warn('⚠️ Erro ao carregar fontes, usando fallback');
        document.getElementById('loading').style.display = 'none';
        gameLoop();
    });
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // DEBUG KEYS (documentadas!)
    if (CONFIG.DEBUG_MODE || e.key === '~') {
        handleDebugKeys(e.key);
    }
    
    // Tentar tocar música na primeira interação
    if (!gameState.currentMusic && gameState.currentMap > 0) {
        playMusic('inicio');
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Debug keys
function handleDebugKeys(key) {
    switch(key) {
        case 'k':
        case 'K':
            console.log('DEBUG: Matando player');
            killPlayer();
            break;
            
        case 'e':
        case 'E':
            console.log('DEBUG: Spawnando inimigo');
            const enemy = new Enemy(player.x + 150, player.y);
            enemies.push(enemy);
            break;
            
        case 'm':
        case 'M':
            console.log('DEBUG: Alternando música');
            playMusic(gameState.musicPhase === 'inicio' ? 'fuga' : 'inicio');
            break;
            
        case 'n':
        case 'N':
            console.log('DEBUG: Próximo mapa');
            gameState.currentMap = (gameState.currentMap + 1) % maps.length;
            loadMap(gameState.currentMap);
            break;
            
        case 'd':
        case 'D':
            console.log('DEBUG: Desbloqueando dash');
            gameState.dashUnlocked = true;
            break;
            
        case 'b':
        case 'B':
            console.log('DEBUG: Plantando bomba');
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            playMusic('fuga');
            break;
            
        case '~':
            CONFIG.DEBUG_MODE = !CONFIG.DEBUG_MODE;
            console.log('DEBUG MODE:', CONFIG.DEBUG_MODE ? 'ON' : 'OFF');
            break;
    }
}
