// loader.js - Sistema de Carregamento Progressivo

(function() {
    'use strict';
    
    MadNight.loader = {
        // Estado do carregamento
        state: {
            isLoading: false,
            currentPhase: 'idle',
            progress: 0,
            loadedMaps: new Set(),
            assetsToLoad: [],
            assetsLoaded: 0,
            totalAssets: 0
        },
        
        // Assets base (sempre carregados no início)
        baseAssets: [
            // Sprites do player
            'player_idle', 'player_walk1', 'player_walk2', 'player_dash',
            'player_death1', 'player_death2', 'player_death3', 'player_death4',
            
            // Inimigos básicos
            'faquinha', 'morcego', 'caveirinha', 'janis', 'chacal',
            
            // Tiles comuns
            'grama000', 'grama001', 'grama002', 'grama003', 'grama004',
            'asfaltosujo001', 'asfaltosujo002', 'asfaltosujo003', 'asfaltosujo004', 'asfaltosujo005',
            
            // UI e objetos comuns
            'orelhao001', 'setadireita', 'setaesquerda', 'setanorte', 'setasul',
            
            // Árvores (usadas em vários mapas)
            'arvore001', 'arvore002', 'arvore003', 'arvore004',
            'arvore006', 'arvore007', 'arvore008', 'arvorebloco001'
        ],
        
        // Assets específicos por mapa
        mapAssets: {
            0: [ // Maconhão
                'campo', 'campoTraves',
                'poste000', 'poste001',
                'caixadeluz', 'banco03', 'banco04',
                'garrafaquebrada01', 'garrafaquebrada02',
                'cadeiradepraia01'
            ],
            1: [ // Eixão
                'eixaoCamada1', 'eixaoCamada2'
                // Carros do tráfego são carregados dinamicamente
            ],
            2: [ // Entrada KS
                'entradaKS01',
                'predio0002', 'predio0003', 'predio0006', 'predio0008',
                'parquinho', 'banco01',
                'carro002frente', 'carrolateral_02', 'carrolateral_03',
                'carrolateral_04', 'carrolateral_06', 'carrolateral_07', 'carrolateral_08'
            ],
            3: [], // Placeholder - Na área da KS
            4: [], // Placeholder - Entre Prédios
            5: []  // Placeholder - Ninho dos Ratos
        },
        
        // Inicializar sistema de loading
        init: function() {
            console.log('Sistema de Loading Progressivo inicializado');
        },
        
        // Carregar assets base + primeiro mapa
        loadInitial: function(callback) {
            console.log('🎮 Iniciando carregamento inicial...');
            this.state.isLoading = true;
            this.state.currentPhase = 'initial';
            this.state.progress = 0;
            
            // Coletar todos os assets iniciais
            const initialAssets = [
                ...this.baseAssets,
                ...this.mapAssets[0] // Mapa 0 (Maconhão)
            ];
            
            this.state.totalAssets = initialAssets.length;
            this.state.assetsLoaded = 0;
            
            // Simular carregamento progressivo
            this.loadAssetBatch(initialAssets, () => {
                this.state.loadedMaps.add(0);
                this.state.isLoading = false;
                console.log('✅ Carregamento inicial completo!');
                
                // Pré-carregar próximo mapa em background
                setTimeout(() => {
                    this.preloadMap(1);
                }, 1000);
                
                if (callback) callback();
            });
        },
        
        // Carregar batch de assets
        loadAssetBatch: function(assetList, callback) {
            let loaded = 0;
            const total = assetList.length;
            
            assetList.forEach((assetName, index) => {
                // Simular delay de carregamento
                setTimeout(() => {
                    loaded++;
                    this.state.assetsLoaded++;
                    this.state.progress = (this.state.assetsLoaded / this.state.totalAssets) * 100;
                    
                    // Atualizar UI de loading se existir
                    if (MadNight.ui && MadNight.ui.updateLoadingProgress) {
                        MadNight.ui.updateLoadingProgress(this.state.progress, assetName);
                    }
                    
                    console.log(`Carregando: ${assetName} (${Math.floor(this.state.progress)}%)`);
                    
                    if (loaded === total && callback) {
                        callback();
                    }
                }, index * 50); // 50ms entre cada asset para visualização
            });
        },
        
        // Pré-carregar próximo mapa
        preloadMap: function(mapIndex) {
            // Se já foi carregado, ignorar
            if (this.state.loadedMaps.has(mapIndex)) {
                return;
            }
            
            // Se não existe o mapa, ignorar
            if (!this.mapAssets[mapIndex]) {
                return;
            }
            
            console.log(`📦 Pré-carregando mapa ${mapIndex} em background...`);
            
            const assets = this.mapAssets[mapIndex];
            if (assets.length > 0) {
                // Carregar silenciosamente em background
                assets.forEach(assetName => {
                    // Aqui você chamaria MadNight.assets.load(assetName)
                    // Por enquanto, apenas simular
                    setTimeout(() => {
                        console.log(`  → ${assetName} carregado em background`);
                    }, Math.random() * 1000);
                });
            }
            
            this.state.loadedMaps.add(mapIndex);
            
            // Pré-carregar o próximo também (cascata)
            if (mapIndex < 5) {
                setTimeout(() => {
                    this.preloadMap(mapIndex + 1);
                }, 3000);
            }
        },
        
        // Verificar se um mapa está carregado
        isMapLoaded: function(mapIndex) {
            return this.state.loadedMaps.has(mapIndex);
        },
        
        // Forçar carregamento de um mapa específico
        loadMapAssets: function(mapIndex, callback) {
            if (this.isMapLoaded(mapIndex)) {
                if (callback) callback();
                return;
            }
            
            const assets = this.mapAssets[mapIndex];
            if (!assets || assets.length === 0) {
                this.state.loadedMaps.add(mapIndex);
                if (callback) callback();
                return;
            }
            
            console.log(`⏳ Carregando assets do mapa ${mapIndex}...`);
            this.loadAssetBatch(assets, () => {
                this.state.loadedMaps.add(mapIndex);
                console.log(`✅ Mapa ${mapIndex} carregado!`);
                if (callback) callback();
            });
        },
        
        // Limpar assets não utilizados (otimização de memória)
        cleanupUnusedAssets: function(currentMapIndex) {
            // Manter apenas:
            // - Assets base
            // - Mapa atual
            // - Mapa anterior (para voltar)
            // - Próximo mapa (para avançar)
            
            const mapsToKeep = new Set([
                currentMapIndex,
                Math.max(0, currentMapIndex - 1),
                Math.min(5, currentMapIndex + 1)
            ]);
            
            // Limpar mapas distantes
            for (let i = 0; i <= 5; i++) {
                if (!mapsToKeep.has(i) && this.state.loadedMaps.has(i)) {
                    console.log(`🗑️ Limpando assets do mapa ${i}`);
                    // Aqui você chamaria MadNight.assets.unload() para os assets do mapa
                    this.state.loadedMaps.delete(i);
                }
            }
        },
        
        // Obter estado do loading
        getLoadingState: function() {
            return {
                isLoading: this.state.isLoading,
                progress: this.state.progress,
                phase: this.state.currentPhase
            };
        },
        
        // Criar tela de loading
        renderLoadingScreen: function(ctx, canvas) {
            // Background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Logo (placeholder)
            ctx.fillStyle = '#f00';
            ctx.font = '48px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('MAD NIGHT', canvas.width / 2, canvas.height / 2 - 100);
            
            // Barra de progresso
            const barWidth = 400;
            const barHeight = 20;
            const barX = (canvas.width - barWidth) / 2;
            const barY = canvas.height / 2;
            
            // Borda da barra
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Preenchimento da barra
            const fillWidth = (barWidth - 4) * (this.state.progress / 100);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(barX + 2, barY + 2, fillWidth, barHeight - 4);
            
            // Porcentagem
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Press Start 2P"';
            ctx.fillText(
                Math.floor(this.state.progress) + '%',
                canvas.width / 2,
                barY + barHeight + 40
            );
            
            // Dica aleatória
            const tips = [
                'Fique nas sombras para evitar inimigos',
                'Use o dash com sabedoria - ele tem cooldown',
                'Elimine todos os inimigos antes de plantar a bomba',
                'Cuidado com o Chacal - ele aguenta 3 hits',
                'As árvores criam áreas de stealth'
            ];
            
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#888';
            const tipIndex = Math.floor(Date.now() / 3000) % tips.length;
            ctx.fillText(tips[tipIndex], canvas.width / 2, canvas.height - 50);
        }
    };
    
    console.log('Módulo Loader carregado');
    
})();
