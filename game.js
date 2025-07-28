// Adicionar estas modificações ao game.js existente

// Primeiro, adicionar os arrays de sprites no início do arquivo, junto com faquinhaSprites:
const caveirinhaSprites = [];
const janisSprites = [];
const chacalSprites = [];

// Adicionar no carregamento de sprites (após o carregamento do faquinha):
for (let i = 0; i <= 15; i++) {
    const imgCaveirinha = new Image();
    imgCaveirinha.src = `assets/sprites/caveirinha${String(i).padStart(3, '0')}.png`;
    imgCaveirinha.onload = () => caveirinhaLoaded++;
    caveirinhaSprites[i] = imgCaveirinha;
}

for (let i = 0; i <= 15; i++) {
    const imgJanis = new Image();
    imgJanis.src = `assets/sprites/janis${String(i).padStart(3, '0')}.png`;
    imgJanis.onload = () => janisLoaded++;
    janisSprites[i] = imgJanis;
}

for (let i = 0; i <= 15; i++) {
    const imgChacal = new Image();
    imgChacal.src = `assets/sprites/chacal${String(i).padStart(3, '0')}.png`;
    imgChacal.onload = () => chacalLoaded++;
    chacalSprites[i] = imgChacal;
}

// Adicionar contadores de carregamento:
let caveirinhaLoaded = 0;
let janisLoaded = 0;
let chacalLoaded = 0;

