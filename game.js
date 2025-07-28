console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Estado do jogo
const gameState = {
    deaths: 0,
    pedalPower: 4,
    maxPedalPower: 4,
    lastRecharge: Date.now()
};

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3,
    direction: 'right',
    frame: 0,
    sprites: [],
    isDead: false,
    deathFrame: 12,
    isDashing: false,
    dashStart: 0,
    dashDuration: 200, // Dash mais curto
    dashDistance: 80,  // Distância fixa do dash
    dashStartX: 0,
    dashStartY: 0,
    lastMove: Date.now()
};

// Inimigos
const enemies = [];

// Classe Inimigo
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 56;
        this.height = 56;
        this.speed = 2;
        this.direction = 'down';
        this.frame = 0;
        this.state = 'patrol';
        this.isDead = false;
        this.deathFrame = 12;
        this.sprites = [];
        this.visionRange = 150;
    }
    
    update() {
        if (this.isDead) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < this.visionRange && !player.isDead) {
            this.state = 'chase';
            this.x += (dx/dist) * this.speed;
            this.y += (dy/dist) * this.speed;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            // Mata mesmo durante dash (sem invencibilidade)
            if (dist < 30) {
                killPlayer();
            }
        } else {
            this.state = 'patrol';
        }
        
        // Checar colisão durante dash do player
        if (player.isDashing && dist < 40) {
            this.die();
        }
        
        if (Date.now() % 400 < 200) {
            this.frame = 0;
        } else {
            this.frame = 1;
        }
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathFrame = Math.floor(Math.random() * 4) + 12;
        console.log('Inimigo morto! Frame:', this.deathFrame);
    }
    
    getSprite() {
        if (this.isDead) return this.sprites[this.deathFrame];
        
        const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
        const base = dirMap[this.direction];
        const offset = this.state === 'chase' ? 8 : this.frame * 4;
        
        return this.sprites[base + offset];
    }
}

// Teclas
const keys = {};

// Carregar sprites
let madmaxLoaded = 0;
let faquinhaLoaded = 0;

for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
    img.onload = () => madmaxLoaded++;
    player.sprites[i] = img;
}

const faquinhaSprites = [];
for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
    img.onload = () => faquinhaLoaded++;
    faquinhaSprites[i] = img;
}

// Detectar teclas
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'k' || e.key === 'K') killPlayer();
    
    if (e.key === 'e' || e.key === 'E') {
        const enemy = new Enemy(player.x + 150, player.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Matar player
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.isDashing = false;
    player.deathFrame = Math.floor(Math.random() * 4) + 12;
    gameState.deaths++;
    
    setTimeout(() => {
        if (gameState.deaths >= 5) {
            gameState.deaths = 0;
            enemies.length = 0;
        }
        resetPlayer();
    }, 2000);
}

// Resetar player
function resetPlayer() {
    player.x = 100;
    player.y = 300;
    player.isDead = false;
    player.isDashing = false;
    player.frame = 0;
    gameState.pedalPower = gameState.maxPedalPower;
}

// Atualizar
let lastFrameTime = 0;
function update() {
    // Atualizar inimigos
    enemies.forEach(enemy => enemy.update());
    
    // Remover inimigos mortos após 2 segundos
    enemies.forEach((enemy, index) => {
        if (enemy.isDead && !enemy.removeTime) {
            enemy.removeTime = Date.now() + 2000;
        }
        if (enemy.removeTime && Date.now() > enemy.removeTime) {
            enemies.splice(index, 1);
        }
    });
    
    if (player.isDead) return;
    
    let moving = false;
    let dx = 0;
    let dy = 0;
    
    // Durante o dash, movimento automático
    if (player.isDashing) {
        const progress = (Date.now() - player.dashStart) / player.dashDuration;
        
        if (progress >= 1) {
            player.isDashing = false;
        } else {
            // Movimento do dash baseado na direção
            const dashSpeed = player.dashDistance / player.dashDuration * 16;
            switch(player.direction) {
                case 'up': player.y -= dashSpeed; break;
                case 'down': player.y += dashSpeed; break;
                case 'left': player.x -= dashSpeed; break;
                case 'right': player.x += dashSpeed; break;
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
        
        player.x += dx * player.speed;
        player.y += dy * player.speed;
        
        // Dash com espaço
        if (keys[' '] && gameState.pedalPower > 0 && !player.isDashing) {
            player.isDashing = true;
            player.dashStart = Date.now();
            player.dashStartX = player.x;
            player.dashStartY = player.y;
            gameState.pedalPower--;
            console.log('Dash! Pedal:', gameState.pedalPower);
        }
    }
    
    // Recarregar pedal
    if (moving || player.isDashing) {
        player.lastMove = Date.now();
    } else if (Date.now() - player.lastMove > 1000) {
        if (Date.now() - gameState.lastRecharge > 6000 && gameState.pedalPower < gameState.maxPedalPower) {
            gameState.pedalPower++;
            gameState.lastRecharge = Date.now();
            console.log('Pedal recarregado:', gameState.pedalPower);
        }
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    if (moving && !player.isDashing && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}

// Sprite do player
function getPlayerSprite() {
    if (player.isDead) return player.sprites[player.deathFrame];
    
    const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
    const base = dirMap[player.direction];
    
    if (player.isDashing) {
        return player.sprites[8 + base];
    }
    
    const offset = player.frame * 4;
    return player.sprites[base + offset];
}

// Desenhar
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(50, 50, 700, 500);
    
    // Inimigos
    enemies.forEach(enemy => {
        if (faquinhaLoaded >= 16) {
            const sprite = enemy.getSprite();
            if (sprite) {
                ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
            }
        } else {
            if (!enemy.isDead) {
                ctx.fillStyle = enemy.state === 'chase' ? '#f0f' : '#808';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
        
        if (!enemy.isDead) {
            ctx.fillStyle = enemy.state === 'chase' ? '#ff0' : '#0f0';
            ctx.font = '10px Arial';
            ctx.fillText(enemy.state, enemy.x, enemy.y - 5);
        }
    });
    
    // Player
    if (madmaxLoaded >= 16) {
        const sprite = getPlayerSprite();
        if (sprite) {
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        }
    } else {
        ctx.fillStyle = player.isDashing ? '#ff0' : (player.isDead ? '#800' : '#f00');
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('Setas: mover | ESPAÇO: dash | K: morrer | E: add inimigo', 10, 25);
    ctx.fillText(`Mortes: ${gameState.deaths}/5 | Inimigos vivos: ${enemies.filter(e => !e.isDead).length}`, 10, 45);
    
    // Barra de pedal
    ctx.fillText('Força de Pedal: ', 10, 65);
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
        ctx.fillText('█', 120 + i * 12, 65);
    }
    
    if (player.isDead) {
        ctx.fillStyle = '#f00';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        const msg = gameState.deaths < 5 ? "ah véi, se liga carái" : "sifudêu";
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar com 2 inimigos
setTimeout(() => {
    for (let i = 0; i < 2; i++) {
        const enemy = new Enemy(400 + i*100, 300);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
    }
}, 1000);

gameLoop();
console.log('ESPAÇO para dash curto!');
