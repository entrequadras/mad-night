// Debug inicial
console.log('Iniciando Mad Night...');

// Sistema de console visual
const visualConsole = {
    messages: [],
    maxMessages: 20,
    enabled: false,
    
    log: function(message, color = '#0f0') {
        this.messages.push({ 
            text: String(message), 
            color: color, 
            time: new Date().toLocaleTimeString() 
        });
        
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        if (this.enabled) {
            this.updateDisplay();
        }
    },
    
    error: function(message) {
        this.log(String(message), '#f00');
    },
    
    updateDisplay: function() {
        const content = document.getElementById('consoleContent');
        if (content) {
            content.innerHTML = this.messages.map(msg => 
                `<div style="color: ${msg.color}; margin: 2px 0;">[${msg.time}] ${msg.text}</div>`
            ).join('');
            content.scrollTop = content.scrollHeight;
        }
    },
    
    show: function() {
        this.enabled = true;
        this.updateDisplay();
    }
};

// Redirecionar console
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
    originalLog(...args);
    visualConsole.log(args.join(' '));
};

console.error = function(...args) {
    originalError(...args);
    visualConsole.error(args.join(' '));
};

// Aguardar DOM carregar
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado!');
    
    // Configurações do jogo
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Contexto 2D não disponível!');
        return;
    }
    
    ctx.imageSmoothingEnabled = false;
    console.log('Canvas configurado!');

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

    // Estado do jogo
    const gameState = {
        currentMap: 0,
        deaths: 0,
        dashUnlocked: false,
        pedalPower: 4,
        maxPedalPower: 4,
        pedalRechargeTime: 6000,
        lastMoveTime: Date.now(),
        lastRechargeTime: Date.now(),
        phase: 'infiltration',
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
        direction: 'right',
        frame: 0,
        animationSpeed: 150,
        lastFrameTime: 0,
        isDead: false,
        deathFrame: 0
    };

    // Sistema de inimigos
    const enemies = [];

    // Sistema de input
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
    };

    // Carregar assets
    async function loadAssets() {
        try {
            console.log('=== CARREGANDO ASSETS ===');
            
            // Por enquanto, marcar como carregado para testar
            assets.loaded = true;
            console.log('Assets marcados como carregados (teste)');
            
        } catch (error) {
            console.error('Erro ao carregar assets:', error);
        }
    }

    // Função de desenho
    function draw() {
        // Limpar canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar mapa
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(50, 50, 700, 500);
        
        // Desenhar player (placeholder por enquanto)
        ctx.fillStyle = player.isDashing ? '#ff0' : '#f00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Texto do mapa
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Mapa: 1', 350, 30);
        
        // Debug
        ctx.fillStyle = '#0f0';
        ctx.font = '12px Arial';
        ctx.fillText('Jogo rodando!', 10, 590);
    }

    // Função de movimento do player
    function updatePlayer() {
        if (player.isDead) return;
        
        let dx = 0;
        let dy = 0;
        
        if (keys.ArrowUp) {
            dy = -1;
            player.direction = 'up';
        }
        if (keys.ArrowDown) {
            dy = 1;
            player.direction = 'down';
        }
        if (keys.ArrowLeft) {
            dx = -1;
            player.direction = 'left';
        }
        if (keys.ArrowRight) {
            dx = 1;
            player.direction = 'right';
        }
        
        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Aplicar movimento
        const speed = player.isDashing ? player.dashSpeed : player.speed;
        player.x += dx * speed;
        player.y += dy * speed;
        
        // Limitar ao canvas
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    }

    // Atualizar UI
    function updateUI() {
        const deathCount = document.getElementById('deathCount');
        const pedalPower = document.getElementById('pedalPower');
        
        if (deathCount) deathCount.textContent = gameState.deaths;
        
        if (pedalPower) {
            let bar = '';
            for (let i = 0; i < gameState.maxPedalPower; i++) {
                bar += i < gameState.pedalPower ? '█' : '░';
            }
            pedalPower.textContent = bar;
        }
    }

    // Event listeners
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = true;
            e.preventDefault();
        }
        
        // Console toggle
        if (e.key === 'c' || e.key === 'C') {
            const consoleDiv = document.getElementById('console');
            if (consoleDiv) {
                const isVisible = consoleDiv.style.display !== 'none';
                consoleDiv.style.display = isVisible ? 'none' : 'block';
                
                if (!isVisible) {
                    visualConsole.show();
                    console.log('=== CONSOLE ATIVADO ===');
                    console.log('Jogo rodando!');
                    console.log('Use as setas para mover');
                }
            }
        }
        
        // Teste de morte
        if (e.key === 'k' || e.key === 'K') {
            console.log('Tecla K pressionada!');
            gameState.deaths++;
            updateUI();
            console.log(`Mortes: ${gameState.deaths}/5`);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = false;
            e.preventDefault();
        }
    });

    // Game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        updatePlayer();
        draw();
        
        requestAnimationFrame(gameLoop);
    }

    // Iniciar jogo
    async function init() {
        console.log('Iniciando jogo...');
        
        updateUI();
        await loadAssets();
        
        // Iniciar loop
        requestAnimationFrame(gameLoop);
        
        console.log('Jogo iniciado!');
    }

    // Iniciar
    init();
});

console.log('Arquivo game.js carregado completamente!');
