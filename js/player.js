// player.js - Sistema do player

MadNight.player = {
    // Propriedades do player
    x: 100,
    y: 300,
    width: MadNight.config.player.width,
    height: MadNight.config.player.height,
    speed: MadNight.config.player.speed,
    direction: 'right',
    frame: 0,
    sprites: [],
    
    // Estado
    isDead: false,
    deathFrame: 12,
    isDashing: false,
    dashStart: 0,
    dashDuration: MadNight.config.player.dashDuration,
    dashDistance: MadNight.config.player.dashDistance,
    dashStartX: 0,
    dashStartY: 0,
    lastMove: Date.now(),
    inShadow: false,
    
    // Inicializar player
    init: function() {
        this.sprites = MadNight.assets.sprites.madmax || [];
        this.reset();
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
    },
    
    // Matar player
    kill: function() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.isDashing = false;
        this.deathFrame = Math.floor(Math.random() * 4) + 12;
        
        // Incrementar contador de mortes
        const gameState = MadNight.game.state;
        gameState.deaths++;
        
        // Tocar som de morte
        MadNight.audio.playDeathSound('player');
        
        // Shake da câmera
        MadNight.camera.shake(20);
        
        // Respawn após 2 segundos
        setTimeout(() => {
            this.respawn();
        }, 2000);
    },
    
    // Respawn do player
    respawn: function() {
        const gameState = MadNight.game.state;
        
        if (gameState.deaths >= MadNight.config.gameplay.maxDeaths) {
            // Game over - voltar ao início
            MadNight.game.restart();
        } else {
            // Recarregar mapa atual
            MadNight.maps.loadCurrentMap(gameState.phase === 'escape');
        }
    },

    // Atualizar player
    update: function(keys) {
        if (this.isDead) return;
        
        const gameState = MadNight.game.state;
        
        // Verificar se está na sombra
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        this.inShadow = MadNight.lighting.isInShadow(centerX, centerY);
        
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
                if (!MadNight.collision.checkWallCollision(this, newX, this.y)) {
                    this.x = newX;
                }
            }
            
            if (dy !== 0) {
                const newY = this.y + dy * this.speed;
                if (!MadNight.collision.checkWallCollision(this, this.x, newY)) {
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
        const map = MadNight.maps.getCurrentMap();
        if (map) {
            this.x = Math.max(0, Math.min(map.width - this.width, this.x));
            this.y = Math.max(0, Math.min(map.height - this.height, this.y));
        }
        
        // Atualizar último movimento
        if (moving || this.isDashing) {
            this.lastMove = Date.now();
        }
        
        // Recarregar pedal power
        this.updatePedalPower();
        
        // Atualizar frame de animação
        if (moving && !this.isDashing && 
            Date.now() - gameState.lastFrameTime > MadNight.config.animation.frameDelay) {
            this.frame = (this.frame + 1) % 2;
            gameState.lastFrameTime = Date.now();
        }
        
        // Verificar interações especiais
        this.checkInteractions();
    },
    
    // Iniciar dash
    startDash: function() {
        const gameState = MadNight.game.state;
        
        this.isDashing = true;
        this.dashStart = Date.now();
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        
        gameState.pedalPower--;
        MadNight.audio.playSFX('dash', 0.6);
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
        if (!MadNight.collision.checkWallCollision(
            this, this.x + dashDx, this.y + dashDy
        )) {
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
        if (Date.now() - this.lastMove > config.pedalRechargeDelay) {
            if (Date.now() - gameState.lastRecharge > config.pedalRechargeTime && 
                gameState.pedalPower < gameState.maxPedalPower) {
                gameState.pedalPower++;
                gameState.lastRecharge = Date.now();
            }
        }
    },
    
    // Verificar interações com objetos especiais
    checkInteractions: function() {
        const map = MadNight.maps.getCurrentMap();
        const gameState = MadNight.game.state;
        
        if (!map) return;
        
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
            if (distance < 150 && MadNight.audio.sfx.phone_ring && 
                MadNight.audio.sfx.phone_ring.paused) {
                MadNight.audio.sfx.phone_ring.play().catch(() => {});
            }
            // Parar se afastar
            else if (distance > 200 && MadNight.audio.sfx.phone_ring && 
                     !MadNight.audio.sfx.phone_ring.paused) {
                MadNight.audio.sfx.phone_ring.pause();
            }
            
            // Atender telefone
            if (MadNight.collision.checkRectCollision(this, map.orelhao)) {
                gameState.dashUnlocked = true;
                MadNight.audio.stopLoopSFX('phone_ring');
            }
        }
        
        // Verificar lixeira para bomba
        if (map.lixeira && MadNight.collision.checkRectCollision(this, map.lixeira)) {
            if (!gameState.bombPlaced && MadNight.enemies.getAliveCount() === 0) {
                gameState.bombPlaced = true;
                gameState.phase = 'escape';
                gameState.lastEnemySpawn = Date.now();
                MadNight.audio.playMusic('fuga');
            }
        }
        
        // Verificar saída do mapa
        if (map.exit && MadNight.collision.checkRectCollision(this, map.exit)) {
            MadNight.game.handleMapExit();
        }
    },
    
    // Obter sprite atual
    getSprite: function() {
        if (this.isDead) {
            return this.sprites[this.deathFrame];
        }
        
        const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        
        if (this.isDashing) {
            return this.sprites[8 + base];
        }
        
        return this.sprites[base + this.frame * 4];
    },
    
    // Renderizar player
    render: function(ctx) {
        // Verificar se sprites estão carregados
        if (MadNight.assets.areSpritesLoaded('madmax')) {
            const sprite = this.getSprite();
            if (sprite) {
                ctx.save();
                
                // Aplicar transparência se na sombra
                if (this.inShadow) {
                    ctx.globalAlpha = 0.5;
                }
                
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                ctx.restore();
            }
        } else {
            // Fallback se sprites não carregaram
            ctx.save();
            
            ctx.fillStyle = this.isDashing ? '#ff0' : 
                          (this.isDead ? '#800' : '#f00');
            
            if (this.inShadow) {
                ctx.globalAlpha = 0.5;
            }
            
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    },
    
    // Definir posição
    setPosition: function(x, y) {
        this.x = x;
        this.y = y;
    }
};
