// traffic.js - Sistema de tráfego

MadNight.traffic = {
    // Lista de carros ativos
    cars: [],
    
    // Último spawn
    lastSpawn: {
        mainNorthSouth: 0,
        mainSouthNorth: 0
    },
    
    // Configurações
    config: {
        mainLanes: MadNight.config.traffic.mainLanes,
        carSpeed: MadNight.config.traffic.carSpeed,
        maxCars: MadNight.config.traffic.maxCars,
        northSouthLanes: MadNight.config.traffic.northSouthLanes,
        southNorthLanes: MadNight.config.traffic.southNorthLanes
    },
    
    // Tipos de carros disponíveis
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
    
    // Inicializar sistema de tráfego
    init: function() {
        console.log('Sistema de tráfego inicializado');
        this.cars = [];
        this.lastSpawn = {
            mainNorthSouth: 0,
            mainSouthNorth: 0
        };
        return true;
    },
    
    // Obter dimensões do carro
    getCarDimensions: function(spriteName) {
        const asset = MadNight.assets.get(spriteName);
        if (asset) {
            return {
                width: asset.width || 100,
                height: asset.height || 100
            };
        }
        return { width: 100, height: 100 };
    },
    
    // Calcular próximo tempo de spawn
    getNextSpawnTime: function() {
        const config = this.config.mainLanes;
        
        // Chance de "rush" - vários carros juntos
        if (Math.random() < config.rushChance) {
            return 3000; // 3 segundos durante rush
        }
        
        // Tempo aleatório normal
        return config.minInterval + Math.random() * (config.maxInterval - config.minInterval);
    },
    
    // Spawnar carros nas pistas principais
    spawnMainLanes: function(direction) {
        const lanes = direction === 'northSouth' ? 
            this.config.northSouthLanes : 
            this.config.southNorthLanes;
        
        // Escolher 1-2 pistas aleatórias para spawn
        const numCars = Math.random() < 0.25 ? 2 : 1; // 25% de chance de 2 carros
        const usedLanes = [];
        
        for (let i = 0; i < numCars; i++) {
            let lane;
            do {
                lane = lanes[Math.floor(Math.random() * lanes.length)];
            } while (usedLanes.includes(lane));
            usedLanes.push(lane);
            
            const carType = this.carTypes[direction][
                Math.floor(Math.random() * this.carTypes[direction].length)
            ];
            const dimensions = this.getCarDimensions(carType.sprite);
            const speed = this.config.carSpeed.min + 
                         Math.random() * (this.config.carSpeed.max - this.config.carSpeed.min);
            
            this.cars.push({
                sprite: carType.sprite,
                x: lane - dimensions.width / 2, // Centralizar na pista
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
    
    // Atualizar sistema de tráfego
    update: function() {
        // Só funciona no mapa do Eixão (mapa 1)
        if (MadNight.game.state.currentMap !== 1) {
            this.cars = [];
            return;
        }
        
        const now = Date.now();
        
        // Remover carros fora da tela
        this.cars = this.cars.filter(car => 
            car.y >= -200 && car.y <= 1068
        );
        
        // Só spawnar se tiver menos carros que o máximo
        if (this.cars.length < this.config.maxCars) {
            // Spawn nas pistas norte-sul
            if (now - this.lastSpawn.mainNorthSouth > this.getNextSpawnTime()) {
                this.spawnMainLanes('northSouth');
                this.lastSpawn.mainNorthSouth = now;
            }
            
            // Spawn nas pistas sul-norte
            if (now - this.lastSpawn.mainSouthNorth > this.getNextSpawnTime()) {
                this.spawnMainLanes('southNorth');
                this.lastSpawn.mainSouthNorth = now;
            }
        }
        
        // Atualizar movimento dos carros
        this.cars.forEach(car => {
            car.y += car.vy;
            car.x += car.vx;
        });
    },
    
    // Renderizar carros e faróis
    render: function(ctx, visibleArea) {
        this.cars.forEach(car => {
            // Verificar se o carro está visível
            if (!MadNight.camera.isVisible(car)) return;
            
            // Calcular dimensões reduzidas (50% do tamanho)
            const scaledWidth = car.width * 0.5;
            const scaledHeight = car.height * 0.5;
            
            // Centralizar o carro reduzido na posição original
            const offsetX = (car.width - scaledWidth) / 2;
            const offsetY = (car.height - scaledHeight) / 2;
            
            // Aplicar escurecimento para o Eixão
            ctx.save();
            ctx.filter = 'brightness(0.6)'; // 60% do brilho original
            
            // Renderizar sprite do carro se carregado
            const carAsset = MadNight.assets.get(car.sprite);
            if (carAsset && carAsset.loaded) {
                ctx.drawImage(
                    carAsset.img,
                    car.x + offsetX,
                    car.y + offsetY,
                    scaledWidth,
                    scaledHeight
                );
            } else {
                // Fallback: retângulo colorido
                ctx.fillStyle = car.vy > 0 ? '#c44' : '#44c';
                ctx.fillRect(
                    car.x + offsetX,
                    car.y + offsetY,
                    scaledWidth,
                    scaledHeight
                );
            }
            
            ctx.restore();
            
            // Renderizar faróis usando o sistema de iluminação
            MadNight.lighting.renderCarHeadlights(ctx, car);
        });
    },
    
    // Verificar colisão com carros
    checkCollision: function(entity) {
        for (let car of this.cars) {
            if (entity.x < car.x + car.width &&
                entity.x + entity.width > car.x &&
                entity.y < car.y + car.height &&
                entity.y + entity.height > car.y) {
                return true;
            }
        }
        return false;
    },
    
    // Limpar todos os carros
    clear: function() {
        this.cars = [];
        this.lastSpawn.mainNorthSouth = 0;
        this.lastSpawn.mainSouthNorth = 0;
    },
    
    // Obter número de carros ativos
    getCarCount: function() {
        return this.cars.length;
    },
    
    // Criar engarrafamento (para eventos especiais)
    createTrafficJam: function(laneIndex, carCount = 5) {
        const lanes = [...this.config.northSouthLanes, ...this.config.southNorthLanes];
        if (laneIndex >= lanes.length) return;
        
        const lane = lanes[laneIndex];
        const isNorthSouth = laneIndex < this.config.northSouthLanes.length;
        
        for (let i = 0; i < carCount; i++) {
            const carType = isNorthSouth ? 
                this.carTypes.northSouth[0] : 
                this.carTypes.southNorth[0];
            
            const dimensions = this.getCarDimensions(carType.sprite);
            
            this.cars.push({
                sprite: carType.sprite,
                x: lane - dimensions.width / 2,
                y: 300 + i * (dimensions.height + 20),
                vy: 0, // Parado
                vx: 0,
                width: dimensions.width,
                height: dimensions.height,
                headlightOffsetY: isNorthSouth ? 
                    dimensions.height - 20 : 20
            });
        }
    }
};
