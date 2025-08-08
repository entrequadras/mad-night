// collision.js - Sistema de Colisão

// Verificar colisão entre dois retângulos
function checkRectCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.w &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.h &&
           obj1.y + obj1.height > obj2.y;
}

// Verificar colisão com paredes e objetos
function checkWallCollision(entity, newX, newY) {
    const map = maps[gameState.currentMap];
    if (!map) return false;
    
    const testEntity = {
        x: newX,
        y: newY,
        width: entity.width,
        height: entity.height
    };
    
    // Verificar colisão com paredes
    if (map.walls) {
        for (let wall of map.walls) {
            if (checkRectCollision(testEntity, wall)) {
                return true;
            }
        }
    }
    
    // Verificar colisão com prédios
    if (map.buildings) {
        for (let building of map.buildings) {
            if (building.collisionRects) {
                for (let rect of building.collisionRects) {
                    if (checkRectCollision(testEntity, rect)) {
                        return true;
                    }
                }
            }
        }
    }
    
    // Verificar colisão com árvores (tronco)
    if (map.trees) {
        for (let tree of map.trees) {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                const trunkCollision = {
                    x: tree.x + treeAsset.width * 0.35,
                    y: tree.y + treeAsset.height * 0.75,
                    w: treeAsset.width * 0.3,
                    h: treeAsset.height * 0.2
                };
                
                if (checkRectCollision(testEntity, trunkCollision)) {
                    return true;
                }
            }
        }
    }
    
    // Verificar colisão com postes
    if (map.streetLights) {
        for (let light of map.streetLights) {
            const lightAsset = assets[light.type];
            if (lightAsset && lightAsset.loaded) {
                const postCollision = {
                    x: light.x + lightAsset.width * 0.25,
                    y: light.y + lightAsset.height * 0.8,
                    w: lightAsset.width * 0.5,
                    h: lightAsset.height * 0.2
                };
                
                if (checkRectCollision(testEntity, postCollision)) {
                    return true;
                }
            }
        }
    }
    
    // Verificar colisão com objetos (exceto garrafas)
    if (map.objects) {
        for (let obj of map.objects) {
            // Pular garrafas quebradas - sem colisão
            if (obj.type === 'garrafaquebrada01' || obj.type === 'garrafaquebrada02') {
                continue;
            }
            
            const objAsset = assets[obj.type];
            if (objAsset && objAsset.loaded) {
                // Colisão de 50% centralizada para parquinho e banco
                const fullWidth = objAsset.width;
                const fullHeight = objAsset.height;
                const halfWidth = fullWidth * 0.5;
                const halfHeight = fullHeight * 0.5;
                
                const objCollision = {
                    x: obj.x + (fullWidth - halfWidth) / 2,
                    y: obj.y + (fullHeight - halfHeight) / 2,
                    w: halfWidth,
                    h: halfHeight
                };
                
                if (checkRectCollision(testEntity, objCollision)) {
                    return true;
                }
            }
        }
    }
    
    // Verificar colisão com carros estacionados
    if (map.parkedCars || gameState.currentMap === 2) {
        const carros = gameState.currentMap === 2 ? getMap2ParkedCars() : (map.parkedCars || []);
        
        for (let car of carros) {
            const carAsset = assets[car.type];
            if (carAsset) {
                // Colisão de 50% centralizada
                const fullWidth = carAsset.width || 150;
                const fullHeight = carAsset.height || 100;
                const halfWidth = fullWidth * 0.5;
                const halfHeight = fullHeight * 0.5;
                
                const carCollision = {
                    x: car.x + (fullWidth - halfWidth) / 2,
                    y: car.y + (fullHeight - halfHeight) / 2,
                    w: halfWidth,
                    h: halfHeight
                };
                
                if (checkRectCollision(testEntity, carCollision)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Carros estacionados hardcoded do mapa 2
function getMap2ParkedCars() {
    return [
        {type: 'carro002frente', x: 34, y: 1472},
        {type: 'carrolateral_04', x: 1770, y: 1210},
        {type: 'carrolateral_06', x: 602, y: 523},
        {type: 'carrolateral_02', x: 527, y: 474},
        {type: 'carrolateral_03', x: 299, y: 378},
        {type: 'carrolateral_07', x: 89, y: 299},
        {type: 'carrolateral_08', x: 238, y: 704}
    ];
}

// Encontrar posição válida para spawn
function findValidSpawnPosition(x, y, width, height) {
    // Se a posição inicial é válida, retornar
    if (!checkWallCollision({x, y, width, height}, x, y)) {
        return {x, y};
    }
    
    // Procurar posição válida em espiral
    const maxDistance = 200;
    const step = 20;
    
    for (let dist = step; dist <= maxDistance; dist += step) {
        const positions = [
            {x: x + dist, y: y},
            {x: x - dist, y: y},
            {x: x, y: y + dist},
            {x: x, y: y - dist},
            {x: x + dist, y: y + dist},
            {x: x - dist, y: y - dist},
            {x: x + dist, y: y - dist},
            {x: x - dist, y: y + dist}
        ];
        
        for (let pos of positions) {
            const map = maps[gameState.currentMap];
            if (pos.x >= 0 && pos.x + width <= map.width && 
                pos.y >= 0 && pos.y + height <= map.height) {
                if (!checkWallCollision({x: pos.x, y: pos.y, width, height}, pos.x, pos.y)) {
                    return pos;
                }
            }
        }
    }
    
    // Se não encontrar, retornar posição original
    console.warn('Não foi possível encontrar posição válida para spawn');
    return {x, y};
}

// Obter todas as áreas de colisão para debug
function getAllCollisionRects() {
    const map = maps[gameState.currentMap];
    if (!map) return [];
    
    const rects = [];
    
    // Paredes
    if (map.walls) {
        map.walls.forEach(wall => {
            if (!wall.invisible) {
                rects.push({
                    type: 'wall',
                    rect: wall
                });
            }
        });
    }
    
    // Prédios
    if (map.buildings) {
        map.buildings.forEach(building => {
            if (building.collisionRects) {
                building.collisionRects.forEach(rect => {
                    rects.push({
                        type: 'building',
                        rect: rect
                    });
                });
            }
        });
    }
    
    // Árvores
    if (map.trees) {
        map.trees.forEach(tree => {
            const treeAsset = assets[tree.type];
            if (treeAsset && treeAsset.loaded) {
                rects.push({
                    type: 'tree',
                    rect: {
                        x: tree.x + treeAsset.width * 0.35,
                        y: tree.y + treeAsset.height * 0.75,
                        w: treeAsset.width * 0.3,
                        h: treeAsset.height * 0.2
                    }
                });
            }
        });
    }
    
    // Postes
    if (map.streetLights) {
        map.streetLights.forEach(light => {
            const lightAsset = assets[light.type];
            if (lightAsset && lightAsset.loaded) {
                rects.push({
                    type: 'post',
                    rect: {
                        x: light.x + lightAsset.width * 0.25,
                        y: light.y + lightAsset.height * 0.8,
                        w: lightAsset.width * 0.5,
                        h: lightAsset.height * 0.2
                    }
                });
            }
        });
    }
    
    // Objetos
    if (map.objects) {
        map.objects.forEach(obj => {
            if (obj.type !== 'garrafaquebrada01' && obj.type !== 'garrafaquebrada02') {
                const objAsset = assets[obj.type];
                if (objAsset && objAsset.loaded) {
                    const fullWidth = objAsset.width;
                    const fullHeight = objAsset.height;
                    const halfWidth = fullWidth * 0.5;
                    const halfHeight = fullHeight * 0.5;
                    
                    rects.push({
                        type: 'object',
                        rect: {
                            x: obj.x + (fullWidth - halfWidth) / 2,
                            y: obj.y + (fullHeight - halfHeight) / 2,
                            w: halfWidth,
                            h: halfHeight
                        }
                    });
                }
            }
        });
    }
    
    // Carros
    const carros = gameState.currentMap === 2 ? getMap2ParkedCars() : (map.parkedCars || []);
    carros.forEach(car => {
        const carAsset = assets[car.type];
        if (carAsset) {
            const fullWidth = carAsset.width || 150;
            const fullHeight = carAsset.height || 100;
            const halfWidth = fullWidth * 0.5;
            const halfHeight = fullHeight * 0.5;
            
            rects.push({
                type: 'car',
                rect: {
                    x: car.x + (fullWidth - halfWidth) / 2,
                    y: car.y + (fullHeight - halfHeight) / 2,
                    w: halfWidth,
                    h: halfHeight
                }
            });
        }
    });
    
    return rects;
}
