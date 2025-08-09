// renderer.js - Sistema de renderização

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
        const map = MadNight.maps.getCurrentMap();
        const camera = MadNight.camera;
        const visibleArea = camera.getVisibleArea();
        
        // Limpar tela
        this.clear();
        
        if (!map) return;
        
        try {
            // Aplicar transformação da câmera
            camera.applyTransform(ctx);
            
            // Background base
            ctx.fillStyle = MadNight.config.colors.background;
            ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
            
            // Camada 1: Base
            if (map.hasLayers && MadNight.game.state.currentMap === 1) {
                this.renderEixaoLayer1(map);
            } else {
                this.renderTiles(map, visibleArea);
                if (map.hasBackground && map.backgroundAsset) {
                    this.renderBackground(map);
                }
            }
            
            this.renderCampo(map);
            this.renderParkedCars(map, visibleArea);
            
            // Sombras e iluminação base
            MadNight.lighting.renderTreeShadows(ctx, map, visibleArea);
            this.renderTrees(map, visibleArea, 'bottom');
            this.renderObjects(map, visibleArea);
            this.renderBuildings(map, visibleArea, 'bottom');
            this.renderWalls(map, visibleArea);
            this.renderSpecialObjects(map);
            
            // Camada 2: Entidades
            MadNight.projectiles.render(ctx, visibleArea);
            MadNight.enemies.render(ctx, visibleArea);
            MadNight.player.render(ctx);
            
            // Camada 3: Sobreposições
            if (map.hasLayers && MadNight.game.state.currentMap === 1) {
                this.renderEixaoLayer2(map);
            }
            
            // Tráfego (apenas no Eixão)
            if (MadNight.game.state.currentMap === 1) {
                MadNight.traffic.render(ctx, visibleArea);
            }
            
            this.renderBuildings(map, visibleArea, 'top');
            this.renderCampoTraves();
            MadNight.lighting.renderFieldShadow(ctx, map);
            this.renderStreetLights(map, visibleArea);
            this.renderTrees(map, visibleArea, 'top');
            
            // DEBUG: Colisões
            if (MadNight.config.debug.showCollisions || MadNight.game.keys['c'] || MadNight.game.keys['C']) {
                this.renderCollisionDebug();
            }
            
            // Efeito de noite
            MadNight.lighting.renderNightOverlay(ctx, camera);
            
            // Luzes dos postes
            MadNight.lighting.renderStreetLights(ctx, map);
            MadNight.lighting.renderMapLights(ctx, map, visibleArea);
            
            // Resetar transformação
            camera.resetTransform(ctx);
            
            // UI (sem transformação de câmera)
            MadNight.ui.render(ctx);
            
        } catch (error) {
            console.error('Erro no render:', error);
            camera.resetTransform(ctx);
            
            ctx.fillStyle = '#f00';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ERRO NO RENDER', this.canvas.width/2, this.canvas.height/2);
            ctx.font = '20px Arial';
            ctx.fillText(error.message, this.canvas.width/2, this.canvas.height/2 + 40);
        }
    },
    
    // Renderizar tiles
    renderTiles: function(map, visibleArea) {
        if (!map.tiles) return;
        
        const ctx = this.ctx;
        
        map.tiles.forEach(tile => {
            const tileAsset = MadNight.assets.get(tile.type);
            if (tileAsset && tileAsset.loaded) {
                if (MadNight.camera.isVisible(tile)) {
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
        if (map.hasBackground && map.backgroundAsset) {
            const bgAsset = MadNight.assets.get(map.backgroundAsset);
            if (bgAsset && bgAsset.loaded) {
                this.ctx.drawImage(bgAsset.img, 0, 0);
            }
        }
    },
    
    // Renderizar campo de futebol
    renderCampo: function(map) {
        if (MadNight.game.state.currentMap === 0 && MadNight.assets.isLoaded('campo')) {
            const campoAsset = MadNight.assets.get('campo');
            const campoX = (map.width - 800) / 2;
            const campoY = (map.height - 462) / 2;
            this.ctx.drawImage(campoAsset.img, campoX, campoY);
        }
    },
    
    // Renderizar traves do campo
    renderCampoTraves: function() {
        if (MadNight.game.state.currentMap === 0 && MadNight.assets.isLoaded('campoTraves')) {
            const map = MadNight.maps.getCurrentMap();
            const travesAsset = MadNight.assets.get('campoTraves');
            const campoX = (map.width - 800) / 2;
            const campoY = (map.height - 462) / 2;
            this.ctx.drawImage(travesAsset.img, campoX, campoY);
        }
    },
    
    // Renderizar camadas do Eixão
    renderEixaoLayer1: function(map) {
        if (MadNight.game.state.currentMap === 1 && MadNight.assets.isLoaded('eixaoCamada1')) {
            const asset = MadNight.assets.get('eixaoCamada1');
            this.ctx.drawImage(asset.img, 0, 0);
        }
    },
    
    renderEixaoLayer2: function(map) {
        if (MadNight.game.state.currentMap === 1 && MadNight.assets.isLoaded('eixaoCamada2')) {
            const asset = MadNight.assets.get('eixaoCamada2');
            this.ctx.drawImage(asset.img, 0, 0);
        }
    },
    
    // Renderizar árvores
    renderTrees: function(map, visibleArea, layer = 'bottom') {
        if (!map.trees) return;
        
        const ctx = this.ctx;
        
        map.trees.forEach(tree => {
            const treeAsset = MadNight.assets.get(tree.type);
            if (treeAsset && treeAsset.loaded && MadNight.camera.isVisible(tree)) {
                if (layer === 'bottom') {
                    // Parte inferior da árvore
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(tree.x, tree.y + treeAsset.height * 0.7, 
                            treeAsset.width, treeAsset.height * 0.3);
                    ctx.clip();
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    ctx.restore();
                } else if (layer === 'top') {
                    // Parte superior da árvore
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(tree.x, tree.y, treeAsset.width, treeAsset.height * 0.75);
                    ctx.clip();
                    
                    // Verificar se player está sob a árvore
                    const player = MadNight.player;
                    const playerUnderTree = player.x + player.width > tree.x &&
                                          player.x < tree.x + treeAsset.width &&
                                          player.y + player.height > tree.y &&
                                          player.y < tree.y + treeAsset.height * 0.75;
                    
                    if (playerUnderTree) {
                        ctx.globalAlpha = 0.7;
                    }
                    
                    ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    ctx.restore();
                }
            }
        });
    },
    
    // Renderizar prédios
    renderBuildings: function(map, visibleArea, layer) {
        if (!map.buildings) return;
        
        const ctx = this.ctx;
        const player = MadNight.player;
        
        map.buildings.forEach(building => {
            const buildingAsset = MadNight.assets.get(building.type);
            if (buildingAsset && buildingAsset.loaded && MadNight.camera.isVisible(building)) {
                const cutLine = building.y + buildingAsset.height * 0.75;
                const playerBottom = player.y + player.height;
                
                if (layer === 'bottom' && playerBottom > cutLine) {
                    ctx.drawImage(buildingAsset.img, building.x, building.y);
                } else if (layer === 'top' && playerBottom <= cutLine) {
                    ctx.drawImage(buildingAsset.img, building.x, building.y);
                }
            }
        });
    },
    
    // Renderizar objetos
    renderObjects: function(map, visibleArea) {
        if (!map.objects) return;
        
        const ctx = this.ctx;
        
        map.objects.forEach(obj => {
            const objAsset = MadNight.assets.get(obj.type);
            if (objAsset && objAsset.loaded && MadNight.camera.isVisible(obj)) {
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
        });
    },
    
    // Renderizar postes de luz
    renderStreetLights: function(map, visibleArea) {
        if (!map.streetLights) return;
        
        const ctx = this.ctx;
        
        map.streetLights.forEach(light => {
            const lightAsset = MadNight.assets.get(light.type);
            if (lightAsset && lightAsset.loaded && MadNight.camera.isVisible(light)) {
                if (light.rotation) {
                    ctx.save();
                    const centerX = light.x + lightAsset.width / 2;
                    const centerY = light.y + lightAsset.height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(light.rotation * Math.PI / 180);
                    ctx.drawImage(lightAsset.img, -lightAsset.width / 2, -lightAsset.height / 2);
                    ctx.restore();
                } else {
                    ctx.drawImage(lightAsset.img, light.x, light.y);
                }
            }
        });
    },
    
    // Renderizar paredes
    renderWalls: function(map, visibleArea) {
        const ctx = this.ctx;
        ctx.fillStyle = '#666';
        
        map.walls.forEach(wall => {
            if (MadNight.camera.isVisible(wall)) {
                if (!wall.invisible) {
                    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                }
            }
        });
    },
    
    // Renderizar objetos especiais
    renderSpecialObjects: function(map) {
        const ctx = this.ctx;
        const gameState = MadNight.game.state;
        
        // Orelhão
        if (map.orelhao) {
            if (MadNight.assets.isLoaded('orelhao001')) {
                const orelhaoAsset = MadNight.assets.get('orelhao001');
                ctx.drawImage(orelhaoAsset.img, map.orelhao.x, map.orelhao.y);
            } else {
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
        
        // Saída
        if (map.exit) {
            const arrowMap = {
                'right': 'setadireita',
                'left': 'setaesquerda',
                'up': 'setanorte',
                'down': 'setasul'
            };
            
            const arrowAssetName = arrowMap[map.direction] || 'setadireita';
            const arrowAsset = MadNight.assets.get(arrowAssetName);
            
            if (arrowAsset && arrowAsset.loaded) {
                ctx.save();
                
                if (gameState.phase === 'escape') {
                    ctx.filter = 'hue-rotate(0deg) saturate(2) brightness(0.8) sepia(1) saturate(3) hue-rotate(0deg)';
                }
                
                const centerX = map.exit.x + (map.exit.w - arrowAsset.width) / 2;
                const centerY = map.exit.y + (map.exit.h - arrowAsset.height) / 2;
                
                ctx.drawImage(arrowAsset.img, centerX, centerY);
                ctx.restore();
            } else {
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
        const gameState = MadNight.game.state;
        
        // Carros especiais do mapa 2
        if (gameState.currentMap === 2) {
            const carros = MadNight.maps.getParkedCarsForMap2();
            
            carros.forEach(car => {
                const carAsset = MadNight.assets.get(car.type);
                if (carAsset && carAsset.loaded && MadNight.camera.isVisible(car)) {
                    this.ctx.drawImage(carAsset.img, car.x, car.y);
                } else if (MadNight.camera.isVisible(car)) {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(car.x, car.y, 150, 100);
                }
            });
        }
        
        // Carros normais de outros mapas
        if (map.parkedCars) {
            map.parkedCars.forEach(car => {
                const carAsset = MadNight.assets.get(car.type);
                if (carAsset && carAsset.loaded && MadNight.camera.isVisible(car)) {
                    this.ctx.drawImage(carAsset.img, car.x, car.y);
                }
            });
        }
    },
    
    // Renderizar debug de colisões
    renderCollisionDebug: function() {
        const ctx = this.ctx;
        const rects = MadNight.collision.getCollisionRects();
        
        ctx.save();
        
        const colors = {
            'building': 'rgba(255, 0, 0, 0.3)',
            'object': 'rgba(0, 255, 0, 0.3)',
            'car': 'rgba(0, 0, 255, 0.3)'
        };
        
        const strokeColors = {
            'building': 'rgba(255, 0, 0, 0.8)',
            'object': 'rgba(0, 255, 0, 0.8)',
            'car': 'rgba(0, 0, 255, 0.8)'
        };
        
        rects.forEach(rect => {
            ctx.fillStyle = colors[rect.type] || 'rgba(255, 255, 255, 0.3)';
            ctx.strokeStyle = strokeColors[rect.type] || 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        });
        
        ctx.restore();
    }
};
