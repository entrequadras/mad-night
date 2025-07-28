// Sistema de console visual
const visualConsole = {
    messages: [],
    maxMessages: 20,
    
    log: function(message, color = '#0f0') {
        console.log(message); // Mantém o console normal também
        this.messages.push({ text: message, color: color, time: new Date().toLocaleTimeString() });
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        this.updateDisplay();
    },
    
    error: function(message) {
        console.error(message);
        this.log(message, '#f00');
    },
    
    updateDisplay: function() {
        const content = document.getElementById('consoleContent');
        if (content) {
            content.innerHTML = this.messages.map(msg => 
                `<div style="color: ${msg.color}">[${msg.time}] ${msg.text}</div>`
            ).join('');
            content.scrollTop = content.scrollHeight;
        }
    }
};

// Substituir console.log e console.error globalmente
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => {
    originalLog(...args);
    visualConsole.log(args.join(' '));
};
console.error = (...args) => {
    originalError(...args);
    visualConsole.error(args.join(' '));
};

// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // Mantém pixels nítidos

// Sistema de assets
const assets = {
    sprites: {
        madmax: [],
        faquinha: []
    },
    audio: {
        inicio: null,
        fuga: null,
        creditos: null
    },
    loaded: false
};

// Carregar assets
async function loadAssets() {
    try {
        // Carregar sprites do MadMax
        for (let i = 0; i <= 15; i++) {
            const img = new Image();
            img.src = `assets/sprites/madmax${String(i).padStart(3, '0')}.png`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            assets.sprites.madmax[i] = img;
        }
        
        // Carregar TODOS os sprites do Faquinha (0-15)
        console.log('Carregando sprites do Faquinha...');
        for (let i = 0; i <= 15; i++) {
            const img = new Image();
            const filename = `assets/sprites/faquinha${String(i).padStart(3, '0')}.png`;
            img.src = filename;
            try {
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        console.log(`✓ Carregado: ${filename}`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.error(`✗ Erro ao carregar: ${filename}`);
                        reject();
                    };
                });
                assets.sprites.faquinha[i] = img;
            } catch (error) {
                console.error(`Falha ao carregar sprite ${i} do Faquinha`);
                // Criar placeholder para não quebrar o jogo
                assets.sprites.faquinha[i] = null;
            }
        }
        
        // Carregar áudios
        assets.audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
        assets.audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
        assets.audio.creditos = new Audio('assets/audio/musica_etqgame_end_credits.mp3');
        
        // Configurar loops
        assets.audio.inicio.loop = true;
        assets.audio.fuga.loop = true;
        
        assets.loaded = true;
        console.log('Assets carregados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar assets:', error);
    }
}

// Estado do jogo
const gameState = {
    currentMap: 0,
    deaths: 0,
    dashUnlocked: false,
    pedalPower: 4,
    maxPedalPower: 4,
    pedalRechargeTime: 6000, // 6 segundos
    lastMoveTime: Date.now(),
    lastRechargeTime: Date.now(),
    phase: 'infiltration', // 'infiltration', 'escape'
    currentMusic: null
};

// Player
const player = {
    x: 100,
    y: 300,
    width: 56,
    height: 56,
    speed: 3,
    dashSpeed: 8,
    isDashing: false,
    dashDuration: 300,
    dashStartTime: 0,
    direction: 'right', // up, down, left, right
    frame: 0,
    animationSpeed: 150, // ms entre frames
    lastFrameTime: 0,
    isDead: false,
    deathFrame: 0
};

// Sistema de inimigos
const enemies = [];

