// renderer.js - Sistema de renderização (Recuperação Alpha-13)

MadNight.renderer = {
    // Contexto do canvas
    ctx: null,
    canvas: null,
    
    // Inicializar renderer
    init: function(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Configurar fonte padrão
        this.setPixelFont(10);
        
        console.log('Renderer inicializado');
    },
    
    // Helper para definir fonte pixel
    setPixelFont: function(size) {
        this.ctx.font = `${size}px "Press Start 2P"`;
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
    },
    
    // Limpar tela
    clear: function() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    // Renderizar frame completo
    render: function() {
        const ctx = this.ctx;
        
        if (!ctx || !this.canvas) {
            console.error('Renderer não inicializado');
            return;
        }
        
        // Limpar tela
        this.clear();
        
        // Verificar se os módulos necessários existem
        if (!MadNight.maps || !MadNight.camera) {
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Carregando...', this.canvas.width/2, this.canvas.height/2);
            return;
        }
        
        const map = MadNight.maps.getCurrentMap();
        const camera = MadNight.camera;
        
        if (!map) {
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Mapa não encontrado', this.canvas.width/2, this.canvas.height/2);
            return;
        }
        
        try {
            const visibleArea = camera.getVisibleArea ? camera.getVisibleArea() : {
                x: 0, y: 0,
                width: this.canvas.width,
                height: this.canvas.height
            };
            
            // Aplicar transformação da câmera
            if (camera.applyTransform) {
                camera.applyTransform(ctx);
            }
            
            // Background base
            ctx.fillStyle = MadNight.config.colors.background;
            ctx.fillRect(
                camera.x || 0,
                camera.y || 0,
                camera.width || this.canvas.width,
                camera.height || this.canvas.height
            );
            
            // Renderizar camadas do mapa
            this.renderMapLayers(map, visibleArea);
            
            // Renderizar entidades
            this.renderEntities(visibleArea);
            
            // Renderizar efeitos
            this.renderEffects(map, visibleArea);
            
            // Resetar transformação
            if (camera.resetTransform) {
                camera.resetTransform(ctx);
            }
            
            // UI (sem transformação de câmera)
            if (MadNight.ui && MadNight.ui.render) {
                MadNight.ui.render(ctx);
            }
            
        } catch (error) {
            console.error('Erro no render:', error);
            if (camera && camera.resetTransform) {
                camera.resetTransform(ctx);
            }
            
            ctx.fillStyle = '#f00';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ERRO NO RENDER', this.canvas.width/2, this.canvas.height/2);
            ctx.font = '20px Arial';
            ctx.fillText(error.message, this.canvas.width/2, this.canvas.height/2 + 40);
        }
    },
    
    // Renderizar camadas do mapa
    renderMapLayers: function(map, visibleArea) {
        const ctx = this.ctx;
        
        // Camada 1: Background/Tiles
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 1) {
            // Eixão - usar imagem de fundo
            this.renderEixaoBackground();
        } else {
            // Outros mapas - tiles
            this.renderTiles(map, visibleArea);
            this.renderBackground(map);
        }
        
        // Campo de futebol (mapa 0)
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 0) {
            this.renderCampo(map);
        }
        
        // Carros estacionados
        this.renderParkedCars(map, visibleArea);
        
        // ENTIDADES (player/inimigos) ANTES das sombras no mapa 2
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 2) {
            // Renderizar entidades primeiro
            this.renderEntities(visibleArea);
            
            // DEPOIS renderizar sombras por cima deles
            this.renderKSShadows(ctx);
        }
        
        // Objetos e estruturas
        this.renderObjects(map, visibleArea);
        this.renderBuildings(map, visibleArea, 'bottom');
        this.renderWalls(map, visibleArea);
        
        // Elementos superiores
        this.renderBuildings(map, visibleArea, 'top');
        
        // Objetos especiais (orelhão, lixeira) DEPOIS dos prédios
        this.renderSpecialObjects(map);
        
        // Árvores e postes por cima de tudo
        this.renderTrees(map, visibleArea);
        this.renderStreetLights(map, visibleArea);
        
        // Traves do campo (acima do player) - mapa 0
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 0) {
            this.renderCampoTraves(map);
        }
    },
    
    // Renderizar entidades
    renderEntities: function(visibleArea) {
        const ctx = this.ctx;
        
        // No mapa 2, as entidades são renderizadas em renderMapLayers
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 2) {
            // Já foi renderizado em renderMapLayers, pular
            return;
        }
        
        // Outros mapas - ordem normal
        // Projéteis
        if (MadNight.projectiles && MadNight.projectiles.render) {
            MadNight.projectiles.render(ctx, visibleArea);
        }
        
        // Inimigos
        if (MadNight.enemies && MadNight.enemies.render) {
            MadNight.enemies.render(ctx, visibleArea);
        }
        
        // Player
        if (MadNight.player && MadNight.player.render) {
            MadNight.player.render(ctx);
        }
        
        // Overlay do Eixão (camada 2) ANTES do tráfego
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 1) {
            this.renderEixaoOverlay();
        }
        
        // Tráfego DEPOIS do overlay (carros por cima)
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 1 && 
            MadNight.traffic && MadNight.traffic.render) {
            MadNight.traffic.render(ctx, visibleArea);
        }
    },
    
    // Renderizar efeitos
    renderEffects: function(map, visibleArea) {
        const ctx = this.ctx;
        
        // Calcular área visível correta
        if (!visibleArea || !visibleArea.left) {
            const camera = MadNight.camera || {};
            visibleArea = {
                left: camera.x || 0,
                top: camera.y || 0,
                right: (camera.x || 0) + (camera.width || this.canvas.width),
                bottom: (camera.y || 0) + (camera.height || this.canvas.height)
            };
        }
        
        // Iluminação
        if (MadNight.lighting) {
            if (MadNight.lighting.renderTreeShadows) {
                MadNight.lighting.renderTreeShadows(ctx, map, visibleArea);
            }
            
            // Sombras especiais do campo (mapa 0)
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 0) {
                if (MadNight.lighting.renderFieldShadow) {
                    MadNight.lighting.renderFieldShadow(ctx, map);
                }
            }
            
            if (MadNight.lighting.renderNightOverlay) {
                MadNight.lighting.renderNightOverlay(ctx, MadNight.camera);
            }
            if (MadNight.lighting.renderStreetLights) {
                MadNight.lighting.renderStreetLights(ctx, map);
            }
            // IMPORTANTE: Renderizar luzes customizadas do mapa (Eixão)
            if (MadNight.lighting.renderMapLights) {
                MadNight.lighting.renderMapLights(ctx, map, visibleArea);
            }
        }
        
        // Debug
        if (MadNight.config.debug.showCollisions) {
            this.renderCollisionDebug();
        }
    },
    
    // Renderizar tiles
    renderTiles: function(map, visibleArea) {
        if (!map.tiles || !MadNight.assets) return;
        
        const ctx = this.ctx;
        
        map.tiles.forEach(tile => {
            if (!MadNight.camera || !MadNight.camera.isVisible || 
                MadNight.camera.isVisible(tile)) {
                
                const tileAsset = MadNight.assets.get(tile.type);
                if (tileAsset && tileAsset.loaded && tileAsset.img) {
                    ctx.drawImage(
                        tileAsset.img,
                        0, 0, 120, 120,
                        Math.floor(tile.x), Math.floor(tile.y),
                        121, 121
                    );
                }
            }
        });
    },
    
    // Renderizar background
    renderBackground: function(map) {
        if (!map.hasBackground || !map.backgroundAsset) return;
        
        const bgAsset = MadNight.assets.get(map.backgroundAsset);
        if (bgAsset && bgAsset.loaded && bgAsset.img) {
            this.ctx.drawImage(bgAsset.img, 0, 0);
        }
    },
    
    // Renderizar campo de futebol
    renderCampo: function(map) {
        const campoAsset = MadNight.assets.get('campo');
        if (campoAsset && campoAsset.loaded && campoAsset.img) {
            const campoX = (map.width - 800) / 2;
            const campoY = (map.height - 462) / 2;
            this.ctx.drawImage(campoAsset.img, campoX, campoY);
        }
    },
    
    // Renderizar traves do campo (acima do player)
    renderCampoTraves: function(map) {
        const travesAsset = MadNight.assets.get('campoTraves');
        if (travesAsset && travesAsset.loaded && travesAsset.img) {
            const campoX = (map.width - 800) / 2;
            const campoY = (map.height - 462) / 2;
            this.ctx.drawImage(travesAsset.img, campoX, campoY);
        }
    },
    
    // Renderizar background do Eixão
    renderEixaoBackground: function() {
        const eixao1 = MadNight.assets.get('eixaoCamada1');
        if (eixao1 && eixao1.loaded && eixao1.img) {
            this.ctx.drawImage(eixao1.img, 0, 0);
        }
    },
    
    // Renderizar overlay do Eixão
    renderEixaoOverlay: function() {
        const eixao2 = MadNight.assets.get('eixaoCamada2');
        if (eixao2 && eixao2.loaded && eixao2.img) {
            this.ctx.drawImage(eixao2.img, 0, 0);
        }
    },
    
    // Renderizar árvores
    renderTrees: function(map, visibleArea) {
        if (!map.trees) return;
        
        const ctx = this.ctx;
        
        map.trees.forEach(tree => {
            if (!MadNight.camera || !MadNight.camera.isVisible || 
                MadNight.camera.isVisible(tree)) {
                
                const treeAsset = MadNight.assets.get(tree.type);
                if (treeAsset && treeAsset.loaded && treeAsset.img) {
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                }
            }
        });
    },
    
    // Renderizar prédios
    renderBuildings: function(map, visibleArea, layer) {
        if (!map.buildings || !MadNight.player) return;
        
        const ctx = this.ctx;
        const player = MadNight.player;
        
        // No mapa 2 (KS), prédios sempre acima
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 2) {
            // Só renderizar na camada 'top'
            if (layer === 'top') {
                map.buildings.forEach(building => {
                    if (!MadNight.camera || !MadNight.camera.isVisible || 
                        MadNight.camera.isVisible(building)) {
                        
                        const buildingAsset = MadNight.assets.get(building.type);
                        if (buildingAsset && buildingAsset.loaded && buildingAsset.img) {
                            ctx.drawImage(buildingAsset.img, building.x, building.y);
                        }
                    }
                });
            }
        } else {
            // Outros mapas - sistema de corte dinâmico
            map.buildings.forEach(building => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(building)) {
                    
                    const buildingAsset = MadNight.assets.get(building.type);
                    if (buildingAsset && buildingAsset.loaded && buildingAsset.img) {
                        const cutLine = building.y + buildingAsset.height * 0.75;
                        const playerBottom = player.y + player.height;
                        
                        if ((layer === 'bottom' && playerBottom > cutLine) ||
                            (layer === 'top' && playerBottom <= cutLine)) {
                            ctx.drawImage(buildingAsset.img, building.x, building.y);
                        }
                    }
                }
            });
        }
    },
    
    // Renderizar objetos
    renderObjects: function(map, visibleArea) {
        if (!map.objects) return;
        
        const ctx = this.ctx;
        
        map.objects.forEach(obj => {
            if (!MadNight.camera || !MadNight.camera.isVisible || 
                MadNight.camera.isVisible(obj)) {
                
                const objAsset = MadNight.assets.get(obj.type);
                if (objAsset && objAsset.loaded && objAsset.img) {
                    if (obj.rotation) {
                        ctx.save();
                        const centerX = obj.x + objAsset.width / 2;
                        const centerY = obj.y + objAsset.height / 2;
                        ctx.translate(centerX, centerY);
                        ctx.rotate(obj.rotation * Math.PI / 180);
                        ctx.drawImage(objAsset.img, -objAsset.width / 2, -objAsset.height / 2);
                        ctx.restore();
                    } else {
                        ctx.drawImage(objAsset.img, obj.x, obj.y);
                    }
                }
            }
        });
    },
    
    // Renderizar postes
    renderStreetLights: function(map, visibleArea) {
        if (!map.streetLights) return;
        
        const ctx = this.ctx;
        
        map.streetLights.forEach(light => {
            if (!MadNight.camera || !MadNight.camera.isVisible || 
                MadNight.camera.isVisible(light)) {
                
                const lightAsset = MadNight.assets.get(light.type);
                if (lightAsset && lightAsset.loaded && lightAsset.img) {
                    // Usar tamanho do asset
                    const width = lightAsset.width || 40;
                    const height = lightAsset.height || 120;
                    
                    ctx.drawImage(lightAsset.img, light.x, light.y, width, height);
                }
            }
        });
    },
    
    // Renderizar paredes
    renderWalls: function(map, visibleArea) {
        const ctx = this.ctx;
        ctx.fillStyle = '#666';
        
        if (map.walls) {
            map.walls.forEach(wall => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(wall)) {
                    if (!wall.invisible) {
                        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                    }
                }
            });
        }
    },
    
    // Renderizar objetos especiais
    renderSpecialObjects: function(map) {
        const ctx = this.ctx;
        const gameState = MadNight.game ? MadNight.game.state : {};
        
        // Orelhão
        if (map.orelhao) {
            const orelhaoAsset = MadNight.assets.get('orelhao001');
            if (orelhaoAsset && orelhaoAsset.loaded && orelhaoAsset.img) {
                // Usar sprite do orelhão
                this.ctx.drawImage(orelhaoAsset.img, map.orelhao.x, map.orelhao.y);
            } else {
                // Fallback se não carregar
                ctx.fillStyle = '#00f';
                ctx.fillRect(map.orelhao.x, map.orelhao.y, map.orelhao.w, map.orelhao.h);
                ctx.fillStyle = '#fff';
                this.setPixelFont(8);
                ctx.fillText('TEL', map.orelhao.x + 5, map.orelhao.y + 30);
            }
        }
        
        // Lixeira
        if (map.lixeira) {
            ctx.fillStyle = gameState.bombPlaced ? '#f00' : '#080';
            ctx.fillRect(map.lixeira.x, map.lixeira.y, map.lixeira.w, map.lixeira.h);
            ctx.fillStyle = '#fff';
            this.setPixelFont(8);
            ctx.fillText(gameState.bombPlaced ? 'BOOM!' : 'LIXO', 
                        map.lixeira.x + 2, map.lixeira.y + 25);
        }
        
        // Saída com setas direcionais
        if (map.exit) {
            // Determinar qual seta usar baseado na direção do mapa
            const arrowMap = {
                'right': 'setadireita',
                'left': 'setaesquerda',
                'up': 'setanorte',
                'down': 'setasul'
            };
            
            const arrowAssetName = arrowMap[map.direction] || 'setadireita';
            const arrowAsset = MadNight.assets.get(arrowAssetName);
            
            if (arrowAsset && arrowAsset.loaded && arrowAsset.img) {
                // Background da saída (verde ou vermelho)
                ctx.fillStyle = gameState.phase === 'escape' ? 
                    'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(map.exit.x, map.exit.y, map.exit.w, map.exit.h);
                
                // Centralizar seta na área de saída
                const centerX = map.exit.x + (map.exit.w - arrowAsset.width) / 2;
                const centerY = map.exit.y + (map.exit.h - arrowAsset.height) / 2;
                
                // Renderizar seta
                ctx.drawImage(arrowAsset.img, centerX, centerY);
            } else {
                // Fallback se a seta não carregar
                ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
                ctx.fillRect(map.exit.x, map.exit.y, map.exit.w, map.exit.h);
                ctx.fillStyle = '#fff';
                this.setPixelFont(8);
                ctx.fillText(gameState.phase === 'escape' ? 'VOLTA' : 'SAÍDA', 
                            map.exit.x + 5, map.exit.y + 20);
            }
        }
    },
    
    // Renderizar carros estacionados
    renderParkedCars: function(map, visibleArea) {
        const ctx = this.ctx;
        
        // Carros do mapa 2
        if (MadNight.game && MadNight.game.state && 
            MadNight.game.state.currentMap === 2) {
            
            const carros = MadNight.maps.getParkedCarsForMap2();
            
            carros.forEach(car => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(car)) {
                    
                    const carAsset = MadNight.assets.get(car.type);
                    if (carAsset && carAsset.loaded && carAsset.img) {
                        ctx.drawImage(carAsset.img, car.x, car.y);
                    } else {
                        ctx.fillStyle = '#444';
                        ctx.fillRect(car.x, car.y, 150, 100);
                    }
                }
            });
        }
    },
    
    // Renderizar debug de colisões
    renderCollisionDebug: function() {
        if (!MadNight.collision || !MadNight.collision.getCollisionRects) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        const rects = MadNight.collision.getCollisionRects();
        
        rects.forEach(rect => {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        });
        
        ctx.restore();
    },
    
    // Renderizar sombras customizadas do mapa KS (estilo Maconhão)
    renderKSShadows: function(ctx) {
        ctx.save();
        
        // Usar mesmo estilo das sombras do Maconhão
        const shadows = [
            // Sombras grandes (como as do campo)
            {x: 1700, y: 1600, radius: 400},
            {x: 855, y: 1000, radius: 450}, // sombra bem larga
            {x: 1900, y: 520, radius: 350},
            {x: 1845, y: 40, radius: 300},
            {x: 780, y: 5, radius: 300},
            {x: 1230, y: 2, radius: 300},
            {x: 75, y: 970, radius: 350},
            // Sombra média
            {x: 1665, y: 678, radius: 200}
        ];
        
        // Renderizar cada sombra com gradiente suave (como o campo)
        shadows.forEach(shadow => {
            const gradient = ctx.createRadialGradient(
                shadow.x, shadow.y, 0,
                shadow.x, shadow.y, shadow.radius
            );
            
            // Mesmo gradiente do renderFieldShadow
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.54)');
            gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.42)');
            gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.24)');
            gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.12)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                shadow.x - shadow.radius,
                shadow.y - shadow.radius,
                shadow.radius * 2,
                shadow.radius * 2
            );
        });
        
        // Adicionar sombras nos cantos (como no Maconhão)
        const cornerShadows = [
            {x: 0, y: 0, radius: 400},
            {x: 1920, y: 0, radius: 400},
            {x: 0, y: 1610, radius: 400},
            {x: 1920, y: 1610, radius: 400}
        ];
        
        cornerShadows.forEach(corner => {
            const gradient = ctx.createRadialGradient(
                corner.x, corner.y, 0,
                corner.x, corner.y, corner.radius
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
            gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.36)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                corner.x - corner.radius,
                corner.y - corner.radius,
                corner.radius * 2,
                corner.radius * 2
            );
        });
        
        ctx.restore();
    }
};
