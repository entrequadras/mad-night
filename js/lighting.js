// lighting.js - Sistema de iluminação e sombras (Revisão Alpha-02 - TV Light)
(function() {
  'use strict';
  
  MadNight.lighting = {
      // Sistema de flicker para postes
      flickerLights: {},
      
      // Configurações
      config: {
          shadowOpacity: MadNight.config.lighting.shadowOpacity,
          nightOverlayOpacity: MadNight.config.lighting.nightOverlayOpacity,
          lightIntensity: MadNight.config.lighting.lightIntensity,
          flickerMinTime: MadNight.config.lighting.flickerMinTime,
          flickerMaxTime: MadNight.config.lighting.flickerMaxTime
      },
      
      // Atualizar flicker de uma luz
      updateFlicker: function(lightId) {
          if (!this.flickerLights[lightId]) {
              this.flickerLights[lightId] = {
                  intensity: 1.0,
                  targetIntensity: 1.0,
                  flickering: false,
                  flickerTime: 0,
                  nextFlicker: Date.now() + Math.random() * 5000 + 3000
              };
          }
          
          const light = this.flickerLights[lightId];
          const now = Date.now();
          
          // TV flicker mais rápido e sutil
          if (lightId === 'ks_window1') {
              // Flicker constante e rápido para simular TV
              light.intensity = 0.7 + Math.sin(now * 0.008) * 0.15 + Math.sin(now * 0.03) * 0.15;
              return light.intensity;
          }
          
          // Postes que ficam mais tempo apagados
          if (lightId === 'map4_post3' || lightId === 'map4_post7' || lightId === 'map4_post10') {
              // Fica apagado 80% do tempo
              if (!light.flickering && now > light.nextFlicker) {
                  light.flickering = true;
                  light.flickerTime = now + 200; // Acende brevemente (200ms)
                  light.targetIntensity = 0.8;
              }
              
              if (light.flickering) {
                  if (now < light.flickerTime) {
                      light.intensity = light.targetIntensity;
                  } else {
                      light.flickering = false;
                      light.intensity = 0.1; // Fica quase apagado
                      light.nextFlicker = now + 5000; // Espera 5 segundos para acender de novo
                  }
              }
              
              return light.intensity;
          }
          
          if (!light.flickering && now > light.nextFlicker) {
              light.flickering = true;
              light.flickerTime = now + Math.random() * 500 + 200;
              light.targetIntensity = 0.3 + Math.random() * 0.5;
          }
          
          if (light.flickering) {
              if (now < light.flickerTime) {
                  light.intensity = light.targetIntensity + Math.sin(now * 0.05) * 0.2;
              } else {
                  light.flickering = false;
                  light.intensity = 1.0;
                  light.nextFlicker = now + Math.random() * this.config.flickerMaxTime + this.config.flickerMinTime;
              }
          }
          
          return light.intensity;
      },
       
       // Verificar se uma posição está na sombra
       isInShadow: function(x, y) {
           const map = MadNight.maps.getCurrentMap();
           if (!map || !map.trees) return false;
           
           for (let tree of map.trees) {
               const treeAsset = MadNight.assets.get(tree.type);
               if (treeAsset && treeAsset.loaded) {
                   // Árvores secas têm sombra menor
                   let shadowRadius;
                   if (tree.type === 'arvore006' || tree.type === 'arvore007' || tree.type === 'arvore008') {
                       shadowRadius = treeAsset.width * 0.2; // Sombra bem pequena para árvores secas
                   } else if (tree.type === 'arvorebloco001') {
                       shadowRadius = treeAsset.width * 0.35;
                   } else {
                       shadowRadius = treeAsset.width * 0.5;
                   }
                   
                   const shadowX = tree.x + treeAsset.width * 0.5;
                   const shadowY = tree.y + treeAsset.height * 0.85;
                   
                   const dist = Math.sqrt(Math.pow(x - shadowX, 2) + Math.pow(y - shadowY, 2));
                   if (dist < shadowRadius) return true;
               }
           }
           
           return false;
       },
       
       // Renderizar sombras das árvores
       renderTreeShadows: function(ctx, map, visibleArea) {
           if (!map.trees) return;
           
           ctx.save();
           
           map.trees.forEach(tree => {
               const treeAsset = MadNight.assets.get(tree.type);
               if (treeAsset && treeAsset.loaded) {
                   // Árvores secas têm sombra menor
                   let shadowRadius;
                   let shadowOpacity;
                   
                   if (tree.type === 'arvore006' || tree.type === 'arvore007' || tree.type === 'arvore008') {
                       shadowRadius = treeAsset.width * 0.2; // Sombra bem pequena
                       shadowOpacity = 0.3; // Sombra mais fraca
                   } else if (tree.type === 'arvorebloco001') {
                       shadowRadius = treeAsset.width * 0.35;
                       shadowOpacity = 0.72;
                   } else {
                       shadowRadius = treeAsset.width * 0.5;
                       shadowOpacity = 0.72;
                   }
                   
                   const shadowX = tree.x + treeAsset.width * 0.5;
                   const shadowY = tree.y + treeAsset.height * 0.85;
                   
                   if (shadowX + shadowRadius > visibleArea.left && 
                       shadowX - shadowRadius < visibleArea.right &&
                       shadowY + shadowRadius > visibleArea.top && 
                       shadowY - shadowRadius < visibleArea.bottom) {
                       
                       const gradient = ctx.createRadialGradient(
                           shadowX, shadowY, 0,
                           shadowX, shadowY, shadowRadius
                       );
                       
                       // Gradiente ajustado para árvores secas
                       if (tree.type === 'arvore006' || tree.type === 'arvore007' || tree.type === 'arvore008') {
                           gradient.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`);
                           gradient.addColorStop(0.8, `rgba(0, 0, 0, ${shadowOpacity * 0.3})`);
                           gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                       } else {
                           gradient.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`);
                           gradient.addColorStop(0.6, `rgba(0, 0, 0, ${shadowOpacity * 0.5})`);
                           gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                       }
                       
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
       },
       
       // Renderizar sombra do campo (mapa 0)
       renderFieldShadow: function(ctx, map) {
           const gameState = MadNight.game.state;
           if (gameState.currentMap !== 0) return;
           
           const campoX = (map.width - 800) / 2;
           const campoY = (map.height - 462) / 2;
           const centerX = campoX + 400;
           const centerY = campoY + 231;
           
           ctx.save();
           
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
           
           this.renderCornerShadow(ctx, 0, 0, 400);
           this.renderCornerShadow(ctx, map.width, 0, 400);
           this.renderCornerShadow(ctx, 0, map.height, 400);
           this.renderCornerShadow(ctx, map.width, map.height, 400);
           
           ctx.restore();
       },
       
       // Renderizar sombra de canto
       renderCornerShadow: function(ctx, x, y, radius) {
           const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
           gradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
           gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.36)');
           gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
           
           ctx.fillStyle = gradient;
           ctx.fillRect(
               x - radius,
               y - radius,
               radius * 2,
               radius * 2
           );
       },
       
       // Renderizar luzes dos postes
       renderStreetLights: function(ctx, map) {
           if (!map.streetLights) return;
           
           ctx.save();
           ctx.globalCompositeOperation = 'lighter';
           
           map.streetLights.forEach(light => {
               const intensity = this.updateFlicker(light.id || 'default');
               
               const gradient = ctx.createRadialGradient(
                   light.x + 20, light.y + 45, 0,
                   light.x + 20, light.y + 45, 100
               );
               gradient.addColorStop(0, `rgba(255, 200, 100, ${0.4 * intensity})`);
               gradient.addColorStop(0.5, `rgba(255, 180, 80, ${0.2 * intensity})`);
               gradient.addColorStop(1, 'rgba(255, 160, 60, 0)');
               
               ctx.fillStyle = gradient;
               ctx.beginPath();
               ctx.arc(light.x + 20, light.y + 45, 100, 0, Math.PI * 2);
               ctx.fill();
           });
           
           ctx.restore();
       },
       
       // Renderizar luz de TV (antes dos prédios)
renderTVLight: function(ctx, map, visibleArea) {
   if (!map.lights || map.lights.length === 0) return;
   
   ctx.save();
   ctx.globalCompositeOperation = 'screen';
   
   // Renderizar cada TV encontrada
   map.lights.forEach(light => {
       // Verificar se é uma luz de TV
       if (light.id !== 'ks_window1' && light.id !== 'ks_window2' && 
           light.id !== 'map3_tv1' && light.id !== 'map3_tv2') return;
       
       // Configurações específicas para cada TV
       let tvX, tvY, tvRadius, tvIntensityBoost;
       
       if (light.id === 'ks_window1') {
           tvX = 360;
           tvY = 110;
           tvRadius = 50;
           tvIntensityBoost = 1.0;
       } else if (light.id === 'ks_window2') {
           tvX = 1720;  // NOVA POSIÇÃO
           tvY = 275;   // NOVA POSIÇÃO
           tvRadius = 85; // RAIO REDUZIDO (era 100)
           tvIntensityBoost = 1.8; // MAIS INTENSIDADE PARA FLICAR MAIS
       } else if (light.id === 'map3_tv1') {
           tvX = 800;
           tvY = 1021;
           tvRadius = 85;
           tvIntensityBoost = 1.2;
       } else if (light.id === 'map3_tv2') {
           tvX = 1480;
           tvY = 1510;
           tvRadius = 85;
           tvIntensityBoost = 1.2;
       }
       
       // Flicker independente para cada TV
       let intensity;
       if (light.id === 'ks_window2') {
           // Flicker mais intenso e rápido para TV 2
           const now = Date.now();
           intensity = 0.5 + Math.sin(now * 0.012) * 0.25 + Math.sin(now * 0.05) * 0.25;
           intensity *= tvIntensityBoost;
       } else {
           intensity = this.updateFlicker(light.id) * tvIntensityBoost;
       }
       
       // Gradiente azulado de TV
       const gradient = ctx.createRadialGradient(
           tvX, tvY, 0,
           tvX, tvY, tvRadius
       );
       
       // Cores mais fortes para TV 2
       if (light.id === 'ks_window2') {
           gradient.addColorStop(0, `rgba(140, 190, 255, ${0.8 * intensity})`);
           gradient.addColorStop(0.2, `rgba(120, 170, 255, ${0.7 * intensity})`);
           gradient.addColorStop(0.4, `rgba(100, 150, 255, ${0.5 * intensity})`);
           gradient.addColorStop(0.7, `rgba(80, 120, 240, ${0.3 * intensity})`);
           gradient.addColorStop(1, 'rgba(60, 100, 220, 0)');
       } else {
           gradient.addColorStop(0, `rgba(120, 170, 255, ${0.6 * intensity})`);
           gradient.addColorStop(0.2, `rgba(100, 150, 255, ${0.5 * intensity})`);
           gradient.addColorStop(0.4, `rgba(80, 120, 255, ${0.3 * intensity})`);
           gradient.addColorStop(0.7, `rgba(60, 100, 220, ${0.15 * intensity})`);
           gradient.addColorStop(1, 'rgba(40, 80, 200, 0)');
       }
       
       ctx.fillStyle = gradient;
       ctx.fillRect(
           tvX - tvRadius,
           tvY - tvRadius,
           tvRadius * 2,
           tvRadius * 2
       );
   });
   
   ctx.restore();
},
       
       // Renderizar luzes customizadas do mapa (exceto TV)
       renderMapLights: function(ctx, map, visibleArea) {
           if (!map.lights || map.lights.length === 0) return;
           
           ctx.save();
           ctx.globalCompositeOperation = 'lighter';
           
           map.lights.forEach(light => {
               // Pular as luzes de TV (elas são renderizadas separadamente)
               if (light.id === 'ks_window1' || light.id === 'ks_window2' ||
                   light.id === 'map3_tv1' || light.id === 'map3_tv2') return;
               
               if (light.x + light.radius > visibleArea.left && 
                   light.x - light.radius < visibleArea.right &&
                   light.y + light.radius > visibleArea.top && 
                   light.y - light.radius < visibleArea.bottom) {
                   
                   const intensity = this.updateFlicker(light.id || 'default');
                   
                   const gradient = ctx.createRadialGradient(
                       light.x, light.y, 0,
                       light.x, light.y, light.radius
                   );
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
       },
       
       // Renderizar overlay de noite
       renderNightOverlay: function(ctx, camera) {
           ctx.save();
           ctx.fillStyle = MadNight.config.colors.nightOverlay;
           ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
           ctx.restore();
       },
       
       // Renderizar faróis dos carros
       renderCarHeadlights: function(ctx, car) {
           ctx.save();
           ctx.globalCompositeOperation = 'lighter';
           
           const scaledWidth = car.width * 0.5;
           const scaledHeight = car.height * 0.5;
           const offsetX = (car.width - scaledWidth) / 2;
           const offsetY = (car.height - scaledHeight) / 2;
           
           const yAdjustment = car.vy < 0 ? -5 : 0;
           
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
       
       // Resetar sistema de flicker
       reset: function() {
           this.flickerLights = {};
       }
   };
   
   console.log('Módulo Lighting carregado');
   
})();
