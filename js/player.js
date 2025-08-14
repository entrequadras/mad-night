// player.js - Sistema do player (Revisão Alpha-12)

(function() {
    'use strict';
    
    MadNight.player = {
        // Propriedades do player
        x: 100,
        y: 300,
        width: 56,
        height: 56,
        speed: 3.6,
        direction: 'right',
        frame: 0,
        sprites: [],
        
        // Estado
        isDead: false,
        deathFrame: 12,
        isDashing: false,
        dashStart: 0,
        dashDuration: 150,
        dashDistance: 60,
        dashStartX: 0,
        dashStartY: 0,
        lastMove: Date.now(),
        inShadow: false,
        isMoving: false,
        
        // Inicializar player
        init: function() {
            this.width = MadNight.config.player.width;
            this.height = MadNight.config.player.height;
            this.speed = MadNight.config.player.speed;
            this.dashDuration = MadNight.config.player.dashDuration;
            this.dashDistance = MadNight.config.player.dashDistance;
            
            this.sprites = MadNight.assets.sprites.madmax || [];
            this.reset();
            console.log('Player inicializado');
        },
        
        // Resetar player
        reset: function() {
            const startPos = MadNight.config.player.startPosition;
            this.x = startPos.x;
            this.y = startPos.y;
            this.isDead = false;
            this.isDashing = false;
            this.direction = 'right';
            this.frame = 0;
            this.inShadow = false;
            this.isMoving = false;
        },
        
        // Matar player
kill: function() {
    if (this.isDead) return;
    
    this.isDead = true;
    this.isDashing = false;
    this.deathFrame = Math.floor(Math.random() * 4) + 12;
    
    // Tocar som de morte
    if (MadNight.audio && MadNight.audio.playDeathSound) {
        MadNight.audio.playDeathSound('player');
    }
    
    // Shake da câmera
    if (MadNight.camera && MadNight.camera.shake) {
        MadNight.camera.shake(20);
    }
    
    // IMPORTANTE: Delegar o controle de mortes para o game.js
    if (MadNight.game && MadNight.game.handlePlayerDeath) {
        MadNight.game.handlePlayerDeath();
    }
},
        
        // Respawn do player
        respawn: function() {
            const gameState = MadNight.game.state;
            
            console.log(`Respawnando... (Morte ${gameState.deathCount}/${MadNight.config.gameplay.maxDeaths})`);
            
            // Recarregar mapa atual mantendo o estado
            if (MadNight.maps && MadNight.maps.loadCurrentMap) {
                MadNight.maps.loadCurrentMap(gameState.phase === 'escape');
            } else if (MadNight.game && MadNight.game.loadMap) {
                MadNight.game.loadMap(gameState.currentMap, gameState.phase === 'escape');
            }
        },

        // Atualizar player
        update: function(keys) {
            if (this.isDead) return;
            
            const gameState = MadNight.game.state;
            
            // Verificar se está na sombra
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            if (MadNight.lighting && MadNight.lighting.isInShadow) {
                this.inShadow = MadNight.lighting.isInShadow(centerX, centerY);
            }
            
            let moving = false;
            let dx = 0, dy = 0;
            
            // Processar dash
            if (this.isDashing) {
                this.processDash();
            } else {
                // Movimento normal
                if (keys['ArrowUp']) {
                    dy = -1;
                    this.direction = 'up';
                    moving = true;
                }
                if (keys['ArrowDown']) {
                    dy = 1;
                    this.direction = 'down';
                    moving = true;
                }
                if (keys['ArrowLeft']) {
                    dx = -1;
                    this.direction = 'left';
                    moving = true;
                }
                if (keys['ArrowRight']) {
                    dx = 1;
                    this.direction = 'right';
                    moving = true;
                }
                
                // Aplicar movimento
                if (dx !== 0) {
                    const newX = this.x + dx * this.speed;
                    if (!MadNight.collision || !MadNight.collision.checkWallCollision ||
                        !MadNight.collision.checkWallCollision(this, newX, this.y)) {
                        this.x = newX;
                    }
                }
                
                if (dy !== 0) {
                    const newY = this.y + dy * this.speed;
                    if (!MadNight.collision || !MadNight.collision.checkWallCollision ||
                        !MadNight.collision.checkWallCollision(this, this.x, newY)) {
                        this.y = newY;
                    }
                }
                
                // Iniciar dash
                if (keys[' '] && gameState.pedalPower > 0 && 
                    !this.isDashing && gameState.dashUnlocked) {
                    this.startDash();
                }
            }
            
            // Limitar aos bounds do mapa
            const map = MadNight.maps ? MadNight.maps.getCurrentMap() : null;
            if (map) {
                this.x = Math.max(0, Math.min(map.width - this.width, this.x));
                this.y = Math.max(0, Math.min(map.height - this.height, this.y));
            }
            
            // Atualizar estado de movimento
            this.isMoving = moving || this.isDashing;
            
            // Atualizar último movimento
            if (this.isMoving) {
                this.lastMove = Date.now();
            }
            
            // Recarregar pedal power
            this.updatePedalPower();
            
            // Atualizar frame de animação
            if (moving && !this.isDashing) {
                if (!this.lastFrameTime) this.lastFrameTime = Date.now();
                if (Date.now() - this.lastFrameTime > MadNight.config.animation.frameDelay) {
                    this.frame = (this.frame + 1) % 2;
                    this.lastFrameTime = Date.now();
                }
            }
            
            // Verificar interações especiais
            this.checkInteractions();
        },
        
        // Iniciar dash
        startDash: function() {
            const gameState = MadNight.game.state;
            
            if (gameState.pedalPower <= 0) return;
            
            this.isDashing = true;
            this.dashStart = Date.now();
            this.dashStartX = this.x;
            this.dashStartY = this.y;
            
            // Usar pedal power
            if (MadNight.game.usePedal) {
                MadNight.game.usePedal();
            } else {
                gameState.pedalPower--;
            }
            
            // Tocar som
            if (MadNight.audio && MadNight.audio.playSFX) {
                MadNight.audio.playSFX('dash', 0.6);
            }
            
            console.log(`Dash! Pedal Power: ${gameState.pedalPower}`);
        },
        
        // Processar movimento do dash
        processDash: function() {
            const progress = (Date.now() - this.dashStart) / this.dashDuration;
            
            if (progress >= 1) {
                this.isDashing = false;
                return;
            }
            
            const dashSpeed = this.dashDistance / this.dashDuration * 16;
            let dashDx = 0, dashDy = 0;
            
            switch(this.direction) {
                case 'up': dashDy = -dashSpeed; break;
                case 'down': dashDy = dashSpeed; break;
                case 'left': dashDx = -dashSpeed; break;
                case 'right': dashDx = dashSpeed; break;
            }
            
            // Tentar mover com dash
            if (!MadNight.collision || !MadNight.collision.checkWallCollision ||
                !MadNight.collision.checkWallCollision(this, this.x + dashDx, this.y + dashDy)) {
                this.x += dashDx;
                this.y += dashDy;
            } else {
                // Parar dash se colidir
                this.isDashing = false;
            }
        },
        
        // Atualizar pedal power
        updatePedalPower: function() {
            const gameState = MadNight.game.state;
            const config = MadNight.config.gameplay;
            
            // Recarregar se parado
            if (!this.isMoving && gameState.pedalPower < config.maxPedalPower) {
                if (!this.lastRechargeTime) this.lastRechargeTime = Date.now();
                
                if (Date.now() - this.lastMove > config.pedalRechargeDelay) {
                    if (Date.now() - this.lastRechargeTime > config.pedalRechargeTime) {
                        gameState.pedalPower++;
                        this.lastRechargeTime = Date.now();
                        console.log(`Pedal recarregado: ${gameState.pedalPower}/${config.maxPedalPower}`);
                    }
                }
            } else {
                this.lastRechargeTime = Date.now();
            }
        },
        
        // Verificar interações com objetos especiais
        checkInteractions: function() {
            const map = MadNight.maps ? MadNight.maps.getCurrentMap() : null;
            const gameState = MadNight.game ? MadNight.game.state : null;
            
            if (!map || !gameState) return;
            
            // Verificar proximidade do orelhão
            if (map.orelhao && !gameState.dashUnlocked) {
                const orelhaoCenter = {
                    x: map.orelhao.x + map.orelhao.w / 2,
                    y: map.orelhao.y + map.orelhao.h / 2
                };
                const playerCenter = {
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2
                };
                
                const distance = Math.sqrt(
                    Math.pow(playerCenter.x - orelhaoCenter.x, 2) + 
                    Math.pow(playerCenter.y - orelhaoCenter.y, 2)
                );
                
                // Tocar telefone quando próximo
                if (distance < 150) {
                    if (MadNight.audio && MadNight.audio.sfx && 
                        MadNight.audio.sfx.phone_ring && 
                        MadNight.audio.sfx.phone_ring.paused) {
                        MadNight.audio.sfx.phone_ring.play().catch(() => {});
                    }
                }
                // Parar se afastar
                else if (distance > 200) {
                    if (MadNight.audio && MadNight.audio.sfx && 
                        MadNight.audio.sfx.phone_ring && 
                        !MadNight.audio.sfx.phone_ring.paused) {
                        MadNight.audio.sfx.phone_ring.pause();
                    }
                }
                
                // Atender telefone
                if (MadNight.collision && MadNight.collision.checkRectCollision &&
                    MadNight.collision.checkRectCollision(this, map.orelhao)) {
                    gameState.dashUnlocked = true;
                    if (MadNight.audio && MadNight.audio.stopLoopSFX) {
                        MadNight.audio.stopLoopSFX('phone_ring');
                    }
                    console.log('Dash desbloqueado!');
                }
            }
            
            // Verificar lixeira para bomba
            if (map.lixeira && MadNight.collision && MadNight.collision.checkRectCollision &&
                MadNight.collision.checkRectCollision(this, map.lixeira)) {
                
                const aliveEnemies = MadNight.enemies ? MadNight.enemies.getAliveCount() : 0;
                
                if (!gameState.bombPlaced && aliveEnemies === 0) {
                    gameState.bombPlaced = true;
                    gameState.phase = 'escape';
                    gameState.lastEnemySpawn = Date.now();
                    
                    if (MadNight.audio && MadNight.audio.playMusic) {
                        MadNight.audio.playMusic('fuga');
                    }
                    console.log('Bomba plantada! FUJA!');
                }
            }
            
            // Verificar saída do mapa
            if (map.exit && MadNight.collision && MadNight.collision.checkRectCollision &&
                MadNight.collision.checkRectCollision(this, map.exit)) {
                
                if (MadNight.game && MadNight.game.handleMapExit) {
                    MadNight.game.handleMapExit();
                }
            }
        },
        
        // Obter sprite atual
        getSprite: function() {
            if (!this.sprites || this.sprites.length === 0) return null;
            
            if (this.isDead) {
                return this.sprites[this.deathFrame] || null;
            }
            
            const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
            const base = dirMap[this.direction] || 0;
            
            if (this.isDashing) {
                return this.sprites[8 + base] || null;
            }
            
            return this.sprites[base + this.frame * 4] || null;
        },
        
        // Renderizar player
        render: function(ctx) {
            // Verificar se sprites estão carregados
            if (MadNight.assets && MadNight.assets.areSpritesLoaded && 
                MadNight.assets.areSpritesLoaded('madmax')) {
                
                const sprite = this.getSprite();
                if (sprite) {
                    ctx.save();
                    
                    // Aplicar transparência se na sombra
                    if (this.inShadow) {
                        ctx.globalAlpha = 0.5;
                    }
                    
                    ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                    ctx.restore();
                } else {
                    // Fallback se sprite específico não carregar
                    this.renderFallback(ctx);
                }
            } else {
                // Fallback se sprites não carregaram
                this.renderFallback(ctx);
            }
        },
        
        // Renderizar fallback (quadrado colorido)
        renderFallback: function(ctx) {
            ctx.save();
            
            ctx.fillStyle = this.isDashing ? '#ff0' : 
                          (this.isDead ? '#800' : '#f00');
            
            if (this.inShadow) {
                ctx.globalAlpha = 0.5;
            }
            
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Indicador de direção
            ctx.fillStyle = '#fff';
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            switch(this.direction) {
                case 'up':
                    ctx.fillRect(centerX - 2, this.y, 4, 10);
                    break;
                case 'down':
                    ctx.fillRect(centerX - 2, this.y + this.height - 10, 4, 10);
                    break;
                case 'left':
                    ctx.fillRect(this.x, centerY - 2, 10, 4);
                    break;
                case 'right':
                    ctx.fillRect(this.x + this.width - 10, centerY - 2, 10, 4);
                    break;
            }
            
            ctx.restore();
        },
        
        // Definir posição
        setPosition: function(x, y) {
            this.x = x;
            this.y = y;
            this.isDead = false;
            this.isDashing = false;
        }
    };
    
    console.log('Módulo Player carregado');
    
})();