// Classe base para inimigos
class Enemy {
    constructor(x, y, type = 'faquinha') {
        this.x = x;
        this.y = y;
        this.width = 56;
        this.height = 56;
        this.type = type;
        this.speed = 2;
        this.direction = 'down';
        this.frame = 0;
        this.animationSpeed = 200;
        this.lastFrameTime = 0;
        this.state = 'patrol'; // 'patrol', 'alert', 'chase'
        this.isDead = false;
        this.deathFrame = 0;
        this.visionRange = 150;
        this.visionAngle = Math.PI / 3; // 60 graus
        this.patrolTarget = { x: x, y: y };
        this.patrolRange = 100;
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Checar se vê o player
        if (this.canSeePlayer()) {
            this.state = 'alert';
        }
        
        // Comportamento baseado no estado
        switch (this.state) {
            case 'patrol':
                this.patrol();
                break;
            case 'alert':
            case 'chase':
                this.chasePlayer();
                break;
        }
        
        // Animação
        if (Date.now() - this.lastFrameTime > this.animationSpeed) {
            this.frame = (this.frame + 1) % 2;
            this.lastFrameTime = Date.now();
        }
        
        // Checar colisão com player
        if (this.checkCollisionWithPlayer()) {
            killPlayer();
        }
    }
    
    patrol() {
        // Movimento simples de patrulha (por enquanto, só fica parado)
        // Implementaremos movimento de patrulha depois
    }
    
    chasePlayer() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            
            // Atualizar direção baseado no movimento
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        }
    }
    
    canSeePlayer() {
        if (player.isDead) return false;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Fora do alcance de visão
        if (distance > this.visionRange) return false;
        
        // Calcular ângulo para o player
        const angleToPlayer = Math.atan2(dy, dx);
        
        // Ângulo que o inimigo está olhando
        const facingAngle = {
            'right': 0,
            'down': Math.PI / 2,
            'left': Math.PI,
            'up': -Math.PI / 2
        }[this.direction];
        
        // Diferença entre os ângulos
        let angleDiff = Math.abs(angleToPlayer - facingAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        // Está dentro do cone de visão?
        return angleDiff < this.visionAngle / 2;
    }
    
    checkCollisionWithPlayer() {
        if (player.isDead || player.isDashing) return false;
        
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
    
    die() {
        this.isDead = true;
        this.deathFrame = Math.floor(Math.random() * 4) + 12; // Frames 12-15
    }
    
    getSprite() {
        if (this.isDead) {
            return assets.sprites.faquinha[this.deathFrame];
        }
        
        const directionMap = {
            'right': 0,
            'down': 1,
            'left': 2,
            'up': 3
        };
        
        const baseIndex = directionMap[this.direction];
        
        if (this.state === 'alert' || this.state === 'chase') {
            // Sprites de alerta (8-11)
            return assets.sprites.faquinha[8 + baseIndex];
        } else {
            // Sprites normais (0-7)
            const offset = this.frame * 4;
            return assets.sprites.faquinha[baseIndex + offset];
        }
    }
}

// Sistema de input
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
        e.preventDefault();
    }
});

// Tocar música
function playMusic(musicName) {
    // Parar música atual
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    // Tocar nova música
    if (assets.audio[musicName]) {
        assets.audio[musicName].play().catch(e => {
            console.log('Erro ao tocar música:', e);
        });
        gameState.currentMusic = assets.audio[musicName];
    }
}

