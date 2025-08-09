// renderer.js - Sistema de Renderização

// Função principal de desenho
function draw() {
    // Limpar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
        const map = maps[gameState.currentMap];
        if (!map) return;
        
        // Aplicar transformação da câmera
        applyCameraTransform(ctx);
        
        // Background base
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
        
        const visibleArea = getVisibleArea();
        
        // Camada 1: Base
        if (map.hasLayers && gameState.currentMap === 1) {
            renderEixaoLayer1(map);
        } else {
            renderTiles(map, visibleArea);
            
            if (map.hasBackground && map.backgroundAsset) {
                renderBackground(map);
            }
        }
        
        renderCampo(map);
        renderParkedCars(map, visibleArea);
        renderShadows(ctx, map, visibleArea);
        renderTrees(map, visibleArea, 'bottom');
        renderObjects(map, visibleArea);
        renderBuildingsLayer(map, visibleArea, 'bottom');
        renderWalls(map, visibleArea);
        renderSpecialObjects(map);
        
        // Camada 2: Entidades
        renderProjectiles(ctx, visibleArea);
        renderEnemies(visibleArea);
        renderPlayer();
        
        // Camada 3: Sobreposições
        if (map.hasLayers && gameState.currentMap === 1) {
            renderEixaoLayer2(map);
        }
        
        // Tráfego (Eixão)
        if (gameState.currentMap === 1) {
            trafficSystem.render(ctx, visibleArea);
        }
        
        renderBuildingsLayer(map, visibleArea, 'top');
        renderCampoTraves();
        renderFieldShadow(ctx, map);
        renderStreetLights(ctx, map, visibleArea);
        renderTrees(map, visibleArea, 'top');
        
        // Debug de colisões
        if (keys['c'] || keys['C']) {
            renderCollisionDebug(map);
        }
        
        // Efeito de noite
        renderNightOverlay(ctx);
        
        // Iluminação
        renderStreetLights(ctx, map, visibleArea);
        renderPointLights(ctx, map, visibleArea);
        
        // Resetar transformação
        resetCameraTransform(ctx);
        
        // UI (sem transformação)
        renderUI(map);
        
    } catch (error) {
        ctx.fillStyle = '#f00';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ERRO NO RENDER', canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText(error.message, canvas.width/2, canvas.height/2 + 40);
        console.error('Erro no draw:', error);
    }
}

// Renderizar tiles
function renderTiles(map, visibleArea) {
    if (!map.tiles) return;
    
    map.tiles.forEach(tile => {
        const tileAsset = assets[tile.type];
        if (tileAsset && tileAsset.loaded && isInView(tile)) {
            ctx.drawImage(
                tileAsset.img, 
                0, 0, 120, 120,
                Math.floor(tile.x), 
                Math.floor(tile.y), 
                121, 121  // +1 para evitar gaps
            );
        }
    });
}

// Renderizar background
function renderBackground(map) {
    if (map.hasBackground && map.backgroundAsset) {
        const bgAsset = assets[map.backgroundAsset];
        if (bgAsset && bgAsset.loaded) {
            ctx.drawImage(bgAsset.img, 0, 0);
        }
    }
}

// Renderizar camadas do Eixão
function renderEixaoLayer1(map) {
    if (gameState.currentMap === 1 && assets.eixaoCamada1.loaded) {
        ctx.drawImage(assets.eixaoCamada1.img, 0, 0);
    }
}

function renderEixaoLayer2(map) {
    if (gameState.currentMap === 1 && assets.eixaoCamada2.loaded) {
        ctx.drawImage(assets.eixaoCamada2.img, 0, 0);
    }
}

// Renderizar campo de futebol
function renderCampo(map) {
    if (gameState.currentMap === 0 && assets.campo.loaded) {
        const campoX = (map.width - 800) / 2;
        const campoY = (map.height - 462) / 2;
        ctx.drawImage(assets.campo.img, campoX, campoY);
    }
}

function renderCampoTraves() {
    if (gameState.currentMap === 0 && assets.campoTraves.loaded) {
        const campoX = (maps[0].width - 800) / 2;
        const campoY = (maps[0].height - 462) / 2;
        ctx.drawImage(assets.campoTraves.img, campoX, campoY);
    }
}

