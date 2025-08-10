// collision.js - Sistema de colisão

MadNight.collision = {
    // Verificar colisão entre dois retângulos
    checkRectCollision: function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.w &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.h &&
               obj1.y + obj1.height > obj2.y;
    },
    
    // Verificar colisão com paredes
    checkWallCollision: function(entity, newX, newY) {
        const map = MadNight.maps.getCurrentMap();
        if (!map) return false;
        
        const testEntity = {
            x: newX,
            y: newY,
            width: entity.width,
            height: entity.height
        };
        
        // Verificar colisão com paredes normais
        if (map.walls) {
            for (let wall of map.walls) {
                if (this.checkRectCollision(testEntity, wall)) {
                    return true;
                }
            }
        }
        
        // Verificar colisão com prédios
        if (map.buildings) {
            for (let building of map.buildings) {
                if (building.collisionRects) {
                    for (let rect of building.collisionRects) {
                        if (this.checkRectCollision(testEntity, rect)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        // Verificar colisão com árvores
        if (map.trees) {
            for (let tree of map.trees) {
                const treeAsset = MadNight.assets.get(tree.type);
                if (treeAsset && treeAsset.loaded) {
                    const trunkCollision = {
                        x: tree.x + treeAsset.width * 0.35,
                        y: tree.y + treeAsset.height * 0.75,
                        w: treeAsset.width * 0.3,
                        h: treeAsset.height * 0.2
                    };
                    
                    if (this.checkRectCollision(testEntity, trunkCollision)) {
                        return true;
                    }
                }
            }
        }
        
        // Verificar colisão com postes
        if (map.streetLights) {
            for (let light of map.streetLights) {
                const lightAsset = MadNight.assets.get(light.type);
                if (lightAsset && lightAsset.loaded) {
                    const postCollision = {
                        x: light.x + lightAsset.width * 0.25,
                        y: light.y + lightAsset.height * 0.8,
                        w: lightAsset.width * 0.5,
                        h: lightAsset.height * 0.2
                    };
                    
                    if (this.checkRectCollision(testEntity, postCollision)) {
                        return true;
                    }
                }
            }
        }
        
        // Verificar colisão com objetos (50% para parquinho e banco)
        if (map.objects) {
            for (let obj of map.objects) {
                // Pular garrafas quebradas - sem colisão
                if (obj.type === 'garrafaquebrada01' || obj.type === 'garrafaquebrada02') {
                    continue;
                }
                
                const objAsset = MadNight.assets.get(obj.type);
                if (objAsset && objAsset.loaded) {
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
                    
                    if (this.checkRectCollision(testEntity, objCollision)) {
                        return true;
                    }
                }
            }
        }
        
        // Verificar colisão com carros estacionados
        if (this.checkParkedCarsCollision(testEntity)) {
            return true;
        }
        
        return false;
    },
    
    // Verificar colisão com carros estacionados
    checkParkedCarsCollision: function(testEntity) {
        // Verificar se o game está inicializado
        if (!MadNight.game || !MadNight.game.state) return false;
        
        const gameState = MadNight.game.state;
        const map = MadNight.maps.getCurrentMap();
        
        if (!map) return false;
        
        if (map.parkedCars || gameState.currentMap === 2) {
            const carros = gameState.currentMap === 2 ? [
                {type: 'carro002frente', x: 34, y: 1472},
                {type: 'carrolateral_04', x: 1770, y: 1210},
                {type: 'carrolateral_06', x: 602, y: 523},
                {type: 'carrolateral_02', x: 527, y: 474},
                {type: 'carrolateral_03', x: 299, y: 378},
                {type: 'carrolateral_07', x: 89, y: 299},
                {type: 'carrolateral_08', x: 238, y: 704}
            ] : (map.parkedCars || []);
            
            for (let car of carros) {
                const carAsset = MadNight.assets.get(car.type);
                if (carAsset) {
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
                    
                    if (this.checkRectCollision(testEntity, carCollision)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    },
    
    // Encontrar posição válida para spawn
    findValidSpawnPosition: function(x, y, width, height) {
        const map = MadNight.maps.getCurrentMap();
        if (!map) return {x, y};
        
        if (!this.checkWallCollision({x, y, width, height}, x, y)) {
            return {x, y};
        }
        
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
                if (pos.x >= 0 && pos.x + width <= map.width && 
                    pos.y >= 0 && pos.y + height <= map.height) {
                    if (!this.checkWallCollision({x: pos.x, y: pos.y, width, height}, pos.x, pos.y)) {
                        return pos;
                    }
                }
            }
        }
        
        return {x, y};
    },
    
    // Verificar colisão entre entidade e projétil
    checkProjectileCollision: function(projectile, entity) {
        return projectile.x < entity.x + entity.width &&
               projectile.x + projectile.width > entity.x &&
               projectile.y < entity.y + entity.height &&
               projectile.y + projectile.height > entity.y;
    },
    
    // Verificar se entidade está dentro dos limites do mapa
    checkMapBounds: function(entity, x, y) {
        const map = MadNight.maps.getCurrentMap();
        if (!map) return false;
        
        return x >= 0 && 
               x + entity.width <= map.width && 
               y >= 0 && 
               y + entity.height <= map.height;
    },
    
    // Obter áreas de colisão para debug
    getCollisionRects: function() {
        const map = MadNight.maps.getCurrentMap();
        const rects = [];
        
        if (!map) return rects;
        
        // Colisões dos prédios
        if (map.buildings) {
            map.buildings.forEach(building => {
                if (building.collisionRects) {
                    building.collisionRects.forEach(rect => {
                        rects.push({...rect, type: 'building'});
                    });
                }
            });
        }
        
        // Colisões de objetos
        if (map.objects) {
            map.objects.forEach(obj => {
                if (obj.type !== 'garrafaquebrada01' && obj.type !== 'garrafaquebrada02') {
                    const objAsset = MadNight.assets.get(obj.type);
                    if (objAsset) {
                        const fullWidth = objAsset.width || 100;
                        const fullHeight = objAsset.height || 100;
                        const halfWidth = fullWidth * 0.5;
                        const halfHeight = fullHeight * 0.5;
                        
                        rects.push({
                            x: obj.x + (fullWidth - halfWidth) / 2,
                            y: obj.y + (fullHeight - halfHeight) / 2,
                            w: halfWidth,
                            h: halfHeight,
                            type: 'object'
                        });
                    }
                }
            });
        }
        
        // Colisões de carros
        if (MadNight.game && MadNight.game.state) {
            const gameState = MadNight.game.state;
            if (map.parkedCars || gameState.currentMap === 2) {
            const carros = gameState.currentMap === 2 ? [
                {type: 'carro002frente', x: 34, y: 1472},
                {type: 'carrolateral_04', x: 1770, y: 1210},
                {type: 'carrolateral_06', x: 602, y: 523},
                {type: 'carrolateral_02', x: 527, y: 474},
                {type: 'carrolateral_03', x: 299, y: 378},
                {type: 'carrolateral_07', x: 89, y: 299},
                {type: 'carrolateral_08', x: 238, y: 704}
            ] : (map.parkedCars || []);
            
            carros.forEach(car => {
                const carAsset = MadNight.assets.get(car.type);
                if (carAsset) {
                    const fullWidth = carAsset.width || 150;
                    const fullHeight = carAsset.height || 100;
                    const halfWidth = fullWidth * 0.5;
                    const halfHeight = fullHeight * 0.5;
                    
                    rects.push({
                        x: car.x + (fullWidth - halfWidth) / 2,
                        y: car.y + (fullHeight - halfHeight) / 2,
                        w: halfWidth,
                        h: halfHeight,
                        type: 'car'
                    });
                }
            });
        }
        
        return rects;
    },
    
    // Verificar colisão genérica (alias para checkRectCollision)
    checkCollision: function(obj1, obj2) {
        // Adaptar para diferentes formatos de objetos
        const rect1 = {
            x: obj1.x,
            y: obj1.y,
            width: obj1.width || obj1.w,
            height: obj1.height || obj1.h
        };
        
        const rect2 = {
            x: obj2.x,
            y: obj2.y,
            w: obj2.w || obj2.width,
            h: obj2.h || obj2.height
        };
        
        return this.checkRectCollision(rect1, rect2);
    },

    // Inicializar sistema de colisão
    init: function() {
        console.log('Sistema de colisão inicializado');
        return true;
    }
};
