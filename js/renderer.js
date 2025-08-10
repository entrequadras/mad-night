// renderer.js - Sistema de renderização (Revisão Alpha-11)
// SUBSTITUA TODO O SEU renderer.js POR ESTE ARQUIVO

(function() {
    'use strict';
    
    // Variáveis internas do renderer
    let ctx = null;
    let canvas = null;
    
    // Criar objeto renderer
    const renderer = {
        // Contexto do canvas
        ctx: null,
        canvas: null,
        
        // Inicializar renderer
        init: function(canvasElement) {
            canvas = canvasElement;
            ctx = canvasElement.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            // Salvar referências
            this.canvas = canvas;
            this.ctx = ctx;
            
            // Configurar fonte padrão
            this.setPixelFont(10);
            
            console.log('Renderer inicializado');
        },
        
        // Helper para definir fonte pixel
        setPixelFont: function(size) {
            if (!ctx) return;
            ctx.font = `${size}px "Press Start 2P"`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
        },
        
        // Limpar tela
        clear: function() {
            if (!ctx) return;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },
        
        // Renderizar frame completo
        render: function() {
            if (!ctx || !canvas) {
                console.error('Renderer não inicializado');
                return;
            }
            
            // Verificar se os módulos necessários existem
            if (!MadNight.maps || !MadNight.camera) {
                this.clear();
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Carregando...', canvas.width/2, canvas.height/2);
                return;
            }
            
            const map = MadNight.maps.getCurrentMap();
            const camera = MadNight.camera;
            
            // Limpar tela
            this.clear();
            
            if (!map) {
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Mapa não encontrado', canvas.width/2, canvas.height/2);
                return;
            }
            
            try {
                // Obter área visível
                const visibleArea = camera.getVisibleArea ? camera.getVisibleArea() : {
                    x: 0, y: 0, 
                    width: canvas.width, 
                    height: canvas.height
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
                    camera.width || canvas.width, 
                    camera.height || canvas.height
                );
                
                // Renderizar camadas do mapa
                this.renderMapLayers(map, visibleArea);
                
                // Renderizar entidades
                this.renderEntities(visibleArea);
                
                // Renderizar overlay do Eixão (camada 2)
                this.renderEixaoOverlay();
                
                // Renderizar tráfego DEPOIS do overlay (carros ficam acima)
                if (MadNight.game && MadNight.game.state && 
                    MadNight.game.state.currentMap === 1 && 
                    MadNight.traffic && MadNight.traffic.render) {
                    MadNight.traffic.render(ctx, visibleArea);
                }
                
                // Renderizar efeitos e overlays
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
                if (camera.resetTransform) {
                    camera.resetTransform(ctx);
                }
                
                ctx.fillStyle = '#f00';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ERRO NO RENDER', canvas.width/2, canvas.height/2);
                ctx.font = '20px Arial';
                ctx.fillText(error.message, canvas.width/2, canvas.height/2 + 40);
            }
        },
        
        // Renderizar camadas do mapa
        renderMapLayers: function(map, visibleArea) {
            // IMPORTANTE: Renderizar camadas do Eixão PRIMEIRO se for o mapa 1
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 1) {
                // Camada 1 do Eixão (fundo)
                const eixao1 = MadNight.assets.get('eixaoCamada1');
                if (eixao1 && eixao1.loaded && eixao1.img) {
                    ctx.drawImage(eixao1.img, 0, 0);
                }
            } else {
                // Outros mapas: renderizar tiles normalmente
                this.renderTiles(map, visibleArea);
                this.renderBackground(map);
            }
            
            // Renderizar carros estacionados (IMPORTANTE para mapa 2)
            this.renderParkedCars(map, visibleArea);
            
            // Camada 2: Objetos estáticos
            this.renderObjects(map, visibleArea);
            this.renderBuildings(map, visibleArea, 'bottom');
            this.renderWalls(map, visibleArea);
            
            // Camada 3: Elementos especiais
            this.renderSpecialObjects(map);
            
            // Camada 4: Elementos superiores
            this.renderBuildings(map, visibleArea, 'top');
            this.renderTrees(map, visibleArea);
            this.renderStreetLights(map, visibleArea);
        },
        
        // Renderizar overlay do Eixão
        renderEixaoOverlay: function() {
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 1) {
                // Camada 2 do Eixão (sobreposição)
                const eixao2 = MadNight.assets.get('eixaoCamada2');
                if (eixao2 && eixao2.loaded && eixao2.img) {
                    ctx.drawImage(eixao2.img, 0, 0);
                }
            }
        },
        
        // Renderizar entidades
        renderEntities: function(visibleArea) {
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
        },
        
        // Renderizar efeitos e overlays
        renderEffects: function(map, visibleArea) {
            // Iluminação e sombras
            if (MadNight.lighting) {
                if (MadNight.lighting.renderTreeShadows) {
                    MadNight.lighting.renderTreeShadows(ctx, map, visibleArea);
                }
                if (MadNight.lighting.renderNightOverlay) {
                    MadNight.lighting.renderNightOverlay(ctx, MadNight.camera);
                }
                if (MadNight.lighting.renderStreetLights) {
                    MadNight.lighting.renderStreetLights(ctx, map);
                }
            }
            
            // DEBUG: Colisões
            if (MadNight.config.debug.showCollisions || 
                (MadNight.game && MadNight.game.keys && 
                 (MadNight.game.keys['c'] || MadNight.game.keys['C']))) {
                this.renderCollisionDebug();
            }
        },
        
        // Renderizar tiles
        renderTiles: function(map, visibleArea) {
            if (!map.tiles || !MadNight.assets) return;
            
            map.tiles.forEach(tile => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(tile)) {
                    
                    const tileAsset = MadNight.assets.get ? 
                        MadNight.assets.get(tile.type) : null;
                    
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
            if (!map.hasBackground || !map.backgroundAsset || !MadNight.assets) return;
            
            const bgAsset = MadNight.assets.get ? 
                MadNight.assets.get(map.backgroundAsset) : null;
            
            if (bgAsset && bgAsset.loaded && bgAsset.img) {
                ctx.drawImage(bgAsset.img, 0, 0);
            }
        },
        
        // Renderizar carros estacionados
        renderParkedCars: function(map, visibleArea) {
            // Carros especiais do mapa 2 (Fronteira com KS)
            if (MadNight.game && MadNight.game.state && 
                MadNight.game.state.currentMap === 2) {
                
                // Obter lista de carros do mapa 2
                const carros = MadNight.maps.getParkedCarsForMap2();
                
                carros.forEach(car => {
                    // Verificar se o carro está visível
                    if (!MadNight.camera || !MadNight.camera.isVisible || 
                        MadNight.camera.isVisible(car)) {
                        
                        const carAsset = MadNight.assets.get(car.type);
                        
                        if (carAsset && carAsset.loaded && carAsset.img) {
                            // Renderizar imagem do carro
                            ctx.drawImage(carAsset.img, car.x, car.y);
                        } else {
                            // Fallback: desenhar retângulo colorido
                            ctx.fillStyle = '#444';
                            ctx.fillRect(car.x, car.y, 150, 100);
                            
                            // Debug: mostrar nome do asset que faltou
                            if (MadNight.config.debug.showCollisions) {
                                ctx.fillStyle = '#f00';
                                ctx.font = '10px Arial';
                                ctx.fillText(car.type, car.x, car.y - 5);
                            }
                        }
                    }
                });
            }
            
            // Carros normais de outros mapas (se houver)
            if (map.parkedCars) {
                map.parkedCars.forEach(car => {
                    if (!MadNight.camera || !MadNight.camera.isVisible || 
                        MadNight.camera.isVisible(car)) {
                        
                        const carAsset = MadNight.assets.get(car.type);
                        
                        if (carAsset && carAsset.loaded && carAsset.img) {
                            ctx.drawImage(carAsset.img, car.x, car.y);
                        } else {
                            // Fallback
                            ctx.fillStyle = '#333';
                            ctx.fillRect(car.x, car.y, 120, 80);
                        }
                    }
                });
            }
        },
        
        // Renderizar objetos
        renderObjects: function(map, visibleArea) {
            if (!map.objects || !MadNight.assets) return;
            
            map.objects.forEach(obj => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(obj)) {
                    
                    const objAsset = MadNight.assets.get ? 
                        MadNight.assets.get(obj.type) : null;
                    
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
        
        // Renderizar prédios
        renderBuildings: function(map, visibleArea, layer) {
            if (!map.buildings || !MadNight.assets || !MadNight.player) return;
            
            const player = MadNight.player;
            
            map.buildings.forEach(building => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(building)) {
                    
                    const buildingAsset = MadNight.assets.get ? 
                        MadNight.assets.get(building.type) : null;
                    
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
        },
        
        // Renderizar árvores
        renderTrees: function(map, visibleArea) {
            if (!map.trees || !MadNight.assets) return;
            
            map.trees.forEach(tree => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(tree)) {
                    
                    const treeAsset = MadNight.assets.get ? 
                        MadNight.assets.get(tree.type) : null;
                    
                    if (treeAsset && treeAsset.loaded && treeAsset.img) {
                        ctx.drawImage(treeAsset.img, tree.x, tree.y);
                    }
                }
            });
        },
        
        // Renderizar postes de luz (COM TAMANHO CORRIGIDO)
        renderStreetLights: function(map, visibleArea) {
            if (!map.streetLights || !MadNight.assets) return;
            
            map.streetLights.forEach(light => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(light)) {
                    
                    const lightAsset = MadNight.assets.get ? 
                        MadNight.assets.get(light.type) : null;
                    
                    if (lightAsset && lightAsset.loaded && lightAsset.img) {
                        // POSTES PEQUENOS - tamanho original dividido por 2
                        const width = 20;   // Era 40, agora 20
                        const height = 60;  // Era 120, agora 60
                        
                        if (light.rotation) {
                            ctx.save();
                            const centerX = light.x + width / 2;
                            const centerY = light.y + height / 2;
                            ctx.translate(centerX, centerY);
                            ctx.rotate(light.rotation * Math.PI / 180);
                            ctx.drawImage(lightAsset.img, -width / 2, -height / 2, width, height);
                            ctx.restore();
                        } else {
                            // Renderizar com tamanho específico
                            ctx.drawImage(lightAsset.img, light.x, light.y, width, height);
                        }
                    }
                }
            });
        },
        
        // Renderizar paredes
        renderWalls: function(map, visibleArea) {
            if (!map.walls) return;
            
            ctx.fillStyle = '#666';
            
            map.walls.forEach(wall => {
                if (!MadNight.camera || !MadNight.camera.isVisible || 
                    MadNight.camera.isVisible(wall)) {
                    
                    if (!wall.invisible) {
                        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                    }
                }
            });
        },
        
        // Renderizar objetos especiais (orelhão, lixeira, saída)
        renderSpecialObjects: function(map) {
            if (!MadNight.game || !MadNight.game.state) return;
            
            const gameState = MadNight.game.state;
            
            // Orelhão
            if (map.orelhao) {
                ctx.fillStyle = '#00f';
                ctx.fillRect(map.orelhao.x, map.orelhao.y, map.orelhao.w, map.orelhao.h);
                ctx.fillStyle = '#fff';
                this.setPixelFont(8);
                ctx.fillText('TEL', map.orelhao.x + 5, map.orelhao.y + 30);
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
                ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
                ctx.fillRect(map.exit.x, map.exit.y, map.exit.w, map.exit.h);
                ctx.fillStyle = '#fff';
                this.setPixelFont(8);
                ctx.fillText(gameState.phase === 'escape' ? 'VOLTA' : 'SAÍDA', 
                            map.exit.x + 5, map.exit.y + 20);
            }
        },
        
        // Renderizar debug de colisões
        renderCollisionDebug: function() {
            if (!MadNight.collision || !MadNight.collision.getCollisionRects) return;
            
            ctx.save();
            
            const rects = MadNight.collision.getCollisionRects();
            
            const colors = {
                'building': 'rgba(255, 0, 0, 0.3)',
                'object': 'rgba(0, 255, 0, 0.3)',
                'car': 'rgba(0, 0, 255, 0.3)',
                'wall': 'rgba(255, 255, 0, 0.3)'
            };
            
            rects.forEach(rect => {
                ctx.fillStyle = colors[rect.type] || 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                
                ctx.strokeStyle = colors[rect.type] || 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
            });
            
            ctx.restore();
        }
    };
    
    // Exportar módulo
    MadNight.renderer = renderer;
    
    console.log('Módulo Renderer carregado');
    
})();
