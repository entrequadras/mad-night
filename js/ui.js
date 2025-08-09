// ui.js - Interface do Usuário

// Helper para definir tamanho de fonte consistente
function setPixelFont(size) {
    ctx.font = `${size}px "Press Start 2P"`;
    ctx.textBaseline = 'top';
}

// Renderizar UI completa
function renderUI(map) {
    // Salvar contexto
    ctx.save();
    
    // Resetar transformações
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Título do mapa
    renderMapTitle(map);
    
    // Status do jogo
    renderGameStatus();
    
    // Vidas
    renderLives();
    
    // Força de Pedal
    renderPedalPower();
    
    // Textos informativos
    renderInfoTexts(map);
    
    // Debug info
    if (CONFIG.DEBUG_MODE || keys['c'] || keys['C']) {
        renderDebugInfo();
    }
    
    // Mensagem de morte
    if (player.isDead) {
        renderDeathMessage();
    }
    
    // Restaurar contexto
    ctx.restore();
}

// Renderizar título do mapa
function renderMapTitle(map) {
    // Cor baseada na fase
    ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#ff0';
    setPixelFont(20);
    ctx.textAlign = 'center';
    ctx.fillText(map.name, canvas.width/2, 60);
    
    // Subtítulo
    setPixelFont(10);
    ctx.fillText(map.subtitle, canvas.width/2, 90);
    
    // Versão
    ctx.fillStyle = '#666';
    setPixelFont(8);
    ctx.fillText(CONFIG.VERSION, canvas.width/2, 115);
    ctx.textAlign = 'left';
}

// Renderizar status do jogo
function renderGameStatus() {
    ctx.fillStyle = '#fff';
    setPixelFont(10);
    
    // Mapa atual
    ctx.fillText(`Mapa: ${gameState.currentMap + 1}/6`, 20, canvas.height - 80);
    
    // Inimigos vivos
    const aliveEnemies = enemies.filter(e => !e.isDead).length;
    ctx.fillText(`Inimigos: ${aliveEnemies}`, 20, canvas.height - 50);
    
    // Fase
    const phaseText = gameState.phase === 'escape' ? 'FUGA!' : 'Infiltração';
    ctx.fillStyle = gameState.phase === 'escape' ? '#f00' : '#0f0';
    ctx.fillText(`Fase: ${phaseText}`, 20, canvas.height - 20);
}

// Renderizar vidas
function renderLives() {
    ctx.fillStyle = '#fff';
    setPixelFont(10);
    ctx.fillText('Vidas: ', 20, 40);
    
    // Desenhar caveiras
    setPixelFont(16);
    for (let i = 0; i < CONFIG.MAX_DEATHS; i++) {
        if (i >= gameState.deaths) {
            ctx.fillStyle = '#f00';
            ctx.fillText('💀', 100 + i * 40, 35);
        } else {
            ctx.fillStyle = '#444';
            ctx.fillText('💀', 100 + i * 40, 35);
        }
    }
}

// Renderizar força de pedal
function renderPedalPower() {
    ctx.fillStyle = '#fff';
    setPixelFont(10);
    ctx.fillText('Força de Pedal: ', 20, 100);
    
    // Barras de energia
    for (let i = 0; i < gameState.maxPedalPower; i++) {
        ctx.fillStyle = i < gameState.pedalPower ? '#0f0' : '#333';
        ctx.fillText('█', 200 + i * 20, 100);
    }
    
    // Indicador de dash
    if (gameState.dashUnlocked) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('[ESPAÇO] Dash', 20, 130);
    }
}

// Renderizar textos informativos
function renderInfoTexts(map) {
    setPixelFont(10);
    let yOffset = 180;
    
    // Player na sombra
    if (player.inShadow) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('Mocozado na sombra!', 20, yOffset);
        yOffset += 30;
    }
    
    // Orelhão
    if (map.orelhao && !gameState.dashUnlocked) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('Atenda o orelhão!', 20, yOffset);
        yOffset += 30;
    }
    
    // Lixeira
    if (map.lixeira && !gameState.bombPlaced) {
        const aliveEnemies = enemies.filter(e => !e.isDead).length;
        if (aliveEnemies > 0) {
            ctx.fillStyle = '#f00';
            ctx.fillText(`Elimine ${aliveEnemies} inimigos primeiro!`, 20, yOffset);
        } else {
            ctx.fillStyle = '#ff0';
            ctx.fillText('Plante o explosivo na lixeira!', 20, yOffset);
        }
        yOffset += 30;
    }
    
    // Bomba plantada
    if (gameState.bombPlaced) {
        ctx.fillStyle = '#f00';
        setPixelFont(12);
        ctx.fillText('CORRE! BOMBA PLANTADA!', 20, yOffset);
        yOffset += 30;
    }
}

