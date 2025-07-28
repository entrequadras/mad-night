console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Estado do jogo
const gameState = {
    deaths: 0,
    pedalPower: 4,
    maxPedalPower: 4
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
    deathFrame: 12
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
        
        // Ver se encontra o player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < this.visionRange && !player.isDead) {
            // Perseguir
            this.state = 'chase';
            this.x += (dx/dist) * this.speed;
            this.y += (dy/dist) * this.speed;
            
            // Atualizar direção
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            // Checar colisão
            if (dist < 30) {
                killPlayer();
            }
        } else {
            this.state = 'patrol';
        }
        
        // Animação
        if (Date.now() % 400 < 200) {
            this.frame = 0;
        } else {
            this.frame = 1;
        }
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

// MadMax sprites
for (let i = 0; i <= 15; i++) {
    const img = new Image();
    img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
    img.onload = () => madmaxLoaded++;
    player.sprites[i] = img;
}

// Faquinha sprites (para todos os inimigos)
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
    
    // E - adicionar inimigo
    if (e.key === 'e' || e.key === 'E') {
        const enemy = new Enemy(player.x + 150, player.y);
        enemy.sprites = faquinhaSprites;
        enemies.push(enemy);
        console.log('Inimigo adicionado!');
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Matar player
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
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
    player.frame = 0;
}

// Atualizar
let lastFrameTime = 0;
function update() {
    // Atualizar inimigos
    enemies.forEach(enemy => enemy.update());
    
    if (player.isDead) return;
    
    let moving = false;
    
    if (keys['ArrowUp']) {
        player.y -= player.speed;
        player.direction = 'up';
        moving = true;
    }
    if (keys['ArrowDown']) {
        player.y += player.speed;
        player.direction = 'down';
        moving = true;
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.direction = 'left';
        moving = true;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.direction = 'right';
        moving = true;
    }
    
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    if (moving && Date.now() - lastFrameTime > 150) {
        player.frame = (player.frame + 1) % 2;
        lastFrameTime = Date.now();
    }
}

// Sprite do player
function getPlayerSprite() {
    if (player.isDead) return player.sprites[player.deathFrame];
    
    const dirMap = {'right': 0, 'down': 1, 'left': 2, 'up': 3};
    const base = dirMap[player.direction];
    const offset = player.frame * 4;
    
    return player.sprites[base + offset];
}

// Desenhar
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(50, 50, 700, 500);
    
    // Desenhar inimigos
    enemies.forEach(enemy => {
        if (faquinhaLoaded >= 16) {
            const sprite = enemy.getSprite();
            if (sprite) {
                ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
            }
        } else {
            ctx.fillStyle = enemy.state === 'chase' ? '#f0f' : '#808';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        
        // Estado do inimigo
        ctx.fillStyle = enemy.state === 'chase' ? '#ff0' : '#0f0';
        ctx.font = '10px Arial';
        ctx.fillText(enemy.state, enemy.x, enemy.y - 5);
    });
    
    // Desenhar player
    if (madmaxLoaded >= 16) {
        const sprite = getPlayerSprite();
        if (sprite) {
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        }
    } else {
        ctx.fillStyle = player.isDead ? '#800' : '#f00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('Setas: mover | K: morrer | E: adicionar inimigo', 10, 25);
    ctx.fillText(`Mortes: ${gameState.deaths}/5 | Inimigos: ${enemies.length}`, 10, 45);
    
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
    console.log('2 inimigos criados!');
}, 1000);

gameLoop();
console.log('E: adicionar inimigo | Inimigos perseguem quando você chega perto!');
