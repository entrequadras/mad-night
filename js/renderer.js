// renderer.js - Sistema de renderização (Revisão Alpha-27 - Correção)

(function() {
    'use strict';
    
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
            this.ctx.font = size + 'px "Press Start 2P"';
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
                    height: this.canvas.height,
                    left: 0,
                    top: 0,
                    right: this.canvas.width,
                    bottom: this.canvas.height
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
                
                // Renderizar elementos superiores (árvores e traves no Mapa 0)
                this.renderUpperLayers(map, visibleArea);
                
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
                // Outros mapas - tiles primeiro, depois background
                this.renderTiles(map, visibleArea);
                this.renderBackground(map);
            }
            
            // Campo de futebol BASE (mapa 0) - sem as traves
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 0) {
                this.renderCampo(map);
            }
            
            // Carros estacionados
            this.renderParkedCars(map, visibleArea);
            
            // Luz de TV no mapa 2 (antes dos prédios)
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 2) {
                if (MadNight.lighting && MadNight.lighting.renderTVLight) {
                    MadNight.lighting.renderTVLight(this.ctx, map, visibleArea);
                }
            }
            
            // Objetos e estruturas
            this.renderObjects(map, visibleArea);
            
            // IMPORTANTE: Prédios - camada BOTTOM (atrás do player)
            this.renderBuildings(map, visibleArea, 'bottom');
            
            this.renderWalls(map, visibleArea);

            // Renderizar power-ups
            if (map.powerups) {
                const assets = MadNight.assets;
                map.powerups.forEach(powerup => {
                    if (!powerup.collected) {
                        const img = assets.get('objects', powerup.type);
                        if (img && img.complete) {
                            ctx.drawImage(img, powerup.x, powerup.y, 40, 35);
                        }
                    }
                });
            }
            
            // NÃO renderizar elementos superiores aqui - eles vão DEPOIS do player
            
            // Objetos especiais (orelhão, lixeira)
            this.renderSpecialObjects(map);
            
            // NO MAPA 0: NÃO renderizar árvores e postes aqui
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap !== 0) {
                // Outros mapas - renderizar normalmente
                this.renderTrees(map, visibleArea);
                this.renderStreetLights(map, visibleArea);
            }
        },
        
        // Renderizar entidades
        renderEntities: function(visibleArea) {
            const ctx = this.ctx;
            
            // Renderizar para todos os mapas normalmente
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
            
            // APÓS O PLAYER: Renderizar prédios TOP (na frente do player)
            const map = MadNight.maps.getCurrentMap();
            if (map) {
                this.renderBuildings(map, visibleArea, 'top');
            }
            
            // Sombras especiais do mapa 2 KS
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 2) {
                this.renderKSShadows(ctx);
            }
            
            // Sombras especiais do mapa 3
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 3) {
                this.renderMap3Shadows(ctx);
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
        
        // NOVO: Renderizar camadas superiores (árvores e traves no Mapa 0)
        renderUpperLayers: function(map, visibleArea) {
            // Apenas no Mapa 0 (Maconhão)
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 0) {
                
                // Árvores por cima do player (com transparência nas copas - 70% opacidade)
                this.ctx.save();
                this.ctx.globalAlpha = 0.7; // 30% transparente, 70% visível
                this.renderTrees(map, visibleArea);
                this.ctx.restore();
                
                // Postes (sem transparência)
                this.renderStreetLights(map, visibleArea);
                
                // Traves do campo por cima do player (sem transparência)
                this.renderCampoTraves(map);
            }
            
            // Renderizar orelhão sempre por cima (em todos os mapas que tiverem)
            if (map.orelhao) {
                const ctx = this.ctx;
                const orelhaoAsset = MadNight.assets.get('orelhao001');
                if (orelhaoAsset && orelhaoAsset.loaded && orelhaoAsset.img) {
                    ctx.drawImage(orelhaoAsset.img, map.orelhao.x, map.orelhao.y);
                } else {
                    // Fallback se não carregar
                    ctx.fillStyle = '#00f';
                    ctx.fillRect(map.orelhao.x, map.orelhao.y, map.orelhao.w, map.orelhao.h);
                    ctx.fillStyle = '#fff';
                    this.setPixelFont(8);
                    ctx.fillText('TEL', map.orelhao.x + 5, map.orelhao.y + 30);
                }
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
            if (MadNight.config && MadNight.config.debug && MadNight.config.debug.showCollisions) {
                this.renderCollisionDebug();
            }
        },
        
        // Renderizar tiles
        renderTiles: function(map, visibleArea) {
            // SEMPRE renderizar tiles, mesmo com background
            if (!map.tiles || !MadNight.assets) return;
            
            const ctx = this.ctx;
            
            map.tiles.forEach(function(tile) {
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
                // Background deve ser renderizado como base, não como overlay
                this.ctx.globalAlpha = 1.0; // Garantir opacidade total
                this.ctx.drawImage(bgAsset.img, 0, 0);
            }
        },
        
        // Renderizar campo de futebol (sem as traves)
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
            
            map.trees.forEach(function(tree) {
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
            
            // Aplicar sistema de corte dinâmico em TODOS os mapas
            map.buildings.forEach(function(building) {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(building)) {
                    
                    const buildingAsset = MadNight.assets.get(building.type);
                    if (buildingAsset && buildingAsset.loaded && buildingAsset.img) {
                        // Linha de corte em 75% da altura do prédio
                        const cutLine = building.y + buildingAsset.height * 0.75;
                        const playerBottom = player.y + player.height;
                        
                        // Renderizar prédio baseado na posição do player
                        if ((layer === 'bottom' && playerBottom > cutLine) ||
                            (layer === 'top' && playerBottom <= cutLine)) {
                            ctx.drawImage(buildingAsset.img, building.x, building.y);
                        }
                    }
                }
            });
        },
        
        // Renderizar objetos
        renderObjects: function(map, visibleArea) {
            if (!map.objects) return;
            
            const ctx = this.ctx;
            
            map.objects.forEach(function(obj) {
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
            
            map.streetLights.forEach(function(light) {
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
                map.walls.forEach(function(wall) {
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
            
            // Orelhão será renderizado em renderUpperLayers (acima de tudo)
            // Não renderizar aqui
            
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
                
                carros.forEach(function(car) {
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
            
            rects.forEach(function(rect) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
            });
            
            // Debug de colisões
            if (MadNight.config && MadNight.config.debug && MadNight.config.debug.showCollisions) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                
                // Debug da primeira TV
                ctx.beginPath();
                ctx.arc(360, 110, 50, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#00ff00';
                ctx.font = '12px Arial';
                ctx.fillText('TV1', 340, 110);
                
                // Debug da segunda TV
                ctx.beginPath();
                ctx.arc(1740, 290, 50, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillText('TV2', 1720, 290);
            }
            
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
                {x: 1665, y: 678, radius: 200},
                // NOVAS SOMBRAS
                {x: 745, y: 1350, radius: 250},
                {x: 160, y: 610, radius: 250}
            ];
            
            // Renderizar cada sombra com gradiente suave (como o campo)
            shadows.forEach(function(shadow) {
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
            
            cornerShadows.forEach(function(corner) {
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
        },
        
        // Renderizar sombras do Mapa 3 (Na área da KS)
        renderMap3Shadows: function(ctx) {
            ctx.save();
            
            // Sombras principais do mapa
            const shadows = [
                // Sombras na área inferior (0x2700 até 1900x3000)
                {x: 200, y: 2750, radius: 350},
                {x: 600, y: 2800, radius: 400},
                {x: 1000, y: 2850, radius: 240},
                {x: 1400, y: 2780, radius: 380},
                {x: 1700, y: 2900, radius: 400},
                
                // Sombras médias espalhadas pelo mapa
                {x: 500, y: 50, radius: 300},
                {x: 500, y: 500, radius: 300},
                {x: 500, y: 1500, radius: 300},
                {x: 1100, y: 700, radius: 350},
                {x: 1200, y: 1250, radius: 350},
                {x: 1250, y: 900, radius: 350},
                {x: 900, y: 800, radius: 280},
                {x: 1600, y: 600, radius: 320},
                {x: 350, y: 1950, radius: 300},
                {x: 1200, y: 1600, radius: 280},

                // Sombras dos cantos do mapa
                {x: 50, y: 100, radius: 300},
                {x: 550, y: 60, radius: 300},
                {x: 10, y: 400, radius: 300},
                {x: 14, y: 700, radius: 350},
                {x: 90, y: 1000, radius: 280},
                {x: 16, y: 1300, radius: 320},
                {x: 35, y: 1700, radius: 300},
                {x: 90, y: 2000, radius: 280},
                {x: 70, y: 2400, radius: 280},
                {x: 90, y: 2700, radius: 280},
                {x: 1850, y: 100, radius: 300},
                {x: 1810, y: 400, radius: 300},
                {x: 1814, y: 700, radius: 350},
                {x: 1890, y: 1000, radius: 280},
                {x: 1886, y: 1300, radius: 320},
                {x: 1835, y: 1700, radius: 300},
                {x: 1890, y: 2000, radius: 280},
                {x: 1870, y: 2400, radius: 280},
                {x: 1890, y: 2700, radius: 280}
            ];
            
            // Renderizar cada sombra com gradiente suave
            shadows.forEach(function(shadow) {
                const gradient = ctx.createRadialGradient(
                    shadow.x, shadow.y, 0,
                    shadow.x, shadow.y, shadow.radius
                );
                
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
            
            // Sombras nos quatro cantos do mapa
            const cornerShadows = [
                {x: 0, y: 0, radius: 500},
                {x: 1400, y: 0, radius: 500},
                {x: 0, y: 3000, radius: 600},
                {x: 1920, y: 3000, radius: 600}
            ];
            
            cornerShadows.forEach(function(corner) {
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
    
    console.log('Módulo Renderer carregado');
    
})();
