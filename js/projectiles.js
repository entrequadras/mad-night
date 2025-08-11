// projectiles.js - Sistema de projéteis

MadNight.projectiles = {
    // Lista de projéteis ativos
    list: [],
    
    // Criar um novo projétil
    create: function(x, y, targetX, targetY, speed = null) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return null;
        
        const projectileSpeed = speed || MadNight.config.gameplay.projectileSpeed;
        
        const projectile = {
            x: x,
            y: y,
            vx: (dx / dist) * projectileSpeed,
            vy: (dy / dist) * projectileSpeed,
            width: 10,
            height: 10,
            active: true,
            type: 'stone'
        };
        
        this.list.push(projectile);
        return projectile;
    },
    
    // Criar projétil direcionado ao player
    createTowardsPlayer: function(fromX, fromY) {
        const player = MadNight.player;
        if (!player) return null;
        
        return this.create(
            fromX,
            fromY,
            player.x + player.width / 2,
            player.y + player.height / 2
        );
    },
    
    // Atualizar todos os projéteis
    update: function() {
        const map = MadNight.maps.getCurrentMap();
        const player = MadNight.player;
        
        if (!map || !player) return;
        
        this.list.forEach((stone, index) => {
            if (!stone.active) return;
            
            stone.x += stone.vx;
            stone.y += stone.vy;
            
            if (!player.isDead && 
                MadNight.collision.checkProjectileCollision(stone, player)) {
                MadNight.player.kill();
                stone.active = false;
            }
            
            if (stone.x < 0 || stone.x > map.width || 
                stone.y < 0 || stone.y > map.height) {
                stone.active = false;
            }
            
            if (MadNight.collision.checkWallCollision(stone, stone.x, stone.y)) {
                stone.active = false;
            }
        });
        
        this.cleanup();
    },
    
    // Limpar projéteis inativos
    cleanup: function() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            if (!this.list[i].active) {
                this.list.splice(i, 1);
            }
        }
    },
    
    // Renderizar projéteis
    render: function(ctx, visibleArea) {
        this.list.forEach(stone => {
            if (stone.x > visibleArea.left && 
                stone.x < visibleArea.right &&
                stone.y > visibleArea.top && 
                stone.y < visibleArea.bottom) {
                
                ctx.save();
                
                if (stone.type === 'stone') {
                    ctx.fillStyle = '#888';
                    ctx.fillRect(
                        stone.x - stone.width / 2,
                        stone.y - stone.height / 2,
                        stone.width,
                        stone.height
                    );
                }
                
                ctx.restore();
            }
        });
    },
    
    // Limpar todos os projéteis
    clear: function() {
        this.list = [];
    },
    
    // Obter número de projéteis ativos
    getActiveCount: function() {
        return this.list.filter(p => p.active).length;
    },
    
    // Criar padrão de projéteis
    createPattern: function(fromX, fromY, pattern = 'spread') {
        switch (pattern) {
            case 'spread':
                for (let angle = -30; angle <= 30; angle += 30) {
                    const rad = (angle * Math.PI) / 180;
                    const targetX = fromX + Math.cos(rad) * 100;
                    const targetY = fromY + Math.sin(rad) * 100;
                    this.create(fromX, fromY, targetX, targetY);
                }
                break;
                
            case 'circle':
                for (let angle = 0; angle < 360; angle += 45) {
                    const rad = (angle * Math.PI) / 180;
                    const targetX = fromX + Math.cos(rad) * 100;
                    const targetY = fromY + Math.sin(rad) * 100;
                    this.create(fromX, fromY, targetX, targetY);
                }
                break;
                
            case 'burst':
                const player = MadNight.player;
                if (player) {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            this.createTowardsPlayer(fromX, fromY);
                        }, i * 100);
                    }
                }
                break;
        }
    }
};
