// enemy.js - Sistema de Inimigos (v1.63 - Restaurado do Original)

(function() {
    'use strict';
    
    // Classe Enemy
    MadNight.Enemy = class Enemy {
        constructor(x, y, type = 'faquinha') {
            this.x = x;
            this.y = y;
            this.originX = x;
            this.originY = y;
            this.type = type;
            
            // Configurações base
            const config = MadNight.config.enemy;
            const typeConfig = MadNight.config.enemyTypes[type] || {};
            
            this.width = config.width;
            this.height = config.height;
            this.speed = typeConfig.speed || config.baseSpeed;
            this.patrolSpeed = config.patrolSpeed;
            this.direction = 'down';
            this.frame = 0;
            this.state = 'patrol'; // patrol, chase, attack
            this.isDead = false;
            this.deathFrame = 12;
            this.sprites = [];
            
            // Visão e detecção
            this.visionRange = config.visionRange;
            this.alertVisionRange = config.alertVisionRange;
            this.patrolRadius = config.patrolRadius;
            
            // Patrulha
            this.patrolDirection = this.getRandomDirection();
            this.lastDirectionChange = Date.now();
            this.directionChangeInterval = 2000 + Math.random() * 2000;
            
            // Ataque
            this.attackRange = config.attackRange;
            this.lastAttack = 0;
            this.attackCooldown = config.attackCooldown;
            
            // Vida e invulnerabilidade
            this.health = typeConfig.health || 1;
            this.maxHealth = this.health;
            this.isInvulnerable = false;
            this.invulnerableTime = 0;
            this.invulnerableDuration = typeConfig.invulnerableDuration || 500;
            
            // Tempo para remover após morte
            this.removeTime = null;
            
            // Carregar sprites corretos
            this.loadSprites();
        }
        
        loadSprites() {
            this.sprites = MadNight.assets.sprites[this.type] || [];
        }
        
        getRandomDirection() {
            const dirs = ['up', 'down', 'left', 'right'];
            return dirs[Math.floor(Math.random() * dirs.length)];
        }
        
        throwStone() {
            if (this.type !== 'janis' || Date.now() - this.lastAttack < this.attackCooldown) {
                return;
            }
            
            const player = MadNight.player;
            if (!player) return;
            
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.attackRange && !player.isDead) {
                this.lastAttack = Date.now();
                
                // Criar projétil usando o sistema de projéteis
                if (MadNight.projectiles && MadNight.projectiles.create) {
                    MadNight.projectiles.create(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        player.x + player.width / 2,
                        player.y + player.height / 2
                    );
                }
                
                if (MadNight.audio && MadNight.audio.playSFX) {
                    MadNight.audio.playSFX('ataque_janis', 0.5);
                }
            }
        }
        
        update() {
            if (this.isDead) return;
            
            const player = MadNight.player;
            if (!player) return;
            
            // Verificar invulnerabilidade
            if (this.isInvulnerable && Date.now() - this.invulnerableTime > this.invulnerableDuration) {
                this.isInvulnerable = false;
            }
            
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Ajustar visão baseado em sombras
            let visionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
            if (player.inShadow) {
                visionRange *= 0.3;
            }
            
            // Comportamento específico do Janis (atirador)
            if (this.type === 'janis') {
                if (dist < this.attackRange && !player.isDead) {
                    this.state = 'attack';
                    this.throwStone();
                    this.direction = Math.abs(dx) > Math.abs(dy) ? 
                        (dx > 0 ? 'right' : 'left') : 
                        (dy > 0 ? 'down' : 'up');
                } else {
                    this.state = 'patrol';
                }
            }
            
            // Comportamento específico do Chacal
            if (this.type === 'chacal' && dist < 300 && !player.isDead) {
                this.state = 'chase';
            }
            
            // Detecção e perseguição para inimigos normais
            if (this.type !== 'janis' && dist < visionRange && !player.isDead) {
                let canSee = false;
                const angleThreshold = 50;
                
                // Verificar cone de visão
                switch(this.direction) {
                    case 'up': 
                        canSee = dy < 0 && Math.abs(dx) < angleThreshold;
                        break;
                    case 'down': 
                        canSee = dy > 0 && Math.abs(dx) < angleThreshold;
                        break;
                    case 'left': 
                        canSee = dx < 0 && Math.abs(dy) < angleThreshold;
                        break;
                    case 'right': 
                        canSee = dx > 0 && Math.abs(dy) < angleThreshold;
                        break;
                }
                
                // Perseguir se viu ou já está perseguindo
                if (this.state === 'chase' || canSee || this.type === 'chacal') {
                    this.state = 'chase';
                    
                    // Mover em direção ao player
                    const angle = Math.atan2(dy, dx);
                    const moveX = Math.cos(angle) * this.speed;
                    const moveY = Math.sin(angle) * this.speed;
                    
                    // Tentar mover horizontalmente
                    if (!MadNight.collision.checkWallCollision(this, this.x + moveX, this.y)) {
                        this.x += moveX;
                    }
                    
                    // Tentar mover verticalmente
                    if (!MadNight.collision.checkWallCollision(this, this.x, this.y + moveY)) {
                        this.y += moveY;
                    }
                    
                    // Atualizar direção
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.direction = dx > 0 ? 'right' : 'left';
                    } else {
                        this.direction = dy > 0 ? 'down' : 'up';
                    }
                    
                    // Matar player se muito próximo
                    if (dist < 30 && MadNight.player.kill) {
                        MadNight.player.kill();
                    }
                }
            } else if (this.type !== 'janis' || this.state !== 'attack') {
                // Comportamento de patrulha
                this.state = 'patrol';
                this.patrol();
            }
            
            // Verificar colisão com dash do player
            if (player.isDashing && dist < 40 && !this.isInvulnerable) {
                if (this.type === 'chacal') {
                    this.takeDamage();
                } else {
                    this.die();
                }
            }
            
            // Atualizar frame de animação
            this.frame = Date.now() % 400 < 200 ? 0 : 1;
        }
        
        patrol() {
            // Mudar direção aleatoriamente
            if (Date.now() - this.lastDirectionChange > this.directionChangeInterval) {
                this.patrolDirection = this.getRandomDirection();
                this.lastDirectionChange = Date.now();
                this.directionChangeInterval = 2000 + Math.random() * 2000;
                this.direction = this.patrolDirection;
            }
            
            // Verificar distância da origem
            const distFromOrigin = Math.sqrt(
                Math.pow(this.x - this.originX, 2) + 
                Math.pow(this.y - this.originY, 2)
            );
            
            // Voltar se muito longe da origem
            if (distFromOrigin > this.patrolRadius) {
                const backDx = this.originX - this.x;
                const backDy = this.originY - this.y;
                this.patrolDirection = Math.abs(backDx) > Math.abs(backDy) ?
                    (backDx > 0 ? 'right' : 'left') :
                    (backDy > 0 ? 'down' : 'up');
                this.direction = this.patrolDirection;
                this.lastDirectionChange = Date.now();
            }
            
            // Mover na direção de patrulha
            let pdx = 0, pdy = 0;
            switch(this.patrolDirection) {
                case 'up': pdy = -this.patrolSpeed; break;
                case 'down': pdy = this.patrolSpeed; break;
                case 'left': pdx = -this.patrolSpeed; break;
                case 'right': pdx = this.patrolSpeed; break;
            }
            
            // Tentar mover, mudar direção se colidir
            if (!MadNight.collision.checkWallCollision(this, this.x + pdx, this.y + pdy)) {
                this.x += pdx;
                this.y += pdy;
            } else {
                this.patrolDirection = this.getRandomDirection();
                this.lastDirectionChange = Date.now();
                this.direction = this.patrolDirection;
            }
        }
        
        takeDamage() {
            if (this.isInvulnerable) return;
            
            this.health--;
            this.isInvulnerable = true;
            this.invulnerableTime = Date.now();
            
            if (this.health <= 0) {
                this.die();
            }
        }
        
        die() {
            if (this.isDead) return;
            
            this.isDead = true;
            this.deathFrame = Math.floor(Math.random() * 4) + 12;
            
            // Tocar som de morte
            if (MadNight.audio && MadNight.audio.playDeathSound) {
                MadNight.audio.playDeathSound(this.type);
            }
            
            // Registrar kill nas estatísticas
            if (MadNight.stats && MadNight.stats.registerKill) {
                MadNight.stats.registerKill(this.type);
            }
            
            // Marcar para remoção
            this.removeTime = Date.now() + MadNight.config.enemy.removeDelay;
        }
        
        getSprite() {
            if (this.isDead) {
                return this.sprites[this.deathFrame];
            }
            
            const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
            const base = dirMap[this.direction];
            const offset = (this.state === 'chase' || this.state === 'attack') ? 8 : this.frame * 4;
            
            return this.sprites[base + offset];
        }
        
        render(ctx, visibleArea) {
            // Verificar se está visível
            if (MadNight.camera && !MadNight.camera.isVisible(this)) return;
            
            // Verificar se sprites estão carregados
            if (MadNight.assets.areSpritesLoaded(this.type)) {
                const sprite = this.getSprite();
                if (sprite) {
                    ctx.save();
                    
                    // Aplicar transparência se estiver na sombra
                    if (MadNight.lighting && MadNight.lighting.isInShadow) {
                        if (MadNight.lighting.isInShadow(
                            this.x + this.width / 2, 
                            this.y + this.height / 2
                        )) {
                            ctx.globalAlpha = 0.5;
                        }
                    }
                    
                    // Mostrar barra de vida do Chacal
                    if (this.type === 'chacal' && !this.isDead && this.health < this.maxHealth) {
                        ctx.fillStyle = '#800';
                        ctx.fillRect(this.x, this.y - 10, this.width, 5);
                        ctx.fillStyle = '#f00';
                        ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 5);
                    }
                    
                    // Aplicar transparência se invulnerável
                    if (this.isInvulnerable) {
                        ctx.globalAlpha = 0.5;
                    }
                    
                    // Renderizar sprite com tamanho correto
                    ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                    
                    ctx.restore();
                }
            } else {
                // Fallback se sprites não carregaram
                if (!this.isDead) {
                    const colors = {
                        'faquinha': '#808',
                        'morcego': '#408',
                        'caveirinha': '#c0c',
                        'janis': '#0cc',
                        'chacal': '#f80'
                    };
                    
                    ctx.fillStyle = this.state === 'chase' ? '#f0f' : (colors[this.type] || '#f00');
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            }
            
            // Mostrar indicador de alerta durante fuga
            const gameState = MadNight.game ? MadNight.game.state : null;
            if (!this.isDead && gameState && gameState.phase === 'escape') {
                ctx.fillStyle = '#f00';
                ctx.font = '8px "Press Start 2P"';
                ctx.fillText('!', this.x + 23, this.y - 5);
            }
        }
    };
    
    // Sistema de gerenciamento de inimigos
    MadNight.enemies = {
        list: [],
        
        // Inicializar (compatibilidade)
        init: function() {
            console.log('Sistema de inimigos inicializado');
        },
        
        // Criar novo inimigo
        create: function(x, y, type = 'faquinha') {
            const enemy = new MadNight.Enemy(x, y, type);
            this.list.push(enemy);
            return enemy;
        },
        
        // Atualizar todos os inimigos (compatibilidade)
        update: function(deltaTime) {
            this.list.forEach(enemy => {
                enemy.update();
            });
            
            // Remover inimigos mortos após delay
            this.cleanup();
        },
        
        // Limpar inimigos mortos
        cleanup: function() {
            const now = Date.now();
            this.list = this.list.filter(enemy => {
                return !enemy.removeTime || now < enemy.removeTime;
            });
        },
        
        // Renderizar todos os inimigos (compatibilidade)
        render: function(ctx, visibleArea) {
            this.list.forEach(enemy => {
                enemy.render(ctx, visibleArea);
            });
        },
        
        // Limpar todos os inimigos
        clear: function() {
            this.list = [];
        },
        
        // Obter inimigos vivos (compatibilidade)
        getAlive: function() {
            return this.list.filter(e => !e.isDead);
        },
        
        // Obter número de inimigos vivos
        getAliveCount: function() {
            return this.list.filter(e => !e.isDead).length;
        },
        
        // Verificar colisão (compatibilidade)
        checkCollision: function(rect) {
            return this.list.some(enemy => {
                if (enemy.isDead) return false;
                return enemy.x < rect.x + rect.w &&
                       enemy.x + enemy.width > rect.x &&
                       enemy.y < rect.y + rect.h &&
                       enemy.y + enemy.height > rect.y;
            });
        },
        
        // Spawnar inimigo de fuga
        spawnEscapeEnemy: function() {
            const map = MadNight.maps ? MadNight.maps.getCurrentMap() : null;
            if (!map) return;
            
            const gameState = MadNight.game ? MadNight.game.state : {};
            
            const corners = [
                {x: 50, y: 50, dir: 'down'},
                {x: map.width - 100, y: 50, dir: 'down'},
                {x: 50, y: map.height - 100, dir: 'up'},
                {x: map.width - 100, y: map.height - 100, dir: 'up'}
            ];
            
            const corner = corners[(gameState.spawnCorner || 0) % 4];
            gameState.spawnCorner = (gameState.spawnCorner || 0) + 1;
            
            const types = ['faquinha', 'morcego', 'caveirinha', 'caveirinha'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            const validPos = MadNight.collision.findValidSpawnPosition(
                corner.x, corner.y, 46, 46
            );
            
            const enemy = this.create(validPos.x, validPos.y, randomType);
            enemy.state = 'chase';
            enemy.alertVisionRange = 400;
            
            // Definir direção inicial
            const centerX = map.width / 2;
            const centerY = map.height / 2;
            enemy.direction = Math.abs(corner.x - centerX) > Math.abs(corner.y - centerY) ?
                (corner.x < centerX ? 'right' : 'left') :
                (corner.y < centerY ? 'down' : 'up');
            
            return enemy;
        }
    };
    
    console.log('Módulo Enemy carregado');
    
})();
