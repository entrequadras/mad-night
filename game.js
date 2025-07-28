// Atualizar
let lastFrameTime = 0;
function update() {
    const currentMapData = maps[gameState.currentMap];
    
    enemies.forEach(enemy => enemy.update());
    
    enemies.forEach((enemy, index) => {
        if (enemy.isDead && !enemy.removeTime) {
            enemy.removeTime = Date.now() + 3000;
        }
        if (enemy.removeTime && Date.now() > enemy.removeTime) {
            enemies.splice(index, 1);
        }
    });
    
    if (player.isDead) return;
    
    const playerCenterX = player.x + player.width/2;
    const playerCenterY = player.y + player.height/2;
    player.inShadow = isInShadow(playerCenterX, playerCenterY);
    
    let moving = false;
    let dx = 0;
    let dy = 0;
    
    if (player.isDashing) {
        const progress = (Date.now() - player.dashStart) / player.dashDuration;
        
        if (progress >= 1) {
            player.isDashing = false;
        } else {
            // Movimento do dash COM verificação de colisão
            const dashSpeed = player.dashDistance / player.dashDuration * 16;
            let dashDx = 0;
            let dashDy = 0;
            
            switch(player.direction) {
                case 'up': dashDy = -dashSpeed; break;
                case 'down': dashDy = dashSpeed; break;
                case 'left': dashDx = -dashSpeed; break;
                case 'right': dashDx = dashSpeed; break;
            }
            
            // Verificar colisão do dash
            const newX = player.x + dashDx;
            const newY = player.y + dashDy;
            const testPlayer = {x: newX, y: newY, width: player.width, height: player.height};
            
            let canDash = true;
            currentMapData.walls.forEach(wall => {
                if (checkRectCollision(testPlayer, wall)) {
                    canDash = false;
                }
            });
            
            if (canDash) {
                player.x = newX;
                player.y = newY;
            } else {
                // Parar dash se bater na parede
                player.isDashing = false;
            }
        }
    } else {
        // Movimento normal
        if (keys['ArrowUp']) {
            dy = -1;
            player.direction = 'up';
            moving = true;
        }
        if (keys['ArrowDown']) {
            dy = 1;
            player.direction = 'down';
            moving = true;
        }
        if (keys['ArrowLeft']) {
            dx = -1;
            player.direction = 'left';
            moving = true;
        }
        if (keys['ArrowRight']) {
            dx = 1;
            player.direction = 'right';
            moving = true;
        }
        
        // Aplicar movimento
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        const testPlayer = {x: newX, y: newY, width: player.width, height: player.height};
        
        let canMove = true;
        currentMapData.walls.forEach(wall => {
            if (checkRectCollision(testPlayer, wall)) {
                canMove = false;
            }
        });
        
        if (canMove) {
            player.x = newX;
            player.y = newY;
        }
        
        // Dash
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing && (gameState.dashUnlocked || gameState.currentMap < 3)) {
            player.isDashing = true;
            player.dashStart = Date.now();
            gameState.pedalPower--;
        }
    }
    
    // Checar interações especiais
    if (currentMapData.orelhao && checkRectCollision(player, currentMapData.orelhao)) {
        if (!gameState.dashUnlocked) {
            gameState.dashUnlocked = true;
            console.log('CUTSCENE: Orelhão - Dash permanente desbloqueado!');
        }
    }
    
    if (currentMapData.lixeira && checkRectCollision(player, currentMapData.lixeira)) {
        if (!gameState.bombPlaced && enemies.filter(e => !e.isDead).length === 0) {
            gameState.bombPlaced = true;
            gameState.phase = 'escape';
            playMusic('fuga');
            console.log('BOMBA PLANTADA! FUJA!');
            
            // Spawnar inimigos extras
            for (let i = 0; i < 4; i++) {
                const enemy = new Enemy(300, 600 + i * 50);
                enemy.sprites = faquinhaSprites;
                enemy.state = 'chase';
                enemies.push(enemy);
            }
        }
    }
    
    // Checar saída do mapa
    if (currentMapData.exit && checkRectCollision(player, currentMapData.exit)) {
        // Na fase de fuga, voltar pelos mapas
        if (gameState.phase === 'escape' && gameState.currentMap === 5) {
            gameState.currentMap = 4;
            loadMap(4);
        } else if (gameState.phase === 'escape' && gameState.currentMap > 2) {
            gameState.currentMap--;
            loadMap(gameState.currentMap);
        } else if (gameState.phase === 'infiltration' && gameState.currentMap < maps.length - 1) {
            gameState.currentMap++;
            loadMap(gameState.currentMap);
        } else if (gameState.phase === 'infiltration' && gameState.currentMap === 5) {
            // Não avançar além do mapa 6
            console.log('Chegou no último mapa! Plante a bomba!');
        } else {
            console.log('Fim da demo!');
            gameState.currentMap = 0;
            loadMap(0);
        }
    }
    
    if (moving || player.isDashing) {
        player.lastMove = Date.now();
    } else if (Date.now() - player.lastMove > 1000) {
        if (Date.now() - gameState.lastRecharge > 6000 && gameState.pedalPower < gameState.maxPedalPower) {
            gameState.pedalPower++;
            gameState.lastRecharge = Date.now();
        }
    }
    
    player.x = Math.max(0, Math.min(currentMapData.width - player.width, player.x));
    player.y = Math.max(0, Math.min(currentMapData.height - player.height, player.y));
    
    if (moving && !player.isDashing && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}