// Renderizar informações de debug
function renderDebugInfo() {
    ctx.fillStyle = '#0ff';
    setPixelFont(8);
    let yOffset = 200;
    
    // Modo debug
    if (CONFIG.DEBUG_MODE) {
        ctx.fillText('DEBUG MODE ON', 20, yOffset);
        yOffset += 20;
    }
    
    // Colisões
    if (keys['c'] || keys['C']) {
        ctx.fillStyle = '#f00';
        ctx.fillText('MOSTRANDO COLISÕES', 20, yOffset);
        yOffset += 20;
    }
    
    // Posição do player
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`, 20, yOffset);
    yOffset += 20;
    
    // Câmera
    ctx.fillText(`Câmera: ${Math.floor(camera.x)}, ${Math.floor(camera.y)}`, 20, yOffset);
    yOffset += 20;
    
    // FPS (aproximado)
    const fps = Math.round(1000 / (Date.now() - (window.lastFrameTime || Date.now())));
    ctx.fillText(`FPS: ${fps}`, 20, yOffset);
    window.lastFrameTime = Date.now();
}

// Renderizar mensagem de morte
function renderDeathMessage() {
    // Fundo escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mensagem
    ctx.fillStyle = '#f00';
    setPixelFont(24);
    ctx.textAlign = 'center';
    
    const msg = gameState.deaths < CONFIG.MAX_DEATHS - 1 ? 
        "Ah véi, se liga carái!" : 
        "SIFUDEU";
    
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    
    // Contador de mortes
    setPixelFont(12);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Mortes: ${gameState.deaths}/${CONFIG.MAX_DEATHS}`, canvas.width / 2, canvas.height / 2 + 40);
    
    ctx.textAlign = 'left';
}

// Renderizar tela de vitória
function renderVictoryScreen() {
    // Fundo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = '#0f0';
    setPixelFont(32);
    ctx.textAlign = 'center';
    ctx.fillText('VOCÊ ESCAPOU!', canvas.width / 2, canvas.height / 2 - 100);
    
    // Estatísticas
    setPixelFont(12);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Mortes: ${gameState.deaths}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Inimigos eliminados: ${gameState.enemiesKilled || 0}`, canvas.width / 2, canvas.height / 2 + 30);
    
    // Créditos
    setPixelFont(10);
    ctx.fillStyle = '#888';
    ctx.fillText('Mad Night - 2024', canvas.width / 2, canvas.height / 2 + 100);
    
    ctx.textAlign = 'left';
}

// Renderizar tela de game over
function renderGameOverScreen() {
    // Fundo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = '#f00';
    setPixelFont(32);
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    // Mensagem
    setPixelFont(12);
    ctx.fillStyle = '#fff';
    ctx.fillText('Você morreu demais, mané!', canvas.width / 2, canvas.height / 2 + 20);
    
    // Instrução
    setPixelFont(10);
    ctx.fillStyle = '#ff0';
    ctx.fillText('Recomeçando...', canvas.width / 2, canvas.height / 2 + 60);
    
    ctx.textAlign = 'left';
}

// Renderizar instruções iniciais
function renderInstructions() {
    if (gameState.currentMap === 0 && !player.lastMove) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
        
        ctx.fillStyle = '#ff0';
        setPixelFont(12);
        ctx.textAlign = 'center';
        ctx.fillText('USE AS SETAS PARA MOVER', canvas.width / 2, canvas.height - 100);
        
        setPixelFont(10);
        ctx.fillStyle = '#fff';
        ctx.fillText('Atravesse o Maconhão para começar', canvas.width / 2, canvas.height - 60);
        
        ctx.textAlign = 'left';
    }
}
