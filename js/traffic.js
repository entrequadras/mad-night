// traffic.js - Sistema de Tráfego (Eixão)

const trafficSystem = {
    cars: [],
    lastSpawn: {
        mainNorthSouth: 0,
        mainSouthNorth: 0
    },
    
    // Configurações de spawn - madrugada, pouco movimento
    spawnConfig: {
        mainLanes: {
            minInterval: 6000,   // 6 segundos mínimo
            maxInterval: 12000,  // 12 segundos máximo
            rushChance: 0.15     // 15% chance de "rush" com mais carros
        }
    },
    
    // Tipos de carros por direção
    carTypes: {
        northSouth: [
            { sprite: 'carro001frente' },
            { sprite: 'carro002frente' },
            { sprite: 'carro004frente' }
        ],
        southNorth: [
            { sprite: 'carro001fundos' },
            { sprite: 'carro002fundos' },
            { sprite: 'carro003fundos' },
            { sprite: 'carro004fundos' }
        ]
    },
    
    // Helper para pegar dimensões do carro
    getCarDimensions: function(spriteName) {
        const asset = assets[spriteName];
        return {
            width: asset.width || 100,
            height: asset.height || 100
        };
    },
    
    // Atualizar sistema
    update: function() {
        // Só funciona no mapa do Eixão
        if (gameState.currentMap !== 1) {
            this.cars = [];
            return;
        }
        
        const now = Date.now();
        
        // Remover carros fora da tela
        this.cars = this.cars.filter(car => 
            car.y >= -200 && car.y <= 1068
        );
        
        // Limitar número de carros
        if (this.cars.length < 10) {
            // Spawn nas pistas norte-sul
            if (now - this.lastSpawn.mainNorthSouth > this.getNextSpawnTime('main')) {
                this.spawnMainLanes('northSouth');
                this.lastSpawn.mainNorthSouth = now;
            }
            
            // Spawn nas pistas sul-norte
            if (now - this.lastSpawn.mainSouthNorth > this.getNextSpawnTime('main')) {
                this.spawnMainLanes('southNorth');
                this.lastSpawn.mainSouthNorth = now;
            }
        }
        
        // Atualizar movimento dos carros
        this.cars.forEach(car => {
            car.y += car.vy;
            
            // Verificar colisão com player
            if (this.checkCarCollision(car)) {
                killPlayer();
            }
        });
    },
    
    // Verificar colisão com player
    checkCarCollision: function(car) {
        // Área de colisão reduzida (80% do tamanho)
        const carRect = {
            x: car.x + car.width * 0.1,
            y: car.y + car.height * 0.1,
            w: car.width * 0.8,
            h: car.height * 0.8
        };
        
        const playerRect = {
            x: player.x,
            y: player.y,
            w: player.width,
            h: player.height
        };
        
        return checkRectCollision(playerRect, carRect);
    },
    
    // Calcular próximo tempo de spawn
    getNextSpawnTime: function(laneType) {
        const config = this.spawnConfig.mainLanes;
        
        // Chance de "rush" - vários carros juntos
        if (Math.random() < config.rushChance) {
            return 3000; // 3 segundos durante rush
        }
        
        // Tempo aleatório normal
        return config.minInterval + Math.random() * (config.maxInterval - config.minInterval);
    },
    
    // Spawnar carros nas pistas principais
    spawnMainLanes: function(direction) {
        // Pistas do Eixão
        const lanes = direction === 'northSouth' ? 
            [1305, 1390, 1470, 1550] :  // Descendo
            [1637, 1706, 1790, 1883];    // Subindo
        
        // Escolher 1-2 pistas aleatórias
        const numCars = Math.random() < 0.25 ? 2 : 1;
        const usedLanes = [];
        
        for (let i = 0; i < numCars; i++) {
            let lane;
            do {
                lane = lanes[Math.floor(Math.random() * lanes.length)];
            } while (usedLanes.includes(lane));
            usedLanes.push(lane);
            
            // Escolher tipo de carro
            const carType = this.carTypes[direction][
                Math.floor(Math.random() * this.carTypes[direction].length)
            ];
            const dimensions = this.getCarDimensions(carType.sprite);
            
            // Velocidade variável
            const speed = 4.5 + Math.random() * 1.5;
            
            // Criar carro
            this.cars.push({
                sprite: carType.sprite,
                x: lane - dimensions.width/2,
                y: direction === 'northSouth' ? -150 : 968,
                vy: direction === 'northSouth' ? speed : -speed,
                vx: 0,
                width: dimensions.width,
                height: dimensions.height,
                headlightOffsetY: direction === 'northSouth' ? 
                    dimensions.height - 20 : 20
            });
        }
    },
    
    // Renderizar carros
    render: function(ctx, visibleArea) {
        this.cars.forEach(car => {
            // Verificar se está visível
            if (!isInView(car)) return;
            
            // Calcular dimensões reduzidas (50% do tamanho)
            const scaledWidth = car.width * 0.5;
            const scaledHeight = car.height * 0.5;
            const offsetX = (car.width - scaledWidth) / 2;
            const offsetY = (car.height - scaledHeight) / 2;

            // Renderizar carro com escurecimento
            ctx.save();
            ctx.filter = 'brightness(0.6)';
            
            const carAsset = assets[car.sprite];
            if (carAsset && carAsset.loaded) {
                ctx.drawImage(
                    carAsset.img, 
                    car.x + offsetX, 
                    car.y + offsetY, 
                    scaledWidth, 
                    scaledHeight
                );
            } else {
                // Fallback
                ctx.fillStyle = car.vy > 0 ? '#c44' : '#44c';
                ctx.fillRect(
                    car.x + offsetX, 
                    car.y + offsetY, 
                    scaledWidth, 
                    scaledHeight
                );
            }
            
            ctx.restore();
            
            // Renderizar faróis
            this.renderHeadlights(ctx, car, offsetX, offsetY, scaledWidth, scaledHeight);
        });
    },
    
    // Renderizar faróis dos carros
    renderHeadlights: function(ctx, car, offsetX, offsetY, scaledWidth, scaledHeight) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Ajuste para carros subindo
        const yAdjustment = car.vy < 0 ? -5 : 0;
        
        // Posições dos dois faróis
        const headlightY = car.y + offsetY + (car.headlightOffsetY * 0.5) + yAdjustment;
        const headlightPositions = [
            { x: car.x + offsetX + scaledWidth * 0.25, y: headlightY },
            { x: car.x + offsetX + scaledWidth * 0.75, y: headlightY }
        ];
        
        headlightPositions.forEach(pos => {
            const gradient = ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, 40
            );
            
            // Intensidade reduzida
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    },
    
    // Limpar sistema
    clear: function() {
        this.cars = [];
        this.lastSpawn.mainNorthSouth = 0;
        this.lastSpawn.mainSouthNorth = 0;
    }
};