// Renderizar árvores (duas camadas)
function renderTrees(map, visibleArea, layer = 'bottom') {
    if (!map.trees) return;
    
    map.trees.forEach(tree => {
        const treeAsset = assets[tree.type];
        if (treeAsset && treeAsset.loaded && isInView(tree)) {
            if (layer === 'bottom') {
                // Parte inferior da árvore
                ctx.save();
                ctx.beginPath();
                ctx.rect(tree.x, tree.y + treeAsset.height * 0.7, treeAsset.width, treeAsset.height * 0.3);
                ctx.clip();
                ctx.drawImage(treeAsset.img, tree.x, tree.y);
                ctx.restore();
            } else if (layer === 'top') {
                // Parte superior da árvore
                ctx.save();
                ctx.beginPath();
                ctx.rect(tree.x, tree.y, treeAsset.width, treeAsset.height * 0.75);
                ctx.clip();
                
                // Transparência se player estiver embaixo
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
}

// Renderizar prédios em camadas
function renderBuildingsLayer(map, visibleArea, layer) {
    if (!map.buildings) return;
    
    map.buildings.forEach(building => {
        const buildingAsset = assets[building.type];
        if (buildingAsset && buildingAsset.loaded && isInView(building)) {
            const cutLine = building.y + buildingAsset.height * 0.75;
            const playerBottom = player.y + player.height;
            
            if (layer === 'bottom') {
                // Renderizar se player está na frente
                if (playerBottom > cutLine) {
                    ctx.drawImage(buildingAsset.img, building.x, building.y);
                }
            } else if (layer === 'top') {
                // Renderizar se player está atrás
                if (playerBottom <= cutLine) {
                    ctx.drawImage(buildingAsset.img, building.x, building.y);
                }
            }
        }
    });
}

// Renderizar objetos
function renderObjects(map, visibleArea) {
    if (!map.objects) return;
    
    map.objects.forEach(obj => {
        const objAsset = assets[obj.type];
        if (objAsset && objAsset.loaded && isInView(obj)) {
            ctx.drawImage(objAsset.img, obj.x, obj.y);
        }
    });
}

// Renderizar carros estacionados
function renderParkedCars(map, visibleArea) {
    // Carros especiais do mapa 2
    if (gameState.currentMap === 2) {
        const carros = getMap2ParkedCars();
        carros.forEach(car => {
            const carAsset = assets[car.type];
            if (carAsset && carAsset.loaded && isInView(car)) {
                ctx.drawImage(carAsset.img, car.x, car.y);
            }
        });
        return;
    }
    
    // Carros normais
    if (map.parkedCars) {
        map.parkedCars.forEach(car => {
            const carAsset = assets[car.type];
            if (carAsset && carAsset.loaded && isInView(car)) {
                ctx.drawImage(carAsset.img, car.x, car.y);
            }
        });
    }
}

// Renderizar paredes
function renderWalls(map, visibleArea) {
    ctx.fillStyle = '#666';
    if (map.walls) {
        map.walls.forEach(wall => {
            if (!wall.invisible && isInView(wall)) {
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            }
        });
    }
}

// Renderizar objetos especiais
function renderSpecialObjects(map) {
    // Orelhão
    if (map.orelhao) {
        if (assets.orelhao001 && assets.orelhao001.loaded) {
            ctx.drawImage(assets.orelhao001.img, map.orelhao.x, map.orelhao.y);
        } else {
            ctx.fillStyle = '#00f';
            ctx.fillRect(map.orelhao.x, map.orelhao.y, map.orelhao.w, map.orelhao.h);
            ctx.fillStyle = '#fff';
            ctx.font = '8px Arial';
            ctx.fillText('TEL', map.orelhao.x + 5, map.orelhao.y + 30);
        }
    }
    
    // Lixeira
    if (map.lixeira) {
        ctx.fillStyle = gameState.bombPlaced ? '#f00' : '#080';
        ctx.fillRect(map.lixeira.x, map.lixeira.y, map.lixeira.w, map.lixeira.h);
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.fillText(gameState.bombPlaced ? 'BOOM!' : 'LIXO', map.lixeira.x + 2, map.lixeira.y + 25);
    }
    
    // Saída
    if (map.exit) {
        renderExit(map);
    }
}

// Renderizar saída com setas
function renderExit(map) {
    let arrowAssetName = '';
    switch(map.direction) {
        case 'right': arrowAssetName = 'setadireita'; break;
        case 'left': arrowAssetName = 'setaesquerda'; break;
        case 'up': arrowAssetName = 'setanorte'; break;
        case 'down': arrowAssetName = 'setasul'; break;
        default: arrowAssetName = 'setadireita'; break;
    }
    
    const arrowAsset = assets[arrowAssetName];
    if (arrowAsset && arrowAsset.loaded) {
        ctx.save();
        
        // Filtro vermelho durante fuga
        if (gameState.phase === 'escape') {
            ctx.filter = 'hue-rotate(0deg) saturate(2) brightness(0.8) sepia(1) saturate(3) hue-rotate(0deg)';
        }
        
        // Centralizar seta
        const centerX = map.exit.x + (map.exit.w - arrowAsset.width) / 2;
        const centerY = map.exit.y + (map.exit.h - arrowAsset.height) / 2;
        
        ctx.drawImage(arrowAsset.img, centerX, centerY);
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
        ctx.fillRect(map.exit.x, map.exit.y, map.exit.w, map.exit.h);
    }
}

// Renderizar inimigos
function renderEnemies(visibleArea) {
    enemies.forEach(enemy => {
        if (!isInView(enemy)) return;
        
        const sprite = enemy.getSprite();
        if (sprite) {
            ctx.save();
            
            // Aplicar transparência se na sombra
            if (isInShadow(enemy.x + enemy.width/2, enemy.y + enemy.height/2)) {
                ctx.globalAlpha = 0.5;
            }
            
            // Barra de vida do Chacal
            if (enemy.type === 'chacal' && !enemy.isDead && enemy.health < enemy.maxHealth) {
                ctx.fillStyle = '#800';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
                ctx.fillStyle = '#f00';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
            }
            
            // Invulnerabilidade
            if (enemy.isInvulnerable) {
                ctx.globalAlpha = 0.5;
            }
            
            ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Indicador de alerta durante fuga
            if (!enemy.isDead && gameState.phase === 'escape') {
                ctx.fillStyle = '#f00';
                ctx.font = '8px Arial';
                ctx.fillText('!', enemy.x + 23, enemy.y - 5);
            }
            
            ctx.restore();
        } else {
            // Fallback se sprite não carregou
            if (!enemy.isDead) {
                const colors = {
                    'faquinha': '#808',
                    'morcego': '#408',
                    'caveirinha': '#c0c',
                    'janis': '#0cc',
                    'chacal': '#f80'
                };
                ctx.fillStyle = enemy.state === 'chase' ? '#f0f' : colors[enemy.type];
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
    });
}

// Renderizar player
function renderPlayer() {
    const sprite = getPlayerSprite();
    if (sprite) {
        ctx.save();
        if (player.inShadow) ctx.globalAlpha = 0.5;
        ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = player.isDashing ? '#ff0' : (player.isDead ? '#800' : '#f00');
        ctx.save();
        if (player.inShadow) ctx.globalAlpha = 0.5;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.restore();
    }
}

// Debug de colisões
function renderCollisionDebug(map) {
    ctx.save();
    
    const collisionRects = getAllCollisionRects();
    
    const colors = {
        'wall': 'rgba(255, 255, 0, 0.3)',
        'building': 'rgba(255, 0, 0, 0.3)',
        'tree': 'rgba(0, 255, 0, 0.3)',
        'post': 'rgba(0, 255, 255, 0.3)',
        'object': 'rgba(255, 0, 255, 0.3)',
        'car': 'rgba(0, 0, 255, 0.3)'
    };
    
    collisionRects.forEach(item => {
        ctx.fillStyle = colors[item.type] || 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(item.rect.x, item.rect.y, item.rect.w, item.rect.h);
        
        ctx.strokeStyle = colors[item.type] ? colors[item.type].replace('0.3', '0.8') : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.rect.x, item.rect.y, item.rect.w, item.rect.h);
    });
    
    ctx.restore();
}
