// player.js - Sistema do Player

const player = {
    x: 100,
    y: 300,
    width: CONFIG.PLAYER_WIDTH,
    height: CONFIG.PLAYER_HEIGHT,
    speed: CONFIG.PLAYER_SPEED,
    direction: 'right',
    frame: 0,
    sprites: [],
    isDead: false,
    deathFrame: 12,
    isDashing: false,
    dashStart: 0,
    dashDuration: CONFIG.DASH_DURATION,
    dashDistance: CONFIG.DASH_DISTANCE,
    dashStartX: 0,
    dashStartY: 0,
    lastMove: Date.now(),
    inShadow: false
};

// Carregar sprites do player
function loadPlayerSprites() {
    const spritesLoaded = { count: 0 };
    
    for (let i = 0; i <= 15; i++) {
        const img = new Image();
        img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
        img.onload = () => {
            spritesLoaded.count++;
            if (spritesLoaded.count === 16) {
                console.log('✅ Sprites do MadMax carregados');
            }
        };
        img.onerror = () => {
            console.warn(`⚠️ Sprite madmax${String(i).padStart(3, '0')}.png não encontrado`);
        };
        player.sprites[i] = img;
    }
}

// Obter sprite atual do player
function getPlayerSprite() {
    if (player.isDead) return player.sprites[player.deathFrame];
    
    const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
    const base = dirMap[player.direction];
    
    if (player.isDashing) return player.sprites[8 + base];
    return player.sprites[base + player.frame * 4];
}

// Matar o player
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.isDashing = false;
    player.deathFrame = Math.floor(Math.random() * 4) + 12;
    gameState.deaths++;
    
    // Som de morte
    audio.playSFX('morte_madmax', 0.8);
    
    setTimeout(() => {
        if (gameState.deaths >= CONFIG.MAX_DEATHS) {
            // Reset completo do jogo
            gameState.deaths = 0;
            gameState.currentMap = 0;
            gameState.phase = 'infiltration';
            gameState.dashUnlocked = false;
            gameState.bombPlaced = false;
            loadMap(0);
            playMusic('inicio');
        } else {
            // Respawn no mapa atual
            loadMap(gameState.currentMap, gameState.phase === 'escape');
        }
    }, 2000);
}

// Atualizar player
function updatePlayer() {
    if (player.isDead) return;
    
    const map = maps[gameState.currentMap];
    
    // Verificar se está na sombra
    const playerCenterX = player.x + player.width/2;
    const playerCenterY = player.y + player.height/2;
    player.inShadow = isInShadow(playerCenterX, playerCenterY);
    
    let moving = false;
    let dx = 0, dy = 0;
    
    if (player.isDashing) {
        // Lógica do dash
        const progress = (Date.now() - player.dashStart) / player.dashDuration;
        
        if (progress >= 1) {
            player.isDashing = false;
        } else {
            const dashSpeed = player.dashDistance / player.dashDuration * 16;
            let dashDx = 0, dashDy = 0;
            
            switch(player.direction) {
                case 'up': dashDy = -dashSpeed; break;
                case 'down': dashDy = dashSpeed; break;
                case 'left': dashDx = -dashSpeed; break;
                case 'right': dashDx = dashSpeed; break;
            }
            
            if (!checkWallCollision(player, player.x + dashDx, player.y + dashDy)) {
                player.x += dashDx;
                player.y += dashDy;
            } else {
                player.isDashing = false;
            }
        }
    } else {
        // Movimento normal
        if (keys['ArrowUp']) { dy = -1; player.direction = 'up'; moving = true; }
        if (keys['ArrowDown']) { dy = 1; player.direction = 'down'; moving = true; }
        if (keys['ArrowLeft']) { dx = -1; player.direction = 'left'; moving = true; }
        if (keys['ArrowRight']) { dx = 1; player.direction = 'right'; moving = true; }
        
        if (dx !== 0) {
            const newX = player.x + dx * player.speed;
            if (!checkWallCollision(player, newX, player.y)) {
                player.x = newX;
            }
        }
        
        if (dy !== 0) {
            const newY = player.y + dy * player.speed;
            if (!checkWallCollision(player, player.x, newY)) {
                player.y = newY;
            }
        }
        
        // Dash
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing && gameState.dashUnlocked) {
            player.isDashing = true;
            player.dashStart = Date.now();
            gameState.pedalPower--;
            audio.playSFX('dash', 0.6);
        }
    }
    
    // Recarregar energia
    if (moving || player.isDashing) {
        player.lastMove = Date.now();
    } else if (Date.now() - player.lastMove > 1000) {
        if (Date.now() - gameState.lastRecharge > CONFIG.PEDAL_RECHARGE_TIME && 
            gameState.pedalPower < gameState.maxPedalPower) {
            gameState.pedalPower++;
            gameState.lastRecharge = Date.now();
        }
    }
    
    // Limitar aos bounds do mapa
    player.x = Math.max(0, Math.min(map.width - player.width, player.x));
    player.y = Math.max(0, Math.min(map.height - player.height, player.y));
    
    // Animação
    if (moving && !player.isDashing && Date.now() - gameState.lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        gameState.lastFrameTime = Date.now();
    }
}
