// menu.js - Sistema de Menu Principal

(function() {
    'use strict';
    
    MadNight.menu = {
        // Estado do menu
        active: true,
        currentOption: 0,
        currentScreen: 'main', // 'main', 'options', 'credits', 'ranking', 'about'
        
        // Opções do menu principal
        options: [
            { text: 'JOGAR', action: 'start' },
            { text: 'OPÇÕES', action: 'options' },
            { text: 'CRÉDITOS', action: 'credits' },
            { text: 'RANKING', action: 'ranking' },
            { text: 'SOBRE O FILME', action: 'about' }
        ],
        
        // Configurações de layout
        layout: {
            logoY: 100,
            menuStartY: 280,
            optionSpacing: 45,
            cursorOffset: -40
        },
        
        // Assets do menu
        assets: {
            logo: null,
            cursor: null,
            background: null
        },
        
        // Configurações de opções
        optionsMenu: {
            current: 0,
            items: [
                { text: 'VOLUME MÚSICA', type: 'slider', value: 70, min: 0, max: 100 },
                { text: 'VOLUME EFEITOS', type: 'slider', value: 80, min: 0, max: 100 },
                { text: 'TELA CHEIA', type: 'toggle', value: false },
                { text: 'VOLTAR', action: 'back' }
            ]
        },
        
        // Textos dos créditos
        credits: [
            'MAD NIGHT v1.40',
            '',
            'PROGRAMAÇÃO',
            'Desenvolvido com JavaScript puro',
            '',
            'ARTE',
            'Pixel art inspirado nos anos 80/90',
            '',
            'MÚSICA',
            'Trilhas de suspense e ação',
            '',
            'AGRADECIMENTOS',
            'Hotline Miami pela inspiração',
            'Gangues de Brasília dos anos 80',
            '',
            'PRESSIONE ESC PARA VOLTAR'
        ],
        
        // Texto sobre o filme
        aboutText: [
            'MAD MAX: ALÉM DO EIXÃO',
            '',
            'Um filme sobre guerra de gangues',
            'nas superquadras de Brasília.',
            '',
            'Baseado em eventos reais dos',
            'anos 80 e 90, quando jovens',
            'disputavam território através',
            'de pixações e confrontos.',
            '',
            'O protagonista MadMax busca',
            'vingança contra a gangue rival',
            'Komando Satânico após terem',
            'pixado por cima de sua arte.',
            '',
            'PRESSIONE ESC PARA VOLTAR'
        ],
        
        // Inicializar menu
        init: function() {
            console.log('🎮 Inicializando menu principal...');
            
            // Carregar assets do menu
            this.loadMenuAssets();
            
            // Configurar handlers de input
            this.setupInputHandlers();
            
            // Tocar música do menu
            if (MadNight.audio && MadNight.audio.playMusic) {
                // Por enquanto usar música de suspense
                // Depois podemos adicionar uma música específica do menu
                MadNight.audio.playMusic('inicio');
            }
            
            console.log('✅ Menu inicializado');
        },
        
        // Carregar assets do menu
        loadMenuAssets: function() {
            // Logo do jogo
            if (MadNight.assets && MadNight.assets.get) {
                this.assets.logo = MadNight.assets.get('logo');
                this.assets.cursor = MadNight.assets.get('cursor_skull');
                this.assets.background = MadNight.assets.get('menu_bg');
            }
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
            
            switch(this.currentScreen) {
                case 'main':
                    this.handleMainMenu(e);
                    break;
                case 'options':
                    this.handleOptionsMenu(e);
                    break;
                case 'credits':
                case 'about':
                case 'ranking':
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
                    }
                    break;
                    
                case 'Escape':
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
                    document.documentElement.requestFullscreen();
                } else {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                }
            }
        },
        
        // Iniciar jogo
        startGame: function() {
            console.log('🎮 Iniciando jogo...');
            
            this.active = false;
            
            // Parar música do menu
            if (MadNight.audio && MadNight.audio.stopMusic) {
                MadNight.audio.stopMusic();
            }
            
            // Remover handler do menu
            if (this.keydownHandler) {
                window.removeEventListener('keydown', this.keydownHandler);
            }
            
            // Inicializar e começar o jogo
            if (MadNight.game && MadNight.game.init) {
                MadNight.game.init();
                MadNight.game.state.fromMenu = true;
            }
        },
        
        // Voltar ao menu
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
            if (MadNight.audio && MadNight.audio.playSFX) {
                MadNight.audio.playSFX('menu_select', 0.5);
            }
        },
        
        playConfirmSound: function() {
            if (MadNight.audio && MadNight.audio.playSFX) {
                MadNight.audio.playSFX('menu_confirm', 0.6);
            }
        },
        
        // Renderizar menu
        render: function(ctx) {
            if (!this.active) return;
            
            const canvas = ctx.canvas;
            
            // Limpar tela
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Background (se houver)
            if (this.assets.background && this.assets.background.loaded) {
                ctx.drawImage(this.assets.background.img, 0, 0);
            }
            
            // Renderizar tela atual
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
        },
        
        // Renderizar menu principal
        renderMainMenu: function(ctx) {
            const canvas = ctx.canvas;
            
            // Logo
            if (this.assets.logo && this.assets.logo.loaded) {
                const logoX = (canvas.width - this.assets.logo.width) / 2;
                ctx.drawImage(this.assets.logo.img, logoX, this.layout.logoY);
            } else {
                // Fallback - texto
                ctx.font = '48px "Press Start 2P"';
                ctx.fillStyle = '#f00';
                ctx.textAlign = 'center';
                ctx.fillText('MAD NIGHT', canvas.width / 2, this.layout.logoY);
            }
            
            // Opções do menu
            ctx.font = '16px "Press Start 2P"';
            ctx.textAlign = 'center';
            
            this.options.forEach((option, index) => {
                const y = this.layout.menuStartY + (index * this.layout.optionSpacing);
                
                // Destacar opção selecionada
                if (index === this.currentOption) {
                    ctx.fillStyle = '#ff0';
                    
                    // Cursor (caveira)
                    if (this.assets.cursor && this.assets.cursor.loaded) {
                        const cursorX = (canvas.width / 2) + this.layout.cursorOffset - 150;
                        ctx.drawImage(this.assets.cursor.img, cursorX, y - 20, 24, 24);
                    } else {
                        // Fallback - seta
                        ctx.fillText('>', (canvas.width / 2) - 150, y);
                    }
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                ctx.fillText(option.text, canvas.width / 2, y);
            });
            
            // Versão
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'right';
            ctx.fillText('v1.40', canvas.width - 20, canvas.height - 20);
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
                }
                
                // Cursor
                if (selected) {
                    ctx.fillStyle = '#ff0';
                    ctx.textAlign = 'left';
                    ctx.fillText('>', 70, y);
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
            
            ctx.font = '14px "Press Start 2P"';
            ctx.textAlign = 'center';
            
            this.credits.forEach((line, index) => {
                // Títulos em amarelo
                if (line === line.toUpperCase() && line !== '') {
                    ctx.fillStyle = '#ff0';
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                const y = 80 + (index * 25);
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
            ctx.fillText('RANKING', canvas.width / 2, 60);
            
            // Tabs
            const tabs = ['TEMPO', 'KILLS', 'PERFEITO'];
            ctx.font = '12px "Press Start 2P"';
            
            tabs.forEach((tab, index) => {
                const x = 200 + (index * 200);
                ctx.fillStyle = index === 0 ? '#ff0' : '#666';
                ctx.fillText(tab, x, 100);
            });
            
            // Mostrar ranking de tempo (por enquanto)
            const rankings = MadNight.stats ? MadNight.stats.getRankingDisplay('speedRun') : [];
            
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'left';
            
            rankings.forEach((score, index) => {
                const y = 140 + (index * 25);
                
                // Posição
                ctx.fillStyle = index < 3 ? '#ff0' : '#fff';
                ctx.fillText(`${score.position}.`, 150, y);
                
                // Nome
                ctx.fillText(score.name, 200, y);
                
                // Tempo
                ctx.textAlign = 'right';
                ctx.fillText(score.display, 400, y);
                
                // Mortes
                ctx.fillStyle = '#666';
                ctx.fillText(`${score.deaths} mortes`, 550, y);
                
                ctx.textAlign = 'left';
            });
            
            // Instrução
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('ESC PARA VOLTAR', canvas.width / 2, canvas.height - 40);
        },
        
        // Renderizar sobre o filme
        renderAbout: function(ctx) {
            const canvas = ctx.canvas;
            
            ctx.font = '14px "Press Start 2P"';
            ctx.textAlign = 'center';
            
            this.aboutText.forEach((line, index) => {
                // Título em amarelo
                if (index === 0) {
                    ctx.fillStyle = '#ff0';
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                const y = 80 + (index * 25);
                ctx.fillText(line, canvas.width / 2, y);
            });
        }
    };
    
    console.log('Módulo Menu carregado');
    
})();
