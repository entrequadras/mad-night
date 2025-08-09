// camera.js - Sistema de Câmera

// Atualizar posição da câmera
function updateCamera() {
    const map = maps[gameState.currentMap];
    if (!map) return;
    
    // Centralizar câmera no player
    camera.x = player.x + player.width/2 - camera.width/2;
    camera.y = player.y + player.height/2 - camera.height/2;
    
    // Limitar câmera aos bounds do mapa
    camera.x = Math.max(0, Math.min(map.width - camera.width, camera.x));
    camera.y = Math.max(0, Math.min(map.height - camera.height, camera.y));
}

// Obter área visível
function getVisibleArea() {
    return {
        left: camera.x - 100,
        right: camera.x + camera.width + 100,
        top: camera.y - 100,
        bottom: camera.y + camera.height + 100
    };
}

// Verificar se objeto está visível
function isInView(obj, padding = 100) {
    const visibleArea = getVisibleArea();
    
    // Determinar bounds do objeto
    let objRight, objBottom;
    
    if (obj.width !== undefined && obj.height !== undefined) {
        // Objeto com width/height
        objRight = obj.x + obj.width;
        objBottom = obj.y + obj.height;
    } else if (obj.w !== undefined && obj.h !== undefined) {
        // Objeto com w/h
        objRight = obj.x + obj.w;
        objBottom = obj.y + obj.h;
    } else {
        // Ponto
        objRight = obj.x;
        objBottom = obj.y;
    }
    
    return obj.x < visibleArea.right && 
           objRight > visibleArea.left &&
           obj.y < visibleArea.bottom && 
           objBottom > visibleArea.top;
}

// Converter coordenada do mundo para tela
function worldToScreen(x, y) {
    return {
        x: (x - camera.x) * camera.zoom,
        y: (y - camera.y) * camera.zoom
    };
}

// Converter coordenada da tela para mundo
function screenToWorld(screenX, screenY) {
    return {
        x: screenX / camera.zoom + camera.x,
        y: screenY / camera.zoom + camera.y
    };
}

// Aplicar transformação da câmera ao contexto
function applyCameraTransform(ctx) {
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
}

// Resetar transformação da câmera
function resetCameraTransform(ctx) {
    ctx.restore();
}

// Efeito de shake (para impactos)
const cameraShake = {
    intensity: 0,
    duration: 0,
    startTime: 0,
    
    start: function(intensity = 10, duration = 300) {
        this.intensity = intensity;
        this.duration = duration;
        this.startTime = Date.now();
    },
    
    update: function() {
        if (this.intensity === 0) return;
        
        const elapsed = Date.now() - this.startTime;
        if (elapsed > this.duration) {
            this.intensity = 0;
            return;
        }
        
        // Diminuir intensidade com o tempo
        const progress = elapsed / this.duration;
        const currentIntensity = this.intensity * (1 - progress);
        
        // Aplicar shake
        camera.x += (Math.random() - 0.5) * currentIntensity;
        camera.y += (Math.random() - 0.5) * currentIntensity;
    }
};

// Zoom suave
const cameraZoom = {
    targetZoom: CONFIG.ZOOM,
    currentZoom: CONFIG.ZOOM,
    speed: 0.1,
    
    setZoom: function(zoom, instant = false) {
        this.targetZoom = Math.max(0.5, Math.min(4, zoom));
        if (instant) {
            this.currentZoom = this.targetZoom;
            camera.zoom = this.currentZoom;
        }
    },
    
    update: function() {
        if (Math.abs(this.currentZoom - this.targetZoom) > 0.01) {
            this.currentZoom += (this.targetZoom - this.currentZoom) * this.speed;
            camera.zoom = this.currentZoom;
        }
    }
};

// Efeito de zoom dramático na morte
function deathZoom() {
    cameraZoom.setZoom(3, false);
    setTimeout(() => {
        cameraZoom.setZoom(CONFIG.ZOOM, false);
    }, 1500);
}
