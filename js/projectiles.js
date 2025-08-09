// projectiles.js - Sistema de Projéteis

// Atualizar todos os projéteis
function updateProjectiles() {
    const map = maps[gameState.currentMap];
    if (!map) return;
    
    projectiles.forEach((stone, index) => {
        if (!stone.active) return;
        
        // Mover projétil
        stone.x += stone.vx;
        stone.y += stone.vy;
        
        // Verificar colisão com player
        if (stone.x < player.x + player.width &&
            stone.x + stone.width > player.x &&
            stone.y < player.y + player.height &&
            stone.y + stone.height > player.y) {
            killPlayer();
            stone.active = false;
        }
        
        // Verificar se saiu do mapa
        if (stone.x < 0 || stone.x > map.width || 
            stone.y < 0 || stone.y > map.height) {
            stone.active = false;
        }
        
        // Verificar colisão com paredes
        if (checkWallCollision(stone, stone.x, stone.y)) {
            stone.active = false;
        }
    });
    
    // Remover projéteis inativos
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!projectiles[i].active) {
            projectiles.splice(i, 1);
        }
    }
}

// Renderizar projéteis
function renderProjectiles(ctx, visibleArea) {
    ctx.save();
    
    projectiles.forEach(stone => {
        // Verificar se está visível
        if (stone.x > visibleArea.left && 
            stone.x < visibleArea.right &&
            stone.y > visibleArea.top && 
            stone.y < visibleArea.bottom) {
            
            // Desenhar pedra
            ctx.fillStyle = '#888';
            ctx.fillRect(
                stone.x - 5, 
                stone.y - 5, 
                stone.width, 
                stone.height
            );
            
            // Adicionar borda mais escura
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                stone.x - 5, 
                stone.y - 5, 
                stone.width, 
                stone.height
            );
        }
    });
    
    ctx.restore();
}

// Criar novo projétil (usado pelos inimigos Janis)
function createProjectile(fromX, fromY, targetX, targetY, speed = 4) {
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return null;
    
    return {
        x: fromX,
        y: fromY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        width: 10,
        height: 10,
        active: true
    };
}

// Limpar todos os projéteis
function clearProjectiles() {
    projectiles.length = 0;
}
