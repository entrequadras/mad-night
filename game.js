console.log('Mad Night v2.0.0 - Postes Corrigidos com Flicker');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Configurações de câmera
const camera = {
    x: 0,
    y: 0,
    width: 960,
    height: 540,
    zoom: 2
};

// Configurar canvas
canvas.width = camera.width * camera.zoom;
canvas.height = camera.height * camera.zoom;

// Estado do jogo
const gameState = {
    deaths: 0,
    pedalPower: 4,
    maxPedalPower: 4,
    lastRecharge: Date.now(),
    musicPhase: 'inicio',
    currentMusic: null,
    currentMap: 0,
    phase: 'infiltration',
    dashUnlocked: false,
    bombPlaced: false,
    lastEnemySpawn: 0,
    enemySpawnDelay: 1000,
    spawnCorner: 0,
    version: 'v2.0.0 - Postes com Flicker'
};

// Sistema de Mapas - AJUSTANDO POSTES DO CAMPO
const maps = [
    {
        name: "Maconhão",
        subtitle: "Tutorial de movimento",
        width: 1920,
        height: 1080,
        enemies: [],
        tiles: generateGrassTiles(1920, 1080, 120),
        trees: [
            {type: 'arvore001', x: 300, y: 150},
            {type: 'arvore002', x: 1400, y: 120},
            {type: 'arvore003', x: 150, y: 700},
            {type: 'arvore004', x: 1600, y: 750},
            {type: 'arvorebloco001', x: 700, y: 50},
            {type: 'arvore002', x: 450, y: 850},
            {type: 'arvore001', x: 1200, y: 880},
            {type: 'arvore003', x: 950, y: 100},
            {type: 'arvore004', x: 100, y: 400},
            {type: 'arvore001', x: 200, y: 180},
            {type: 'arvore002', x: 1580, y: 130},
            {type: 'arvore003', x: 280, y: 780},
            {type: 'arvore004', x: 1480, y: 830},
            {type: 'arvore001', x: 1550, y: 850}
        ],
        streetLights: [
            // 4 POSTES NOS CANTOS DO CAMPO DE FUTEBOL (centralizado em 960x540)
            {type: 'poste001', x: 560, y: 240, rotation: 0, lightRadius: 40, flickerOffset: 0},     // Superior esquerdo
            {type: 'poste000', x: 1200, y: 240, rotation: 0, lightRadius: 40, flickerOffset: 500},  // Superior direito
            {type: 'poste001', x: 560, y: 640, rotation: 0, lightRadius: 40, flickerOffset: 1000},  // Inferior esquerdo
            {type: 'poste000', x: 1200, y: 640, rotation: 0, lightRadius: 40, flickerOffset: 1500}, // Inferior direito
            
            // Postes nas entradas/cantos do mapa
            {type: 'poste000', x: 80, y: 80, rotation: 0, lightRadius: 40, flickerOffset: 2000},    // Canto superior esquerdo
            {type: 'poste001', x: 1800, y: 80, rotation: 0, lightRadius: 40, flickerOffset: 2500},  // Canto superior direito
            {type: 'poste000', x: 80, y: 900, rotation: 0, lightRadius: 40, flickerOffset: 3000},   // Canto inferior esquerdo
            {type: 'poste001', x: 1800, y: 900, rotation: 0, lightRadius: 40, flickerOffset: 3500}, // Canto inferior direito
            
            // Poste na saída
            {type: 'poste001', x: 1700, y: 450, rotation: 0, lightRadius: 40, flickerOffset: 4000}  // Próximo à saída
        ],
        // ... resto do mapa
    },
    // ... outros mapas
];

// Função para calcular intensidade do flicker
function getFlickerIntensity(offset) {
    const time = Date.now() + offset;
    const flicker1 = Math.sin(time * 0.007) * 0.1;
    const flicker2 = Math.sin(time * 0.013) * 0.05;
    const flicker3 = Math.random() < 0.02 ? -0.1 : 0; // Piscada ocasional
    return Math.max(0.7, Math.min(1, 1 + flicker1 + flicker2 + flicker3));
}

