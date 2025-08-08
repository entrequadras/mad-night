// enemy.js - Sistema de Inimigos

class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.type = type;
        this.width = CONFIG.ENEMY_WIDTH;
        this.height = CONFIG.ENEMY_HEIGHT;
        this.speed = type === 'caveirinha' ? 2.5 : CONFIG.ENEMY_SPEED;
        this.patrolSpeed = CONFIG.ENEMY_PATROL_SPEED;
        this.direction = 'down';
        this.frame = 0;
        this.state = 'patrol';
        this.isDead = false;
        this.deathFrame = 12;
        this.sprites = [];
        this.visionRange = CONFIG.ENEMY_VISION_RANGE;
        this.alertVisionRange = CONFIG.ENEMY_ALERT_VISION_RANGE;
        this.patrolRadius = CONFIG.ENEMY_PATROL_RADIUS;
        this.patrolDirection = this.getRandomDirection();
        this.lastDirectionChange = Date.now();
        this.directionChangeInterval = 2000 + Math.random() * 2000;
        
        // Atributos específicos por tipo
        if (type === 'janis') {
            this.attackRange = 200;
            this.lastAttack = 0;
            this.attackCooldown = 2000;
        }
        
        if (type === 'chacal') {
            this.health = 3;
            this.maxHealth = 3;
            this.isInvulnerable = false;
            this.invulnerableTime = 0;
            this.invulnerableDuration = 500;
        } else {
            this.health = 1;
            this.maxHealth = 1;
        }
        
        // Carregar sprites apropriados
        this.loadSprites();
    }
    
    loadSprites() {
        // Sprites são carregados globalmente e atribuídos ao criar o inimigo
        switch(this.type) {
            case 'faquinha':
                this.sprites = enemySprites.faquinha;
                break;
            case 'morcego':
                this.sprites = enemySprites.morcego;
                break;
            case 'caveirinha':
                this.sprites = enemySprites.caveirinha;
                break;
            case 'janis':
                this.sprites = enemySprites.janis;
                break;
            case 'chacal':
                this.sprites = enemySprites.chacal;
                break;
        }
    }
    
    getRandomDirection() {
        const dirs = ['up', 'down', 'left', 'right'];
        return dirs[Math.floor(Math.random() * dirs.length)];
    }
    
    throwStone() {
        if (this.type !== 'janis' || Date.now() - this.lastAttack < this.attackCooldown) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < this.attackRange && !player.isDead) {
            this.lastAttack = Date.now();
            
            const stone = {
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: (dx/dist) * 4,
                vy: (dy/dist) * 4,
                width: 10,
                height: 10,
                active: true
            };
            
            projectiles.push(stone);
            audio.playSFX('ataque_janis', 0.5);
        }
    }
    
    update() {
        if (this.isDead) return;
        
        // Invulnerabilidade (para Chacal)
        if (this.isInvulnerable && Date.now() - this.invulnerableTime > this.invulnerableDuration) {
            this.isInvulnerable = false;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Ajustar visão baseado em sombra
        let visionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
        if (player.inShadow) visionRange *= 0.3;
        
        // Comportamento específico do Janis
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
        
        // Chacal sempre persegue quando próximo
        if (this.type === 'chacal' && dist < 300 && !player.isDead) {
            this.state = 'chase';
        }
        
        // Detecção e perseguição para outros tipos
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
            
            if (this.state === 'chase' || canSee || this.type === 'chacal') {
                this.state = 'chase';
                
                // Mover em direção ao player
                const angle = Math.atan2(dy, dx);
                const moveX = Math.cos(angle) * this.speed;
                const moveY = Math.sin(angle) * this.speed;
                
                if (!checkWallCollision(this, this.x + moveX, this.y)) {
                    this.x += moveX;
                }
                
                if (!checkWallCollision(this, this.x, this.y + moveY)) {
                    this.y += moveY;
                }
                
                // Atualizar direção
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.direction = dx > 0 ? 'right' : 'left';
                } else {
                    this.direction = dy > 0 ? 'down' : 'up';
                }
                
                // Matar player se tocar
                if (dist < 30) killPlayer();
            }
        } else if (this.type !== 'janis' || this.state !== 'attack') {
            // Patrulha
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
        
        // Animação
        this.frame = Date.now() % 400 < 200 ? 0 : 1;
    }
    
    patrol() {
        // Mudar direção periodicamente
        if (Date.now() - this.lastDirectionChange > this.directionChangeInterval) {
            this.patrolDirection = this.getRandomDirection();
            this.lastDirectionChange = Date.now();
            this.directionChangeInterval = 2000 + Math.random() * 2000;
            this.direction = this.patrolDirection;
        }
        
        // Voltar para origem se muito longe
        const distFromOrigin = Math.sqrt(
            Math.pow(this.x - this.originX, 2) + 
            Math.pow(this.y - this.originY, 2)
        );
        
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
        
        if (!checkWallCollision(this, this.x + pdx, this.y + pdy)) {
            this.x += pdx;
            this.y += pdy;
        } else {
            // Mudar direção se colidir
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
        
        // Som de morte baseado no tipo
        const deathSounds = {
            'faquinha': 'morte_faquinha',
            'morcego': 'morte_morcego', 
            'caveirinha': 'morte_caveira',
            'janis': 'morte_janis',
            'chacal': 'morte_chacal'
        };
        
        if (deathSounds[this.type]) {
            audio.playSFX(deathSounds[this.type], 0.6);
        }
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        
        const dirMap = {'down': 0, 'right': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        const offset = (this.state === 'chase' || this.state === 'attack') ? 8 : this.frame * 4;
        return this.sprites[base + offset];
    }
}

// Container global para sprites dos inimigos
const enemySprites = {
    faquinha: [],
    morcego: [],
    caveirinha: [],
    janis: [],
    chacal: []
};

// Carregar sprites dos inimigos
function loadEnemySprites() {
    const types = ['faquinha', 'morcego', 'caveirinha', 'janis', 'chacal'];
    
    types.forEach(type => {
        for (let i = 0; i <= 15; i++) {
            const img = new Image();
            img.src = `assets/sprites/${type}${String(i).padStart(3, '0')}.png`;
            img.onload = () => {
                // Sprite carregado
            };
            img.onerror = () => {
                console.warn(`⚠️ Sprite ${type}${String(i).padStart(3, '0')}.png não encontrado`);
            };
            enemySprites[type][i] = img;
        }
    });
}

// Spawnar inimigo durante fuga
function spawnEscapeEnemy() {
    const map = maps[gameState.currentMap];
    const corners = [
        {x: 50, y: 50, dir: 'down'},
        {x: map.width - 100, y: 50, dir: 'down'},
        {x: 50, y: map.height - 100, dir: 'up'},
        {x: map.width - 100, y: map.height - 100, dir: 'up'}
    ];
    
    const corner = corners[gameState.spawnCorner % 4];
    gameState.spawnCorner++;
    
    const types = ['faquinha', 'morcego', 'caveirinha', 'caveirinha'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const validPos = findValidSpawnPosition(corner.x, corner.y, CONFIG.ENEMY_WIDTH, CONFIG.ENEMY_HEIGHT);
    
    const enemy = new Enemy(validPos.x, validPos.y, randomType);
    enemy.state = 'chase';
    enemy.alertVisionRange = 400;
    
    // Definir direção inicial em direção ao centro
    const centerX = map.width / 2;
    const centerY = map.height / 2;
    enemy.direction = Math.abs(corner.x - centerX) > Math.abs(corner.y - centerY) ?
        (corner.x < centerX ? 'right' : 'left') :
        (corner.y < centerY ? 'down' : 'up');
    
    enemies.push(enemy);
}

// Atualizar todos os inimigos
function updateEnemies() {
    enemies.forEach(enemy => enemy.update());
    
    // Remover inimigos mortos após delay
    enemies.forEach((enemy, index) => {
        if (enemy.isDead && !enemy.removeTime) {
            enemy.removeTime = Date.now() + CONFIG.ENEMY_REMOVE_DELAY;
        }
        if (enemy.removeTime && Date.now() > enemy.removeTime) {
            enemies.splice(index, 1);
        }
    });
    
    // Spawn de inimigos durante fuga no mapa 5
    if (gameState.phase === 'escape' && gameState.currentMap === 5 && gameState.bombPlaced) {
        if (Date.now() - gameState.lastEnemySpawn > gameState.enemySpawnDelay) {
            spawnEscapeEnemy();
            gameState.lastEnemySpawn = Date.now();
        }
    }
}
