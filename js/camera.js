// Mad Night v1.40 - Estrutura Modular
// camera.js - Sistema de câmera

MadNight.camera = {
    // Propriedades da câmera
    x: 0,
    y: 0,
    width: MadNight.config.camera.width,
    height: MadNight.config.camera.height,
    zoom: MadNight.config.camera.zoom,
    
    // Target para seguir (normalmente o player)
    target: null,
    
    // Configurações de movimento
    smoothing: 0.1, // Suavização do movimento (0 = instantâneo, 1 = não se move)
    
    // Limites do mapa atual
    mapBounds: {
        width: 0,
        height: 0
    },
    
    // Definir alvo da câmera
    setTarget: function(target) {
        this.target = target;
    },
    
    // Atualizar posição da câmera
    update: function() {
        if (!this.target) return;
        
        const map = MadNight.maps.getCurrentMap();
        if (!map) return;
        
        // Atualizar limites do mapa
        this.mapBounds.width = map.width;
        this.mapBounds.height = map.height;
        
        // Calcular posição desejada (centralizar no target)
        const targetX = this.target.x + this.target.width / 2 - this.width / 2;
        const targetY = this.target.y + this.target.height / 2 - this.height / 2;
        
        // Aplicar suavização (lerp)
        if (this.smoothing > 0) {
            this.x += (targetX - this.x) * (1 - this.smoothing);
            this.y += (targetY - this.y) * (1 - this.smoothing);
        } else {
            this.x = targetX;
            this.y = targetY;
        }
        
        // Aplicar limites do mapa
        this.clampToMapBounds();
    },
    
    // Forçar câmera a seguir instantaneamente
    snapToTarget: function() {
        if (!this.target) return;
        
        this.x = this.target.x + this.target.width / 2 - this.width / 2;
        this.y = this.target.y + this.target.height / 2 - this.height / 2;
        
        this.clampToMapBounds();
    },
    
    // Limitar câmera aos limites do mapa
    clampToMapBounds: function() {
        this.x = Math.max(0, Math.min(this.mapBounds.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.mapBounds.height - this.height, this.y));
    },
    
    // Obter área visível
    getVisibleArea: function() {
        return {
            left: this.x - 100,
            right: this.x + this.width + 100,
            top: this.y - 100,
            bottom: this.y + this.height + 100
        };
    },
    
    // Verificar se um objeto está visível
    isVisible: function(obj, padding = 100) {
        const visibleArea = this.getVisibleArea();
        
        // Determinar largura e altura do objeto
        let objWidth = obj.width || obj.w || 100;
        let objHeight = obj.height || obj.h || 100;
        
        // Se for um asset, pegar dimensões do asset
        if (obj.type && MadNight.assets.get(obj.type)) {
            const asset = MadNight.assets.get(obj.type);
            objWidth = asset.width || objWidth;
            objHeight = asset.height || objHeight;
        }
        
        return obj.x + objWidth > visibleArea.left && 
               obj.x < visibleArea.right &&
               obj.y + objHeight > visibleArea.top && 
               obj.y < visibleArea.bottom;
    },
    
    // Converter coordenadas do mundo para coordenadas da tela
    worldToScreen: function(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    },
    
    // Converter coordenadas da tela para coordenadas do mundo
    screenToWorld: function(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    },
    
    // Aplicar transformação da câmera ao contexto
    applyTransform: function(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    },
    
    // Resetar transformação
    resetTransform: function(ctx) {
        ctx.restore();
    },
    
    // Shake da câmera (para efeitos)
    shakeAmount: 0,
    shakeDecay: 0.9,
    
    shake: function(amount = 10) {
        this.shakeAmount = amount;
    },
    
    updateShake: function() {
        if (this.shakeAmount > 0.1) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount;
            const shakeY = (Math.random() - 0.5) * this.shakeAmount;
            
            this.x += shakeX;
            this.y += shakeY;
            
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }
    },
    
    // Reset da câmera
    reset: function() {
        this.x = 0;
        this.y = 0;
        this.target = null;
        this.shakeAmount = 0;
    },
    
    // Zoom in/out suave
    targetZoom: null,
    zoomSpeed: 0.1,
    
    setZoom: function(newZoom, instant = false) {
        if (instant) {
            this.zoom = newZoom;
            this.targetZoom = null;
        } else {
            this.targetZoom = newZoom;
        }
    },
    
    updateZoom: function() {
        if (this.targetZoom !== null) {
            const diff = this.targetZoom - this.zoom;
            if (Math.abs(diff) > 0.01) {
                this.zoom += diff * this.zoomSpeed;
            } else {
                this.zoom = this.targetZoom;
                this.targetZoom = null;
            }
        }
    }
};