// Função de movimento do player
function updatePlayer(deltaTime) {
    if (player.isDead) return;
    
    let dx = 0;
    let dy = 0;
    let moving = false;
    
    // Movimento normal
    if (keys.ArrowUp) {
        dy = -1;
        player.direction = 'up';
        moving = true;
    }
    if (keys.ArrowDown) {
        dy = 1;
        player.direction = 'down';
        moving = true;
    }
    if (keys.ArrowLeft) {
        dx = -1;
        player.direction = 'left';
        moving = true;
    }
    if (keys.ArrowRight) {
        dx = 1;
        player.direction = 'right';
        moving = true;
    }
    
    // Normalizar movimento diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    // Dash
    if (keys.Space && gameState.dashUnlocked && gameState.pedalPower > 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashStartTime = Date.now();
        gameState.pedalPower--;
        updateUI();
    }
    
    // Aplicar velocidade
    const currentSpeed = player.isDashing ? player.dashSpeed : player.speed;
    player.x += dx * currentSpeed;
    player.y += dy * currentSpeed;
    
    // Limitar ao canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Atualizar dash
    if (player.isDashing && Date.now() - player.dashStartTime > player.dashDuration) {
        player.isDashing = false;
    }
    
    // Checar colisão com inimigos durante dash
    if (player.isDashing) {
        enemies.forEach(enemy => {
            if (!enemy.isDead && checkCollision(player, enemy)) {
                enemy.die();
            }
        });
    }
    
    // Recarregar pedal power quando parado
    if (moving) {
        gameState.lastMoveTime = Date.now();
    } else {
        const timeSinceLastMove = Date.now() - gameState.lastMoveTime;
        const timeSinceLastRecharge = Date.now() - gameState.lastRechargeTime;
        
        if (timeSinceLastMove > 1000 && timeSinceLastRecharge > gameState.pedalRechargeTime) {
            if (gameState.pedalPower < gameState.maxPedalPower) {
                gameState.pedalPower++;
                gameState.lastRechargeTime = Date.now();
                updateUI();
            }
        }
    }
    
    // Animação
    if (moving && Date.now() - player.lastFrameTime > player.animationSpeed) {
        player.frame = (player.frame + 1) % 2;
        player.lastFrameTime = Date.now();
    }
}

// Função auxiliar de colisão
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Função de morte
function killPlayer() {
    if (player.isDead) return;
    
    player.isDead = true;
    player.deathFrame = Math.floor(Math.random() * 4) + 12; // Frames 12-15
    gameState.deaths++;
    
    const deathMsg = document.getElementById('deathMessage');
    if (gameState.deaths < 5) {
        deathMsg.textContent = "ah véi, se liga carái";
    } else {
        deathMsg.textContent = "sifudêu";
    }
    deathMsg.style.display = 'block';
    
    updateUI();
    
    setTimeout(() => {
        deathMsg.style.display = 'none';
        if (gameState.deaths >= 5) {
            // Reiniciar jogo completo
            resetGame();
        } else {
            // Reiniciar mapa atual
            resetMap();
        }
    }, 2000);
}

// Reset do mapa
function resetMap() {
    player.x = 100;
    player.y = 300;
    player.isDead = false;
    player.isDashing = false;
    player.frame = 0;
    gameState.pedalPower = gameState.maxPedalPower;
    
    // Resetar inimigos
    enemies.forEach(enemy => {
        enemy.isDead = false;
        enemy.state = 'patrol';
    });
    
    updateUI();
}

// Reset completo do jogo
function resetGame() {
    gameState.currentMap = 0;
    gameState.deaths = 0;
    gameState.dashUnlocked = false;
    gameState.phase = 'infiltration';
    
    // Limpar inimigos
    enemies.length = 0;
    
    resetMap();
    playMusic('inicio');
}

// Atualizar UI
function updateUI() {
    document.getElementById('deathCount').textContent = gameState.deaths;
    
    const powerBar = document.getElementById('pedalPower');
    let bar = '';
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        bar += i < gameState.pedalPower ? '█' : '░';
    }
    powerBar.textContent = bar;
}

// Obter sprite correto do player
function getPlayerSprite() {
    if (!assets.loaded) return null;
    
    if (player.isDead) {
        return assets.sprites.madmax[player.deathFrame];
    }
    
    // Mapeamento de direção para índice base
    const directionMap = {
        'right': 0,
        'down': 1,
        'left': 2,
        'up': 3
    };
    
    const baseIndex = directionMap[player.direction];
    
    if (player.isDashing) {
        // Sprites de ataque (8-11)
        return assets.sprites.madmax[8 + baseIndex];
    } else {
        // Sprites de movimento (0-3 ou 4-7 baseado no frame)
        const offset = player.frame * 4;
        return assets.sprites.madmax[baseIndex + offset];
    }
}