// Modificar a classe Enemy para suportar tipos diferentes:
class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.width = 56;
        this.height = 56;
        this.type = type;
        this.speed = type === 'caveirinha' ? 2.5 : 2; // Caveirinha é mais rápido
        this.patrolSpeed = 1;
        this.direction = 'down';
        this.frame = 0;
        this.state = 'patrol';
        this.isDead = false;
        this.deathFrame = 12;
        this.sprites = [];
        this.visionRange = 150;
        this.alertVisionRange = 200;
        this.patrolRadius = 150;
        this.patrolDirection = this.getRandomDirection();
        this.lastDirectionChange = Date.now();
        this.directionChangeInterval = 2000 + Math.random() * 2000;
        
        // Específico para Janis
        this.attackRange = 200;
        this.lastAttack = 0;
        this.attackCooldown = 2000; // 2 segundos entre ataques
        
        // Específico para Chacal (Boss)
        this.health = type === 'chacal' ? 3 : 1;
        this.maxHealth = this.health;
        this.isInvulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 500; // 0.5 segundos de invulnerabilidade após hit
    }
    
    // Adicionar método de ataque para Janis
    throwStone() {
        if (this.type !== 'janis' || Date.now() - this.lastAttack < this.attackCooldown) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < this.attackRange && !player.isDead) {
            this.lastAttack = Date.now();
            
            // Criar projétil (pedra)
            const stone = {
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: (dx/dist) * 4, // Velocidade da pedra
                vy: (dy/dist) * 4,
                width: 10,
                height: 10,
                active: true
            };
            
            projectiles.push(stone);
            console.log('Janis atacou! Pedra lançada!');
        }
    }
    
    update() {
        if (this.isDead) return;
        
        // Atualizar invulnerabilidade (para Chacal)
        if (this.isInvulnerable && Date.now() - this.invulnerableTime > this.invulnerableDuration) {
            this.isInvulnerable = false;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let visionRange = this.state === 'chase' ? this.alertVisionRange : this.visionRange;
        if (player.inShadow) visionRange *= 0.3;
        
        // Comportamento específico da Janis
        if (this.type === 'janis') {
            if (dist < this.attackRange && !player.isDead) {
                this.state = 'attack';
                this.throwStone();
                
                // Janis fica parada enquanto ataca
                this.direction = Math.abs(dx) > Math.abs(dy) ? 
                    (dx > 0 ? 'right' : 'left') : 
                    (dy > 0 ? 'down' : 'up');
            } else {
                this.state = 'patrol';
                // Continua com comportamento normal de patrulha
            }
        }
        
        // Comportamento do Chacal (sempre persegue quando vê)
        if (this.type === 'chacal' && dist < 300 && !player.isDead) {
            this.state = 'chase';
        }
        
        // Comportamento padrão (Faquinha e Caveirinha)
        if (this.type !== 'janis' && dist < visionRange && !player.isDead) {
            let canSee = false;
            
            switch(this.direction) {
                case 'up': canSee = dy < 0 && Math.abs(dx) < 50; break;
                case 'down': canSee = dy > 0 && Math.abs(dx) < 50; break;
                case 'left': canSee = dx < 0 && Math.abs(dy) < 50; break;
                case 'right': canSee = dx > 0 && Math.abs(dy) < 50; break;
            }
            
            if (this.state === 'chase' || canSee || this.type === 'chacal') {
                this.state = 'chase';
                const moveX = (dx/dist) * this.speed;
                const moveY = (dy/dist) * this.speed;
                
                if (!checkWallCollision(this, this.x + moveX, this.y)) {
                    this.x += moveX;
                }
                if (!checkWallCollision(this, this.x, this.y + moveY)) {
                    this.y += moveY;
                }
                
                this.direction = Math.abs(dx) > Math.abs(dy) ? 
                    (dx > 0 ? 'right' : 'left') : 
                    (dy > 0 ? 'down' : 'up');
                
                if (dist < 30) killPlayer();
            }
        } else if (this.type !== 'janis') {
            this.state = 'patrol';
            
            // Sistema de patrulha (exceto para Janis em modo ataque)
            if (Date.now() - this.lastDirectionChange > this.directionChangeInterval) {
                this.patrolDirection = this.getRandomDirection();
                this.lastDirectionChange = Date.now();
                this.directionChangeInterval = 2000 + Math.random() * 2000;
                this.direction = this.patrolDirection;
            }
            
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
                this.patrolDirection = this.getRandomDirection();
                this.lastDirectionChange = Date.now();
                this.direction = this.patrolDirection;
            }
        }
        
        // Dash mata inimigos normais, mas apenas dá dano no Chacal
        if (player.isDashing && dist < 40 && !this.isInvulnerable) {
            if (this.type === 'chacal') {
                this.takeDamage();
            } else {
                this.die();
            }
        }
        
        this.frame = Date.now() % 400 < 200 ? 0 : 1;
    }
    
    takeDamage() {
        if (this.isInvulnerable) return;
        
        this.health--;
        this.isInvulnerable = true;
        this.invulnerableTime = Date.now();
        
        console.log(`Chacal tomou dano! Vida: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.die();
            console.log('CHACAL DERROTADO!');
        }
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        
        const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        const offset = (this.state === 'chase' || this.state === 'attack') ? 8 : this.frame * 4;
        
        return this.sprites[base + offset];
    }
}

// Array global para projéteis (pedras da Janis)
const projectiles = [];

// Adicionar função para atualizar projéteis
function updateProjectiles() {
    projectiles.forEach((stone, index) => {
        if (!stone.active) return;
        
        stone.x += stone.vx;
        stone.y += stone.vy;
        
        // Checar colisão com player
        if (stone.x < player.x + player.width &&
            stone.x + stone.width > player.x &&
            stone.y < player.y + player.height &&
            stone.y + stone.height > player.y) {
            killPlayer();
            stone.active = false;
        }
        
        // Checar se saiu da tela
        const map = maps[gameState.currentMap];
        if (stone.x < 0 || stone.x > map.width || stone.y < 0 || stone.y > map.height) {
            stone.active = false;
        }
        
        // Checar colisão com paredes
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

// Modificar a função loadMap para carregar os sprites corretos:
function loadMap(mapIndex, isEscape = false) {
    const map = maps[mapIndex];
    if (!map) return;
    
    enemies.length = 0;
    projectiles.length = 0; // Limpar projéteis
    
    if (isEscape && map.playerStartEscape) {
        player.x = map.playerStartEscape.x;
        player.y = map.playerStartEscape.y;
    } else {
        player.x = map.playerStart.x;
        player.y = map.playerStart.y;
    }
    
    player.isDead = false;
    player.isDashing = false;
    
    const enemyList = (isEscape && map.escapeEnemies) ? map.escapeEnemies : map.enemies;
    
    enemyList.forEach(enemyData => {
        const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.type || 'faquinha');
        
        // Atribuir sprites corretos baseado no tipo
        switch(enemy.type) {
            case 'faquinha':
                enemy.sprites = faquinhaSprites;
                break;
            case 'caveirinha':
                enemy.sprites = caveirinhaSprites;
                break;
            case 'janis':
                enemy.sprites = janisSprites;
                break;
            case 'chacal':
                enemy.sprites = chacalSprites;
                enemy.width = 84; // Chacal é maior
                enemy.height = 84;
                break;
        }
        
        if (isEscape) enemy.state = 'chase';
        enemies.push(enemy);
    });
}

// No update principal, adicionar:
function update() {
    // ... código existente ...
    
    // Atualizar projéteis
    updateProjectiles();
    
    // ... resto do código ...
}

// No draw, adicionar renderização dos projéteis:
function draw() {
    // ... código existente de renderização ...
    
    // Desenhar projéteis (após desenhar inimigos, antes do player)
    projectiles.forEach(stone => {
        ctx.fillStyle = '#888';
        ctx.fillRect(stone.x, stone.y, stone.width, stone.height);
    });
    
    // ... resto do código ...
}

// Exemplo de como adicionar os novos inimigos nos mapas:
// No mapa 1 (Maconhão), adicionar uma Janis:
maps[0].enemies = [
    {x: 400, y: 300, type: 'janis'}
];

// No mapa 3, adicionar o Chacal durante a fuga:
maps[2].escapeEnemies = [
    {x: 400, y: 300, type: 'chacal'}, // Boss
    {x: 200, y: 200, type: 'caveirinha'},
    {x: 600, y: 400, type: 'caveirinha'}
];
