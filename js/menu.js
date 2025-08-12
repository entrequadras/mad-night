// menu.js - Sistema de Menu Principal (v1.57)

(function() {
    'use strict';
    
    MadNight.menu = {
        // Estado do menu
        active: true,
        currentOption: 0,
        currentScreen: 'main', // 'main', 'options', 'credits', 'ranking', 'about', 'nameEntry'
        rankingTab: 0, // 0: tempo, 1: kills, 2: perfeito
        
        // Para entrada de nome (novo recorde)
        nameEntry: {
            active: false,
            name: ['A', 'A', 'A', 'A'],
            position: 0,
            report: null,
            newRecords: []
        },
        
        // Opções do menu principal
        options: [
            { text: 'JOGAR', action: 'start' },
            { text: 'RANKING', action: 'ranking' },
            { text: 'OPÇÕES', action: 'options' },
            { text: 'CRÉDITOS', action: 'credits' },
            { text: 'SOBRE', action: 'about' }
        ],
        
        // Configurações de layout
        layout: {
            logoY: 100,
            menuStartY: 280,
            optionSpacing: 45,
            cursorOffset: -40
        },
        
        // Configurações de opções
        optionsMenu: {
            current: 0,
            items: [
                { text: 'VOLUME MÚSICA', type: 'slider', value: 70, min: 0, max: 100 },
                { text: 'VOLUME EFEITOS', type: 'slider', value: 80, min: 0, max: 100 },
                { text: 'TELA CHEIA', type: 'toggle', value: false },
                { text: 'LIMPAR RANKINGS', type: 'action', action: 'clearRankings' },
                { text: 'VOLTAR', action: 'back' }
            ]
        },
        
        // Textos dos créditos
        credits: [
            'MAD NIGHT v1.57',
            '',
            'UM JOGO SOBRE',
            'GANGUES DE BRASÍLIA',
            '',
            'PROGRAMAÇÃO',
            'JavaScript Puro + Canvas',
            '',
            'ARTE',
            'Pixel Art Estilo Anos 80/90',
            '',
            'INSPIRAÇÃO',
            'Hotline Miami',
            'Cultura BSB Underground',
            '',
            'DESENVOLVIDO POR',
            'Um Brasiliense Nostálgico',
            '',
            '',
            'PRESSIONE ESC PARA VOLTAR'
        ],
        
        // Texto sobre
        aboutText: [
            'MAD NIGHT',
            '',
            'BRASÍLIA, ANOS 80',
            '',
            'Você é MADMAX, membro de uma',
            'gangue de pixadores da Asa Sul.',
            '',
            'O Komando Satânico (KS) pixou',
            'por cima da sua arte.',
            '',
            'Agora é guerra.',
            '',
            'Infiltre-se no território rival,',
            'plante uma bomba na lixeira',
            'e fuja antes que seja tarde.',
            '',
            'Cuidado com o CHACAL.',
            '',
            '',
            'PRESSIONE ESC PARA VOLTAR'
        ],
        
        // Inicializar menu
        init: function() {
            console.log('🎮 Inicializando menu principal...');
            
            // Configurar handlers de input
            this.setupInputHandlers();
            
            // Tocar música do menu (usar música de início por enquanto)
            if (MadNight.audio && MadNight.audio.playMusic) {
                MadNight.audio.playMusic('inicio');
            }
            
            console.log('✅ Menu inicializado');
        },
        
        // Configurar input handlers
        setupInputHandlers: function() {
            // Remover listeners anteriores se existirem
            if (this.keydownHandler) {
                window.removeEventListener('keydown', this.keydownHandler);
            }
            
            // Criar novo handler
            this.keydownHandler = (e) => this.handleInput(e);
            window.addEventListener('keydown', this.keydownHandler);
        },
        
        // Processar input
        handleInput: function(e) {
            if (!this.active) return;
            
            // Entrada de nome tem prioridade
            if (this.nameEntry.active) {
                this.handleNameEntry(e);
                return;
            }
            
            switch(this.currentScreen) {
                case 'main':
                    this.handleMainMenu(e);
                    break;
                case 'options':
                    this.handleOptionsMenu(e);
                    break;
                case 'ranking':
                    this.handleRankingMenu(e);
                    break;
                case 'credits':
                case 'about':
                    this.handleInfoScreen(e);
                    break;
            }
        },
        
        // Input do menu principal
        handleMainMenu: function(e) {
            switch(e.key) {
                case 'ArrowUp':
                    this.currentOption--;
                    if (this.currentOption < 0) {
                        this.currentOption = this.options.length - 1;
                    }
                    this.playSelectSound();
                    break;
                    
                case 'ArrowDown':
                    this.currentOption++;
                    if (this.currentOption >= this.options.length) {
                        this.currentOption = 0;
                    }
                    this.playSelectSound();
                    break;
                    
                case 'Enter':
                case ' ':
                    this.selectOption();
                    break;
            }
        },
        
        // Input do menu de opções
        handleOptionsMenu: function(e) {
            const option = this.optionsMenu.items[this.optionsMenu.current];
            
            switch(e.key) {
                case 'ArrowUp':
                    this.optionsMenu.current--;
                    if (this.optionsMenu.current < 0) {
                        this.optionsMenu.current = this.optionsMenu.items.length - 1;
                    }
                    this.playSelectSound();
                    break;
                    
                case 'ArrowDown':
                    this.optionsMenu.current++;
                    if (this.optionsMenu.current >= this.optionsMenu.items.length) {
                        this.optionsMenu.current = 0;
                    }
                    this.playSelectSound();
                    break;
                    
                case 'ArrowLeft':
                    if (option.type === 'slider') {
                        option.value = Math.max(option.min, option.value - 10);
                        this.applyOption(option);
                    } else if (option.type === 'toggle') {
                        option.value = !option.value;
                        this.applyOption(option);
                    }
                    break;
                    
                case 'ArrowRight':
                    if (option.type === 'slider') {
                        option.value = Math.min(option.max, option.value + 10);
                        this.applyOption(option);
                    } else if (option.type === 'toggle') {
                        option.value = !option.value;
                        this.applyOption(option);
                    }
                    break;
                    
                case 'Enter':
                case ' ':
                    if (option.action === 'back') {
                        this.currentScreen = 'main';
                        this.playConfirmSound();
                    } else if (option.action === 'clearRankings') {
                        if (confirm('Limpar todos os rankings?')) {
                            MadNight.stats.clearAllScores();
                            this.playConfirmSound();
                        }
                    }
                    break;
                    
                case 'Escape':
                    this.currentScreen = 'main';
                    this.playConfirmSound();
                    break;
            }
        },
        
        // Input do menu de ranking
        handleRankingMenu: function(e) {
            switch(e.key) {
                case 'ArrowLeft':
                    this.rankingTab--;
                    if (this.rankingTab < 0) this.rankingTab = 2;
                    this.playSelectSound();
                    break;
                    
                case 'ArrowRight':
                    this.rankingTab++;
                    if (this.rankingTab > 2) this.rankingTab = 0;
                    this.playSelectSound();
                    break;
                    
                case 'Escape':
                case 'Enter':
                case ' ':
                    this.currentScreen = 'main';
                    this.playConfirmSound();
                    break;
            }
        },
        
        // Input das telas de informação
        handleInfoScreen: function(e) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                this.currentScreen = 'main';
                this.playConfirmSound();
            }
        },
        
        // Input para entrada de nome (novo recorde)
        handleNameEntry: function(e) {
            switch(e.key) {
                case 'ArrowUp':
                    const currentChar = this.nameEntry.name[this.nameEntry.position];
                    let charCode = currentChar.charCodeAt(0);
                    charCode++;
                    if (charCode > 90) charCode = 32; // Depois de Z, vai para espaço
                    if (charCode === 33) charCode = 48; // Depois de espaço, vai para 0
                    if (charCode > 57 && charCode < 65) charCode = 65; // Pula de 9 para A
                    this.nameEntry.name[this.nameEntry.position] = String.fromCharCode(charCode);
                    this.playSelectSound();
                    break;
                    
                case 'ArrowDown':
                    const currentChar2 = this.nameEntry.name[this.nameEntry.position];
                    let charCode2 = currentChar2.charCodeAt(0);
                    charCode2--;
                    if (charCode2 < 32) charCode2 = 90; // Antes de espaço, vai para Z
                    if (charCode2 === 47) charCode2 = 32; // Antes de 0, vai para espaço
                    if (charCode2 > 57 && charCode2 < 65) charCode2 = 57; // Pula de A para 9
                    this.nameEntry.name[this.nameEntry.position] = String.fromCharCode(charCode2);
                    this.playSelectSound();
                    break;
                    
                case 'ArrowLeft':
                    this.nameEntry.position--;
                    if (this.nameEntry.position < 0) this.nameEntry.position = 3;
                    this.playSelectSound();
                    break;
                    
                case 'ArrowRight':
                    this.nameEntry.position++;
                    if (this.nameEntry.position > 3) this.nameEntry.position = 0;
                    this.playSelectSound();
                    break;
                    
                case 'Enter':
                case ' ':
                    // Salvar recorde
                    const name = this.nameEntry.name.join('').trim();
                    if (name.length > 0) {
                        MadNight.stats.addHighScore(name, this.nameEntry.report);
                        this.nameEntry.active = false;
                        this.currentScreen = 'ranking';
                        this.playConfirmSound();
                    }
                    break;
            }
        },
        
        // Selecionar opção do menu principal
        selectOption: function() {
            const option = this.options[this.currentOption];
            this.playConfirmSound();
            
            switch(option.action) {
                case 'start':
                    this.startGame();
                    break;
                case 'options':
                    this.currentScreen = 'options';
                    this.optionsMenu.current = 0;
                    break;
                case 'credits':
                    this.currentScreen = 'credits';
                    break;
                case 'ranking':
                    this.currentScreen = 'ranking';
                    this.rankingTab = 0;
                    break;
                case 'about':
                    this.currentScreen = 'about';
                    break;
            }
        },
        
        // Aplicar configuração
        applyOption: function(option) {
            if (option.text.includes('VOLUME MÚSICA')) {
                if (MadNight.audio) {
                    MadNight.audio.musicVolume = option.value / 100;
                    if (MadNight.audio.currentMusic) {
                        MadNight.audio.currentMusic.volume = MadNight.audio.musicVolume;
                    }
                }
            } else if (option.text.includes('VOLUME EFEITOS')) {
                if (MadNight.audio) {
                    MadNight.audio.sfxVolume = option.value / 100;
                }
            } else if (option.text === 'TELA CHEIA') {
                if (option.value) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                    }
                }
            }
        },
        
        // Iniciar jogo
        startGame: function() {
            console.log('🎮 Iniciando jogo...');
            
            this.active = false;
            
            // Remover handler do menu
            if (this.keydownHandler) {
                window.removeEventListener('keydown', this.keydownHandler);
            }
            
            // O jogo já foi inicializado pelo main.js
            // Apenas começar o jogo
            if (MadNight.game) {
                MadNight.game.restart(); // Resetar e começar
            }
        },
        
        // Mostrar tela de novo recorde
        showNewRecord: function(report, newRecords) {
            this.active = true;
            this.nameEntry.active = true;
            this.nameEntry.report = report;
            this.nameEntry.newRecords = newRecords;
            this.nameEntry.name = ['A', 'A', 'A', 'A'];
            this.nameEntry.position = 0;
            
            // Reconfigurar input handlers
            this.setupInputHandlers();
        },
        
        // Voltar ao menu após game over
        backToMenu: function() {
            console.log('🔙 Voltando ao menu...');
            
            this.active = true;
            this.currentScreen = 'main';
            this.currentOption = 0;
            
            // Reconfigurar input
            this.setupInputHandlers();
            
            // Tocar música do menu
            if (MadNight.audio && MadNight.audio.playMusic) {
                MadNight.audio.playMusic('inicio');
            }
        },
        
        // Sons do menu
        playSelectSound: function() {
            // Por enquanto sem som, mas preparado
            // if (MadNight.audio && MadNight.audio.playSound) {
            //     MadNight.audio.playSound('menu_select');
            // }
        },
        
        playConfirmSound: function() {
            // Por enquanto sem som, mas preparado
            // if (MadNight.audio && MadNight.audio.playSound) {
            //     MadNight.audio.playSound('menu_confirm');
            // }
        },
        
        // Renderizar menu
        render: function(ctx) {
            if (!this.active) return;
            
            const canvas = ctx.canvas;
            
            // Limpar tela
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Efeito de scanlines
            this.renderScanlines(ctx);
            
            // Renderizar tela atual
            if (this.nameEntry.active) {
                this.renderNameEntry(ctx);
            } else {
                switch(this.currentScreen) {
                    case 'main':
                        this.renderMainMenu(ctx);
                        break;
                    case 'options':
                        this.renderOptions(ctx);
                        break;
                    case 'credits':
                        this.renderCredits(ctx);
                        break;
                    case 'ranking':
                        this.renderRanking(ctx);
                        break;
                    case 'about':
                        this.renderAbout(ctx);
                        break;
                }
            }
        },
        
        // Renderizar menu principal
        renderMainMenu: function(ctx) {
            const canvas = ctx.canvas;
            
            // Logo animado
            ctx.save();
            const pulse = Math.sin(Date.now() * 0.002) * 0.1 + 1;
            ctx.scale(pulse, pulse);
            ctx.font = '48px "Press Start 2P"';
            ctx.fillStyle = '#f00';
            ctx.textAlign = 'center';
            ctx.fillText('MAD NIGHT', canvas.width / 2 / pulse, this.layout.logoY / pulse);
            ctx.restore();
            
            // Subtítulo
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('GUERRA DE GANGUES EM BRASÍLIA', canvas.width / 2, this.layout.logoY + 60);
            
            // Opções do menu
            ctx.font = '16px "Press Start 2P"';
            ctx.textAlign = 'center';
            
            this.options.forEach((option, index) => {
                const y = this.layout.menuStartY + (index * this.layout.optionSpacing);
                
                // Destacar opção selecionada
                if (index === this.currentOption) {
                    ctx.fillStyle = '#ff0';
                    
                    // Cursor animado
                    const cursorX = (canvas.width / 2) - 150 + Math.sin(Date.now() * 0.005) * 5;
                    ctx.fillText('►', cursorX, y);
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                ctx.fillText(option.text, canvas.width / 2, y);
            });
            
            // Versão
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'right';
            ctx.fillText('v1.57', canvas.width - 20, canvas.height - 20);
        },
        
        // Renderizar menu de opções
        renderOptions: function(ctx) {
            const canvas = ctx.canvas;
            
            // Título
            ctx.font = '24px "Press Start 2P"';
            ctx.fillStyle = '#ff0';
            ctx.textAlign = 'center';
            ctx.fillText('OPÇÕES', canvas.width / 2, 100);
            
            // Opções
            ctx.font = '14px "Press Start 2P"';
            
            this.optionsMenu.items.forEach((item, index) => {
                const y = 200 + (index * 60);
                const selected = index === this.optionsMenu.current;
                
                // Texto da opção
                ctx.fillStyle = selected ? '#ff0' : '#fff';
                ctx.textAlign = 'left';
                ctx.fillText(item.text, 100, y);
                
                // Valor/controle
                if (item.type === 'slider') {
                    // Barra de volume
                    const barX = 400;
                    const barWidth = 200;
                    const barHeight = 10;
                    
                    // Fundo da barra
                    ctx.fillStyle = '#333';
                    ctx.fillRect(barX, y - 8, barWidth, barHeight);
                    
                    // Preenchimento
                    ctx.fillStyle = selected ? '#ff0' : '#0f0';
                    const fillWidth = (item.value / item.max) * barWidth;
                    ctx.fillRect(barX, y - 8, fillWidth, barHeight);
                    
                    // Valor
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'right';
                    ctx.fillText(item.value + '%', barX + barWidth + 50, y);
                    
                } else if (item.type === 'toggle') {
                    ctx.textAlign = 'right';
                    ctx.fillStyle = item.value ? '#0f0' : '#f00';
                    ctx.fillText(item.value ? 'SIM' : 'NÃO', 600, y);
                } else if (item.type === 'action') {
                    ctx.textAlign = 'right';
                    ctx.fillStyle = selected ? '#ff0' : '#888';
                    ctx.fillText('[AÇÃO]', 600, y);
                }
                
                // Cursor
                if (selected) {
                    ctx.fillStyle = '#ff0';
                    ctx.textAlign = 'left';
                    ctx.fillText('►', 70, y);
                }
            });
            
            // Instruções
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('← → AJUSTAR    ENTER CONFIRMAR    ESC VOLTAR', canvas.width / 2, canvas.height - 40);
        },
        
        // Renderizar créditos
        renderCredits: function(ctx) {
            const canvas = ctx.canvas;
            
            // Efeito de scroll
            const scrollY = Math.sin(Date.now() * 0.001) * 10;
            
            ctx.font = '14px "Press Start 2P"';
            ctx.textAlign = 'center';
            
            this.credits.forEach((line, index) => {
                // Títulos em amarelo
                if (line === line.toUpperCase() && line !== '' && !line.includes(' ')) {
                    ctx.fillStyle = '#ff0';
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                const y = 80 + (index * 25) + scrollY;
                ctx.fillText(line, canvas.width / 2, y);
            });
        },
        
        // Renderizar ranking
        renderRanking: function(ctx) {
            const canvas = ctx.canvas;
            
            // Título
            ctx.font = '24px "Press Start 2P"';
            ctx.fillStyle = '#ff0';
            ctx.textAlign = 'center';
            ctx.fillText('HALL DA FAMA', canvas.width / 2, 60);
            
            // Tabs
            const tabs = ['TEMPO', 'KILLS', 'SEM MORTES'];
            ctx.font = '12px "Press Start 2P"';
            
            tabs.forEach((tab, index) => {
                const x = (canvas.width / 3) * (index + 0.5);
                ctx.fillStyle = index === this.rankingTab ? '#ff0' : '#666';
                ctx.fillText(tab, x, 100);
            });
            
            // Mostrar ranking baseado na tab selecionada
            let rankings = [];
            let rankingType = 'speedRun';
            
            switch(this.rankingTab) {
                case 0: rankingType = 'speedRun'; break;
                case 1: rankingType = 'enemyKills'; break;
                case 2: rankingType = 'deathless'; break;
            }
            
            if (MadNight.stats) {
                rankings = MadNight.stats.getRankingDisplay(rankingType);
            }
            
            ctx.font = '12px "Press Start 2P"';
            ctx.textAlign = 'left';
            
            if (rankings.length === 0) {
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.fillText('NENHUM RECORDE AINDA', canvas.width / 2, 200);
            } else {
                rankings.forEach((score, index) => {
                    if (index >= 10) return; // Mostrar só top 10
                    
                    const y = 140 + (index * 30);
                    
                    // Cor baseada na posição
                    if (index === 0) ctx.fillStyle = '#ff0'; // Ouro
                    else if (index === 1) ctx.fillStyle = '#c0c0c0'; // Prata
                    else if (index === 2) ctx.fillStyle = '#cd7f32'; // Bronze
                    else ctx.fillStyle = '#fff';
                    
                    // Posição
                    ctx.fillText(`${score.position}.`, 150, y);
                    
                    // Nome
                    ctx.fillText(score.name, 200, y);
                    
                    // Valor
                    ctx.textAlign = 'right';
                    if (rankingType === 'speedRun') {
                        ctx.fillText(score.display, 450, y);
                        ctx.fillStyle = '#666';
                        ctx.fillText(`${score.deaths} morte(s)`, 600, y);
                    } else if (rankingType === 'enemyKills') {
                        ctx.fillText(score.display, 450, y);
                        ctx.fillStyle = '#666';
                        ctx.fillText(score.time, 600, y);
                    } else {
                        ctx.fillText(score.time, 450, y);
                        ctx.fillStyle = '#666';
                        ctx.fillText(`${score.kills} kills`, 600, y);
                    }
                    
                    ctx.textAlign = 'left';
                });
            }
            
            // Instruções
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('← → MUDAR ABA    ESC VOLTAR', canvas.width / 2, canvas.height - 40);
        },
        
        // Renderizar sobre
        renderAbout: function(ctx) {
            const canvas = ctx.canvas;
            
            ctx.font = '14px "Press Start 2P"';
            ctx.textAlign = 'center';
            
            this.aboutText.forEach((line, index) => {
                // Títulos em amarelo
                if (line === line.toUpperCase() && line !== '' && line.length < 20) {
                    ctx.fillStyle = '#ff0';
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                const y = 80 + (index * 25);
                ctx.fillText(line, canvas.width / 2, y);
            });
        },
        
        // Renderizar entrada de nome
        renderNameEntry: function(ctx) {
            const canvas = ctx.canvas;
            
            // Título
            ctx.font = '32px "Press Start 2P"';
            ctx.fillStyle = '#ff0';
            ctx.textAlign = 'center';
            ctx.fillText('NOVO RECORDE!', canvas.width / 2, 100);
            
            // Tipos de recordes
            ctx.font = '16px "Press Start 2P"';
            ctx.fillStyle = '#0f0';
            let recordY = 160;
            this.nameEntry.newRecords.forEach(record => {
                ctx.fillText(record, canvas.width / 2, recordY);
                recordY += 30;
            });
            
            // Estatísticas
            if (this.nameEntry.report) {
                ctx.font = '12px "Press Start 2P"';
                ctx.fillStyle = '#fff';
                ctx.fillText(`Tempo: ${this.nameEntry.report.timeFormatted}`, canvas.width / 2, 250);
                ctx.fillText(`Kills: ${this.nameEntry.report.kills.total}`, canvas.width / 2, 280);
                ctx.fillText(`Mortes: ${this.nameEntry.report.deaths}`, canvas.width / 2, 310);
            }
            
            // Entrada de nome
            ctx.font = '24px "Press Start 2P"';
            ctx.fillText('DIGITE SEU NOME:', canvas.width / 2, 380);
            
            // Caracteres do nome
            ctx.font = '32px "Press Start 2P"';
            const nameX = (canvas.width / 2) - 80;
            
            this.nameEntry.name.forEach((char, index) => {
                const x = nameX + (index * 40);
                const y = 440;
                
                // Destacar posição atual
                if (index === this.nameEntry.position) {
                    // Piscar
                    if (Math.floor(Date.now() / 500) % 2) {
                        ctx.fillStyle = '#ff0';
                    } else {
                        ctx.fillStyle = '#f00';
                    }
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                ctx.fillText(char, x, y);
                
                // Underline na posição atual
                if (index === this.nameEntry.position) {
                    ctx.fillRect(x - 15, y + 10, 30, 3);
                }
            });
            
            // Instruções
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('↑↓ MUDAR LETRA    ←→ MOVER    ENTER CONFIRMAR', canvas.width / 2, canvas.height - 40);
        },
        
        // Efeito de scanlines (CRT)
        renderScanlines: function(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for (let y = 0; y < ctx.canvas.height; y += 4) {
                ctx.fillRect(0, y, ctx.canvas.width, 2);
            }
            ctx.restore();
        }
    };
    
    console.log('Módulo Menu carregado');
    
})();