// Modificar renderNightFilter para incluir flicker
function renderNightFilter(map, visibleArea) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = camera.width;
    tempCanvas.height = camera.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 1. Preencher todo o canvas temporário com filtro azul
    tempCtx.fillStyle = 'rgba(0, 0, 40, 0.4)';
    tempCtx.fillRect(0, 0, camera.width, camera.height);
    
    // 2. Criar "buracos" no filtro onde tem luz de poste
    if (map.streetLights) {
        map.streetLights.forEach(light => {
            const lightX = light.x + 20 - camera.x;
            const lightY = light.y + 45 - camera.y;
            
            // Calcular intensidade do flicker para este poste
            const intensity = getFlickerIntensity(light.flickerOffset || 0);
            const radius = 70 * intensity;
            
            // Só processar se estiver visível
            if (lightX + radius > 0 && lightX - radius < camera.width &&
                lightY + radius > 0 && lightY - radius < camera.height) {
                
                tempCtx.save();
                tempCtx.globalCompositeOperation = 'destination-out';
                
                const gradient = tempCtx.createRadialGradient(
                    lightX, lightY, 0,
                    lightX, lightY, radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 * intensity})`);
                gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.15 * intensity})`);
                gradient.addColorStop(0.8, `rgba(255, 255, 255, ${0.05 * intensity})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                tempCtx.fillStyle = gradient;
                tempCtx.beginPath();
                tempCtx.arc(lightX, lightY, radius, 0, Math.PI * 2);
                tempCtx.fill();
                
                tempCtx.restore();
            }
        });
    }
    
    // 3. Aplicar o filtro com máscara no canvas principal
    ctx.drawImage(tempCanvas, camera.x, camera.y);
    
    // 4. Adicionar luz âmbar decorativa dos postes com flicker
    if (map.streetLights) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        map.streetLights.forEach(light => {
            if (light.x + 120 > visibleArea.left && 
                light.x - 120 < visibleArea.right &&
                light.y + 120 > visibleArea.top && 
                light.y - 120 < visibleArea.bottom) {
                
                const intensity = getFlickerIntensity(light.flickerOffset || 0);
                const radius = 100 * intensity;
                
                const gradient = ctx.createRadialGradient(
                    light.x + 20, light.y + 45, 0,
                    light.x + 20, light.y + 45, radius
                );
                gradient.addColorStop(0, `rgba(255, 160, 0, ${0.3 * intensity})`);
                gradient.addColorStop(0.3, `rgba(255, 160, 0, ${0.2 * intensity})`);
                gradient.addColorStop(0.6, `rgba(255, 160, 0, ${0.1 * intensity})`);
                gradient.addColorStop(0.85, `rgba(255, 160, 0, ${0.04 * intensity})`);
                gradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(light.x + 20, light.y + 45, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
}

// Ajustar ordem de renderização para árvores ficarem sob filtro azul
function draw() {
    const map = maps[gameState.currentMap];
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    
    const visibleArea = {
        left: camera.x - 100,
        right: camera.x + camera.width + 100,
        top: camera.y - 100,
        bottom: camera.y + camera.height + 100
    };
    
    // Renderizar elementos do mapa
    renderTiles(map, visibleArea);
    renderCampo(map);
    renderShadows(map, visibleArea);
    renderTrees(map, visibleArea, 'bottom');
    renderWalls(map, visibleArea);
    renderSpecialObjects(map);
    renderProjectiles(visibleArea);
    renderEnemies(visibleArea);
    renderPlayer();
    renderStreetLights(map, visibleArea);
    renderTrees(map, visibleArea, 'top');
    renderNightFilter(map, visibleArea); // FILTRO AZUL POR ÚLTIMO (cobre tudo incluindo árvores)
    
    ctx.restore();
    
    renderUI(map);
}

console.log('🎮 Mad Night v2.0.0 - Postes Corrigidos com Flicker 🎮');
console.log('⚽ 4 postes nos cantos do campo de futebol');
console.log('💡 Efeito flicker realista com 3 componentes:');
console.log('   - Oscilação suave principal');
console.log('   - Oscilação secundária');
console.log('   - Piscadas aleatórias ocasionais');
console.log('🌳 Árvores agora ficam sob o filtro azul noturno');
console.log('✨ Cada poste tem offset único para flicker dessincronizado');
