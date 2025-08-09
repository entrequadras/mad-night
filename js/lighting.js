// lighting.js - Sistema de Iluminação e Sombras

// Sistema de flicker para luzes
const flickerSystem = {
    lights: {},
    
    update: function(lightId) {
        if (!this.lights[lightId]) {
            this.lights[lightId] = {
                intensity: 1.0,
                targetIntensity: 1.0,
                flickering: false,
                flickerTime: 0,
                nextFlicker: Date.now() + Math.random() * 5000 + 3000
            };
        }
        
        const light = this.lights[lightId];
        const now = Date.now();
        
        // Iniciar flicker aleatório
        if (!light.flickering && now > light.nextFlicker) {
            light.flickering = true;
            light.flickerTime = now + Math.random() * 500 + 200;
            light.targetIntensity = 0.3 + Math.random() * 0.5;
        }
        
        // Processar flicker
        if (light.flickering) {
            if (now < light.flickerTime) {
                // Oscilação durante flicker
                light.intensity = light.targetIntensity + Math.sin(now * 0.05) * 0.2;
            } else {
                // Fim do flicker
                light.flickering = false;
                light.intensity = 1.0;
                light.nextFlicker = now + Math.random() * 8000 + 4000;
            }
        }
        
        return light.intensity;
    }
};

// Verificar se posição está na sombra
function isInShadow(x, y) {
    const map = maps[gameState.currentMap];
    if (!map || !map.trees) return false;
    
    for (let tree of map.trees) {
        const treeAsset = assets[tree.type];
        if (treeAsset && treeAsset.loaded) {
            // Raio da sombra baseado no tipo de árvore
            let shadowRadius = tree.type === 'arvorebloco001' ? 
                treeAsset.width * 0.35 : treeAsset.width * 0.5;
            
            // Centro da sombra (deslocado para baixo da árvore)
            const shadowX = tree.x + treeAsset.width * 0.5;
            const shadowY = tree.y + treeAsset.height * 0.85;
            
            // Verificar distância
            const dist = Math.sqrt(
                Math.pow(x - shadowX, 2) + 
                Math.pow(y - shadowY, 2)
            );
            
            if (dist < shadowRadius) {
                return true;
            }
        }
    }
    
    return false;
}

// Renderizar sombras das árvores
function renderShadows(ctx, map, visibleArea) {
    if (!map.trees) return;
    
    ctx.save();
    
    map.trees.forEach(tree => {
        const treeAsset = assets[tree.type];
        if (treeAsset && treeAsset.loaded) {
            let shadowRadius = tree.type === 'arvorebloco001' ? 
                treeAsset.width * 0.35 : treeAsset.width * 0.5;
            
            const shadowX = tree.x + treeAsset.width * 0.5;
            const shadowY = tree.y + treeAsset.height * 0.85;
            
            // Verificar se está visível
            if (shadowX + shadowRadius > visibleArea.left && 
                shadowX - shadowRadius < visibleArea.right &&
                shadowY + shadowRadius > visibleArea.top && 
                shadowY - shadowRadius < visibleArea.bottom) {
                
                // Criar gradiente radial para sombra
                const gradient = ctx.createRadialGradient(
                    shadowX, shadowY, 0,
                    shadowX, shadowY, shadowRadius
                );
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
                gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.36)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    shadowX - shadowRadius,
                    shadowY - shadowRadius,
                    shadowRadius * 2,
                    shadowRadius * 2
                );
            }
        }
    });
    
    ctx.restore();
}

// Renderizar luzes pontuais
function renderPointLights(ctx, map, visibleArea) {
    if (!map.lights || map.lights.length === 0) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    map.lights.forEach(light => {
        // Verificar se a luz está visível
        if (light.x + light.radius > visibleArea.left && 
            light.x - light.radius < visibleArea.right &&
            light.y + light.radius > visibleArea.top && 
            light.y - light.radius < visibleArea.bottom) {
            
            // Aplicar flicker
            const intensity = flickerSystem.update(light.id || 'default');
            
            // Criar gradiente radial
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            
            // Cores da luz com intensidade
            gradient.addColorStop(0, `rgba(255, 200, 100, ${0.28 * intensity})`);
            gradient.addColorStop(0.5, `rgba(255, 180, 80, ${0.14 * intensity})`);
            gradient.addColorStop(1, 'rgba(255, 160, 60, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.restore();
}

// Renderizar luzes dos postes
function renderStreetLights(ctx, map, visibleArea) {
    if (!map.streetLights) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    map.streetLights.forEach(light => {
        if (!isInView(light)) return;
        
        // Posição da luz (offset do poste)
        const lightX = light.x + 20;
        const lightY = light.y + 45;
        const radius = light.lightRadius || 100;
        
        // Aplicar flicker
        const intensity = flickerSystem.update(light.id || 'default');
        
        // Criar gradiente radial
        const gradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            lightX, lightY, radius
        );
        
        gradient.addColorStop(0, `rgba(255, 200, 100, ${0.4 * intensity})`);
        gradient.addColorStop(0.5, `rgba(255, 180, 80, ${0.2 * intensity})`);
        gradient.addColorStop(1, 'rgba(255, 160, 60, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(lightX, lightY, radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.restore();
}

// Renderizar sombra especial do campo (mapa 0)
function renderFieldShadow(ctx, map) {
    if (gameState.currentMap !== 0) return;
    
    const campoX = (map.width - 800) / 2;
    const campoY = (map.height - 462) / 2;
    const centerX = campoX + 400;
    const centerY = campoY + 231;
    
    ctx.save();
    
    // Sombra central do campo
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 450
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.54)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.42)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.24)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 450, centerY - 450, 900, 900);
    
    // Sombras dos cantos
    const corners = [
        {x: 0, y: 0},
        {x: map.width, y: 0},
        {x: 0, y: map.height},
        {x: map.width, y: map.height}
    ];
    
    corners.forEach(corner => {
        const cornerGradient = ctx.createRadialGradient(
            corner.x, corner.y, 0,
            corner.x, corner.y, 400
        );
        cornerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
        cornerGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.36)');
        cornerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = cornerGradient;
        ctx.fillRect(
            corner.x - 400,
            corner.y - 400,
            800,
            800
        );
    });
    
    ctx.restore();
}

// Aplicar overlay de noite
function renderNightOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 40, ${CONFIG.NIGHT_OVERLAY_ALPHA})`;
    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    ctx.restore();
}