// Função de desenho
function draw() {
    // Limpar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar "mapa" temporário
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(50, 50, 700, 500);
    
    // Desenhar inimigos
    enemies.forEach(enemy => {
        if (assets.loaded && assets.sprites.faquinha.length > 0) {
            const sprite = enemy.getSprite();
            if (sprite) {
                ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
            } else {
                // Fallback se sprite não existir
                ctx.fillStyle = enemy.isDead ? '#444' : '#a0a';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        } else {
            // Placeholder
            ctx.fillStyle = enemy.isDead ? '#444' : '#f0f';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        
        // Debug: mostrar cone de visão
        if (!enemy.isDead && enemy.state === 'alert') {
            ctx.strokeStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 50, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    // Desenhar player
    if (assets.loaded) {
        const sprite = getPlayerSprite();
        if (sprite) {
            ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        }
    } else {
        // Placeholder enquanto carrega
        ctx.fillStyle = player.isDashing ? '#ff0' : '#f00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Texto do mapa atual
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Mapa: ' + (gameState.currentMap + 1), 350, 30);
    
    // Status de carregamento
    if (!assets.loaded) {
        ctx.fillStyle = '#ff0';
        ctx.font = '16px Arial';
        ctx.fillText('Carregando sprites...', 320, 300);
    }
}

// Atualizar todos os inimigos
function updateEnemies(deltaTime) {
    enemies.forEach(enemy => enemy.update(deltaTime));
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Comandos de teste
window.addEventListener('keydown', (e) => {
    // C - Mostrar/ocultar console
    if (e.key === 'c' || e.key === 'C') {
        const consoleDiv = document.getElementById('console');
        consoleDiv.style.display = consoleDiv.style.display === 'none' ? 'block' : 'none';
    }
    
    // K - Mata o player
    if (e.key === 'k' || e.key === 'K') {
        killPlayer();
    }
    
    // E - Adiciona um inimigo onde o player está
    if (e.key === 'e' || e.key === 'E') {
        enemies.push(new Enemy(player.x + 100, player.y));
        console.log('Inimigo adicionado! Total:', enemies.length);
    }
    
    // D - Ativa/desativa dash
    if (e.key === 'd' || e.key === 'D') {
        gameState.dashUnlocked = !gameState.dashUnlocked;
        console.log('Dash:', gameState.dashUnlocked ? 'ATIVADO' : 'DESATIVADO');
    }
    
    // M - Muda música
    if (e.key === 'm' || e.key === 'M') {
        playMusic(gameState.phase === 'infiltration' ? 'fuga' : 'inicio');
        gameState.phase = gameState.phase === 'infiltration' ? 'escape' : 'infiltration';
    }
});

// Iniciar jogo
async function init() {
    console.log('Mad Night - Iniciando...');
    
    updateUI();
    
    // Iniciar loop imediatamente (com placeholders)
    requestAnimationFrame(gameLoop);
    
    // Carregar assets em paralelo
    await loadAssets();
    
    // Verificar se os sprites do faquinha carregaram
    console.log('Sprites do Faquinha carregados:', assets.sprites.faquinha.filter(s => s !== null).length);
    
    // Adicionar alguns inimigos de teste DEPOIS de carregar os assets
    setTimeout(() => {
        enemies.push(new Enemy(400, 200));
        enemies.push(new Enemy(500, 400));
        console.log('2 inimigos adicionados na tela!');
    }, 100);
    
    // Tocar música inicial
    playMusic('inicio');
    
    console.log('Mad Night - Pronto!');
    console.log('Controles:');
    console.log('- Setas: mover');
    console.log('- C: mostrar/ocultar console');
    console.log('- K: testar morte');
    console.log('- E: adicionar inimigo');
    console.log('- D: ativar/desativar dash');
    console.log('- M: mudar música');
    console.log('- Espaço: dash (quando ativado)');
}

// Iniciar quando a página carregar
window.addEventListener('load', init);
