// enemy.js - Sistema de Inimigos Completo (v1.58 - Correção de Interface)

(function() {
    'use strict';
    
    // Classe base para inimigos
    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = 40;
            this.height = 40;
            this.speed = 2;
            this.health = 1;
            this.state = 'patrol'; // patrol, alert, chase
            this.direction = { x: 0, y: 0 };
            this.patrolTarget = null;
            this.alertTimer = 0;
            this.lastSeen = null;
            this.isDead = false;
            this.deathTimer = 0;
            this.viewAngle = Math.PI / 3; // 60 graus de visão
            this.viewDistance = 150;
            this.attackCooldown = 0;
            this.attackRange = 50;
            this.currentSprite = 'idle';
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
        
        update(deltaTime) {
            if (this.isDead) {
                this.deathTimer += deltaTime;
                if (this.deathTimer > 2000) {
                    return false; // Remover inimigo
                }
                return true;
            }
            
            // Atualizar cooldown de ataque
            if (this.attackCooldown > 0) {
                this.attackCooldown -= deltaTime;
            }
            
            // Atualizar animação
            this.animationTimer += deltaTime;
            if (this.animationTimer > 200) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % 2;
            }
            
            // Comportamento baseado no estado
            switch(this.state) {
                case 'patrol':
                    this.patrol(deltaTime);
                    break;
                case 'alert':
                    this.alert(deltaTime);
                    break;
                case 'chase':
                    this.chase(deltaTime);
                    break;
            }
            
            // Verificar se vê o player
            if (this.canSeePlayer()) {
                this.state = 'chase';
                this.lastSeen = { 
                    x: MadNight.player.x, 
                    y: MadNight.player.y 
                };
            }
            
            // Verificar colisão com player
            if (this.checkPlayerCollision()) {
                this.attack();
            }
            
            return true;
        }
        
        patrol(deltaTime) {
            // Movimento de patrulha básico
            if (!this.patrolTarget) {
                this.patrolTarget = {
                    x: this.x + (Math.random() - 0.5) * 200,
                    y: this.y + (Math.random() - 0.5) * 200
                };
            }
            
            const dx = this.patrolTarget.x - this.x;
            const dy = this.patrolTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10) {
                this.patrolTarget = null;
            } else {
                this.direction.x = dx / dist;
                this.direction.y = dy / dist;
                this.move(deltaTime);
            }
        }
        
        alert(deltaTime) {
            // Estado de alerta - procurando player
            this.alertTimer += deltaTime;
            
            if (this.alertTimer > 3000) {
                this.state = 'patrol';
                this.alertTimer = 0;
            }
            
            // Girar procurando
            this.direction.x = Math.cos(this.alertTimer * 0.002);
            this.direction.y = Math.sin(this.alertTimer * 0.002);
        }
        
        chase(deltaTime) {
            // Perseguir player
            const player = MadNight.player;
            if (!player || player.isDead) {
                this.state = 'patrol';
                return;
            }
            
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > this.viewDistance * 2) {
                // Perdeu o player de vista
                this.state = 'alert';
                this.alertTimer = 0;
            } else {
                this.direction.x = dx / dist;
                this.direction.y = dy / dist;
                this.move(deltaTime);
            }
        }
        
        move(deltaTime) {
            const moveSpeed = this.speed * (deltaTime / 16);
            const newX = this.x + this.direction.x * moveSpeed;
            const newY = this.y + this.direction.y * moveSpeed;
            
            // Verificar colisão antes de mover
            if (!this.checkCollision(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        }
        
        canSeePlayer() {
            const player = MadNight.player;
            if (!player || player.isDead) return false;
            
            // Verificar se está na sombra (invisível)
            if (MadNight.lighting && MadNight.lighting.isInShadow) {
                if (MadNight.lighting.isInShadow(player.x + player.width/2, player.y + player.height/2)) {
                    return false;
                }
            }
            
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Verificar distância
            if (dist > this.viewDistance) return false;
            
            // Verificar ângulo de visão
            const angleToPlayer = Math.atan2(dy, dx);
            const facingAngle = Math.atan2(this.direction.y, this.direction.x);
            let angleDiff = Math.abs(angleToPlayer - facingAngle);
            
            if (angleDiff > Math.PI) {
                angleDiff = 2 * Math.PI - angleDiff;
            }
            
            return angleDiff < this.viewAngle / 2;
        }
        
        checkPlayerCollision() {
            const player = MadNight.player;
            if (!player || player.isDead) return false;
            
            return this.x < player.x + player.width &&
                   this.x + this.width > player.x &&
                   this.y < player.y + player.height &&
                   this.y + this.height > player.y;
        }
        
        checkCollision(x, y) {
            // Verificar colisão com paredes e objetos
            if (MadNight.collision && MadNight.collision.checkCollision) {
                return MadNight.collision.checkCollision(
                    { x: x, y: y, w: this.width, h: this.height }
                );
            }
            return false;
        }
        
        attack() {
            if (this.attackCooldown <= 0) {
                const player = MadNight.player;
                if (player && player.kill) {
                    player.kill();
                }
                this.attackCooldown = 1000; // 1 segundo de cooldown
            }
        }
        
        takeDamage(damage) {
            this.health -= damage;
            if (this.health <= 0) {
                this.die();
            }
        }
        
        die() {
            this.isDead = true;
            this.deathTimer = 0;
            
            // IMPORTANTE: Registrar kill nas estatísticas
            if (MadNight.stats && MadNight.stats.registerKill) {
                MadNight.stats.registerKill(this.type);
            }
            
            console.log(`💀 ${this.type} eliminado!`);
        }
        
        render(ctx) {
            if (this.isDead) {
                ctx.save();
                ctx.globalAlpha = 1 - (this.deathTimer / 2000);
                ctx.fillStyle = '#f00';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.restore();
                return;
            }
            
            // Renderizar sprite do inimigo
            const sprite = MadNight.assets.get(this.type);
            if (sprite && sprite.loaded && sprite.img) {
                ctx.drawImage(sprite.img, this.x, this.y);
            } else {
                // Fallback - quadrado colorido
                ctx.fillStyle = this.getColor();
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            
            // Debug - mostrar cone de visão
            if (MadNight.config.debug.showCollisions) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
                const angle1 = Math.atan2(this.direction.y, this.direction.x) - this.viewAngle/2;
                const angle2 = Math.atan2(this.direction.y, this.direction.x) + this.viewAngle/2;
                ctx.lineTo(
                    this.x + this.width/2 + Math.cos(angle1) * this.viewDistance,
                    this.y + this.height/2 + Math.sin(angle1) * this.viewDistance
                );
                ctx.arc(
                    this.x + this.width/2, 
                    this.y + this.height/2, 
                    this.viewDistance,
                    angle1, angle2
                );
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }
        
        getColor() {
            switch(this.type) {
                case 'faquinha': return '#f0f';
                case 'morcego': return '#800';
                case 'caveirinha': return '#fff';
                case 'janis': return '#0ff';
                case 'chacal': return '#f80';
                default: return '#f00';
            }
        }
    }
    
    // Tipos específicos de inimigos
    class Faquinha extends Enemy {
        constructor(x, y) {
            super(x, y, 'faquinha');
            this.speed = 2;
            this.viewDistance = 120;
        }
    }
    
    class Morcego extends Enemy {
        constructor(x, y) {
            super(x, y, 'morcego');
            this.speed = 3;
            this.viewDistance = 150;
        }
    }
    
    class Caveirinha extends Enemy {
        constructor(x, y) {
            super(x, y, 'caveirinha');
            this.speed = 2.5;
            this.viewDistance = 140;
        }
    }
    
    class Janis extends Enemy {
        constructor(x, y) {
            super(x, y, 'janis');
            this.speed = 1.5;
            this.viewDistance = 200;
            this.attackRange = 150; // Atira de longe
            this.projectileCooldown = 0;
        }
        
        attack() {
            if (this.projectileCooldown <= 0) {
                // Atirar pedra
                const player = MadNight.player;
                if (player && MadNight.projectiles) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist <= this.attackRange) {
                        MadNight.projectiles.create(
                            this.x + this.width/2,
                            this.y + this.height/2,
                            dx / dist * 5,
                            dy / dist * 5,
                            'stone'
                        );
                        this.projectileCooldown = 2000; // 2 segundos
                    }
                }
            }
        }
        
        update(deltaTime) {
            if (this.projectileCooldown > 0) {
                this.projectileCooldown -= deltaTime;
            }
            return super.update(deltaTime);
        }
    }
    
    class Chacal extends Enemy {
        constructor(x, y) {
            super(x, y, 'chacal');
            this.speed = 2.5;
            this.health = 3; // Boss - aguenta 3 hits
            this.viewDistance = 180;
            this.width = 60;
            this.height = 60;
        }
        
        die() {
            super.die();
            // Marcar que o Chacal foi derrotado
            if (MadNight.game && MadNight.game.state) {
                MadNight.game.state.chacalDefeated = true;
            }
        }
    }
    
    // Sistema de gerenciamento de inimigos
    MadNight.enemies = {
        list: [],
        
        init: function() {
            console.log('Sistema de inimigos inicializado');
        },
        
        create: function(x, y, type) {
            let enemy;
            
            switch(type) {
                case 'faquinha':
                    enemy = new Faquinha(x, y);
                    break;
                case 'morcego':
                    enemy = new Morcego(x, y);
                    break;
                case 'caveirinha':
                    enemy = new Caveirinha(x, y);
                    break;
                case 'janis':
                    enemy = new Janis(x, y);
                    break;
                case 'chacal':
                    enemy = new Chacal(x, y);
                    break;
                default:
                    enemy = new Enemy(x, y, type);
            }
            
            this.list.push(enemy);
            return enemy;
        },
        
        update: function(deltaTime) {
            this.list = this.list.filter(enemy => enemy.update(deltaTime));
        },
        
        render: function(ctx) {
            this.list.forEach(enemy => enemy.render(ctx));
        },
        
        clear: function() {
            this.list = [];
        },
        
        getAlive: function() {
            return this.list.filter(enemy => !enemy.isDead);
        },
        
        // NOVO: Método para obter apenas a contagem de inimigos vivos
        getAliveCount: function() {
            return this.list.filter(enemy => !enemy.isDead).length;
        },
        
        checkCollision: function(rect) {
            return this.list.some(enemy => {
                if (enemy.isDead) return false;
                return enemy.x < rect.x + rect.w &&
                       enemy.x + enemy.width > rect.x &&
                       enemy.y < rect.y + rect.h &&
                       enemy.y + enemy.height > rect.y;
            });
        }
    };
    
    console.log('Módulo Enemy carregado');
    
})();
