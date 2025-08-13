// menu.js - Sistema de Menu Principal (v1.60 - Correção do Rankings)

(function() {
    'use strict';
    
    MadNight.menu = {
        active: true,
        currentOption: 0,
        currentScreen: 'main', // 'main', 'rankings', 'credits', 'newRecord', 'enterName'
        options: ['JOGAR', 'RANKINGS', 'CRÉDITOS', 'SAIR'],
        keys: {},
        lastKeyTime: 0,
        keyDelay: 200,
        
        // Para entrada de nome
        playerName: '',
        nameCharIndex: 0,
        alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        maxNameLength: 10,
        pendingReport: null,
        pendingRecords: null,
        
        // Inicializar menu
        init: function() {
            console.log('🎮 Menu inicializado');
            this.setupInputHandlers();
        },
        
        // Configurar handlers de input
        setupInputHandlers: function() {
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
            window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        },
        
        handleKeyDown: function(e) {
            if (!this.active) return;
            
            const now = Date.now();
            if (now - this.lastKeyTime < this.keyDelay) return;
            
            this.keys[e.key] = true;
            
            if (this.currentScreen === 'enterName') {
                this.handleNameInput(e);
                return;
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    this.navigateUp();
                    this.lastKeyTime = now;
                    break;
                case 'ArrowDown':
                    this.navigateDown();
                    this.lastKeyTime = now;
                    break;
                case 'Enter':
                case ' ':
                    this.selectOption();
                    this.lastKeyTime = now;
                    break;
                case 'Escape':
                    this.goBack();
                    this.lastKeyTime = now;
                    break;
            }
        },
        
        handleKeyUp: function(e) {
            this.keys[e.key] = false;
        },
        
        handleNameInput: function(e) {
            const now = Date.now();
            if (now - this.lastKeyTime < 150) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (this.playerName.length > 0) {
                        this.playerName = this.playerName.slice(0, -1);
                    }
                    this.lastKeyTime = now;
                    break;
                    
                case 'ArrowRight':
                    if (this.playerName.length < this.maxNameLength) {
                        this.playerName += this.alphabet[this.nameCharIndex];
                    }
                    this.lastKeyTime = now;
                    break;
                    
                case 'ArrowUp':
                    this.nameCharIndex = (this.nameCharIndex + 1) % this.alphabet.length;
                    this.lastKeyTime = now;
                    break;
                    
                case 'ArrowDown':
                    this.nameCharIndex = (this.nameCharIndex - 1 + this.alphabet.length) % this.alphabet.length;
                    this.lastKeyTime = now;
                    break;
                    
                case 'Enter':
                    if (this.playerName.trim().length > 0) {
                        this.saveHighScore();
                    }
                    this.lastKeyTime = now;
                    break;
                    
                case 'Escape':
                    this.currentScreen = 'main';
                    this.playerName = '';
                    this.nameCharIndex = 0;
                    this.lastKeyTime = now;
                    break;
                    
                default:
                    // Permitir digitação direta
                    if (e.key.length === 1 && this.playerName.length < this.maxNameLength) {
                        const char = e.key.toUpperCase();
                        if (this.alphabet.includes(char)) {
                            this.playerName += char;
                            this.lastKeyTime = now;
                        }
                    }
                    break;
            }
        },
        
        navigateUp: function() {
            if (this.currentScreen === 'main') {
                this.currentOption = (this.currentOption - 1 + this.options.length) % this.options.length;
            }
        },
        
        navigateDown: function() {
            if (this.currentScreen === 'main') {
                this.currentOption = (this.currentOption + 1) % this.options.length;
            }
        },
        
        selectOption: function() {
            if (this.currentScreen !== 'main') {
                if (this.currentScreen === 'rankings' || this.currentScreen === 'credits') {
                    this.currentScreen = 'main';
                }
                return;
            }
            
            switch(this.options[this.currentOption]) {
                case 'JOGAR':
                    this.startGame();
                    break;
                case 'RANKINGS':
                    this.showRankings();
                    break;
                case 'CRÉDITOS':
                    this.showCredits();
                    break;
                case 'SAIR':
                    this.quitGame();
                    break;
            }
        },
        
        goBack: function() {
            if (this.currentScreen !== 'main') {
                this.currentScreen = 'main';
            }
        },
        
        startGame: function() {
            console.log('🎮 Iniciando jogo...');
            this.active = false;
            
            // Chamar função do main.js para iniciar o jogo
            if (window.MadNightMain && window.MadNightMain.startGame) {
                window.MadNightMain.startGame();
            }
        },
        
        showRankings: function() {
            this.currentScreen = 'rankings';
        },
        
        showCredits: function() {
            this.currentScreen = 'credits';
        },
        
        quitGame: function() {
            if (confirm('Deseja realmente sair?')) {
                window.close();
            }
        },
        
        // Mostrar tela de novo recorde
        showNewRecord: function(report, newRecords) {
            this.active = true;
            this.currentScreen = 'enterName';
            this.pendingReport = report;
            this.pendingRecords = newRecords;
            this.playerName = '';
            this.nameCharIndex = 0;
        },
        
        // Salvar high score
        saveHighScore: function() {
            if (MadNight.stats && this.pendingReport) {
                MadNight.stats.addHighScore(this.playerName, this.pendingReport);
            }
            
            // Voltar ao menu principal
            this.currentScreen = 'rankings';
            this.playerName = '';
            this.pendingReport = null;
            this.pendingRecords = null;
            
            // Mostrar rankings por 5 segundos, depois voltar ao menu
            setTimeout(() => {
                this.currentScreen = 'main';
            }, 5000);
        },
        
        // Renderizar menu
        render: function(ctx) {
            if (!this.active) return;
            
            // Background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            switch(this.currentScreen) {
                case 'main':
                    this.renderMainMenu(ctx);
                    break;
                case 'rankings':
                    this.renderRankings(ctx);
                    break;
                case 'credits':
                    this.renderCredits(ctx);
                    break;
                case 'enterName':
                    this.renderEnterName(ctx);
                    break;
            }
        },
        
        renderMainMenu: function(ctx) {
            // Logo
            ctx.fillStyle = '#f00';
            ctx.font = '64px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('MAD NIGHT', ctx.canvas.width / 2, 200);
            
            // Versão
            ctx.fillStyle = '#666';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('v1.60', ctx.canvas.width / 2, 240);
            
            // Opções
            ctx.font = '24px "Press Start 2P"';
            this.options.forEach((option, index) => {
                if (index === this.currentOption) {
                    // Destacar opção selecionada
                    ctx.fillStyle = '#ff0';
                    ctx.fillText('→ ' + option, ctx.canvas.width / 2, 350 + index * 60);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.fillText(option, ctx.canvas.width / 2, 350 + index * 60);
                }
            });
            
            // Instruções
            ctx.fillStyle = '#888';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('Use ↑↓ para navegar, ENTER para selecionar', ctx.canvas.width / 2, ctx.canvas.height - 40);
        },
        
        renderRankings: function(ctx) {
            ctx.fillStyle = '#ff0';
            ctx.font = '32px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('HALL DA FAMA', ctx.canvas.width / 2, 80);
            
            // Obter rankings
            const speedRuns = MadNight.stats ? MadNight.stats.getRankingDisplay('speedRun') : [];
            const killRankings = MadNight.stats ? MadNight.stats.getRankingDisplay('enemyKills') : [];
            
            // Definir colunas (apenas 2 agora)
            const columns = [
                { title: 'TEMPO', x: ctx.canvas.width / 3, data: speedRuns },
                { title: 'KILLS', x: (ctx.canvas.width / 3) * 2, data: killRankings }
            ];
            
            // Renderizar cada coluna
            columns.forEach(column => {
                // Título da coluna
                ctx.fillStyle = '#0ff';
                ctx.font = '16px "Press Start 2P"';
                ctx.fillText(column.title, column.x, 140);
                
                // Scores
                ctx.font = '10px "Press Start 2P"';
                column.data.forEach((score, index) => {
                    if (index >= 8) return; // Mostrar apenas top 8
                    
                    const y = 180 + index * 35;
                    
                    // Posição
                    ctx.fillStyle = '#ff0';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${score.position}.`, column.x - 120, y);
                    
                    // Nome
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.fillText(score.name, column.x - 100, y);
                    
                    // Valor
                    ctx.fillStyle = '#0f0';
                    ctx.textAlign = 'left';
                    ctx.fillText(score.display || score.value, column.x - 100, y + 15);
                });
            });
            
            // Instruções
            ctx.fillStyle = '#888';
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('Pressione ESC para voltar', ctx.canvas.width / 2, ctx.canvas.height - 40);
        },
        
        renderCredits: function(ctx) {
            ctx.fillStyle = '#ff0';
            ctx.font = '32px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('CRÉDITOS', ctx.canvas.width / 2, 100);
            
            const credits = [
                { role: 'GAME DESIGN', name: 'Brasília Underground' },
                { role: 'PROGRAMAÇÃO', name: 'JavaScript Warriors' },
                { role: 'ARTE', name: 'Pixel Prophets' },
                { role: 'MÚSICA', name: '8-bit Cerrado' },
                { role: 'SFX', name: 'Noise Makers BSB' }
            ];
            
            ctx.font = '14px "Press Start 2P"';
            credits.forEach((credit, index) => {
                const y = 200 + index * 60;
                
                ctx.fillStyle = '#0ff';
                ctx.fillText(credit.role, ctx.canvas.width / 2, y);
                
                ctx.fillStyle = '#fff';
                ctx.font = '12px "Press Start 2P"';
                ctx.fillText(credit.name, ctx.canvas.width / 2, y + 25);
                
                ctx.font = '14px "Press Start 2P"';
            });
            
            // Dedicatória
            ctx.fillStyle = '#f00';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('Dedicado aos pixadores de Brasília', ctx.canvas.width / 2, ctx.canvas.height - 80);
            ctx.fillText('dos anos 80 e 90', ctx.canvas.width / 2, ctx.canvas.height - 60);
            
            // Instruções
            ctx.fillStyle = '#888';
            ctx.fillText('Pressione ESC para voltar', ctx.canvas.width / 2, ctx.canvas.height - 20);
        },
        
        renderEnterName: function(ctx) {
            ctx.fillStyle = '#ff0';
            ctx.font = '32px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('NOVO RECORDE!', ctx.canvas.width / 2, 100);
            
            // Mostrar conquistas
            if (this.pendingRecords) {
                ctx.fillStyle = '#0ff';
                ctx.font = '16px "Press Start 2P"';
                this.pendingRecords.forEach((record, index) => {
                    ctx.fillText(record, ctx.canvas.width / 2, 160 + index * 30);
                });
            }
            
            // Input do nome
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Press Start 2P"';
            ctx.fillText('DIGITE SEU NOME:', ctx.canvas.width / 2, 280);
            
            // Nome atual
            ctx.fillStyle = '#ff0';
            ctx.font = '24px "Press Start 2P"';
            const displayName = this.playerName + (this.playerName.length < this.maxNameLength ? '_' : '');
            ctx.fillText(displayName, ctx.canvas.width / 2, 330);
            
            // Caractere selecionado
            if (this.playerName.length < this.maxNameLength) {
                ctx.fillStyle = '#666';
                ctx.font = '16px "Press Start 2P"';
                ctx.fillText('↑', ctx.canvas.width / 2 + (this.playerName.length * 24), 360);
                ctx.fillText(this.alphabet[this.nameCharIndex], ctx.canvas.width / 2 + (this.playerName.length * 24), 380);
                ctx.fillText('↓', ctx.canvas.width / 2 + (this.playerName.length * 24), 400);
            }
            
            // Instruções
            ctx.fillStyle = '#888';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('↑↓ - Mudar letra  ←→ - Adicionar/Remover', ctx.canvas.width / 2, 460);
            ctx.fillText('ENTER - Confirmar  ESC - Cancelar', ctx.canvas.width / 2, 480);
            ctx.fillText('Ou digite diretamente no teclado', ctx.canvas.width / 2, 500);
            
            // Estatísticas do jogo
            if (this.pendingReport) {
                ctx.fillStyle = '#0f0';
                ctx.font = '10px "Press Start 2P"';
                ctx.fillText(`Tempo: ${this.pendingReport.timeFormatted}`, ctx.canvas.width / 2, 540);
                ctx.fillText(`Kills: ${this.pendingReport.kills.total}`, ctx.canvas.width / 2, 560);
                ctx.fillText(`Mortes: ${this.pendingReport.deaths}`, ctx.canvas.width / 2, 580);
            }
        }
    };
    
    console.log('Módulo Menu carregado');
    
})();
