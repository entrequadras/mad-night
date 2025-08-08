// audio.js - Sistema de Áudio

const audio = {
    // Músicas
    inicio: null,
    fuga: null,
    creditos: null,
    
    // SFX
    ataque_janis: null,
    dash: null,
    mobilete: null,
    morte_caveira: null,
    morte_chacal: null,
    morte_janis: null,
    morte_faquinha: null,
    morte_madmax: null,
    morte_morcego: null,
    phone_ring: null,
    
    sfxVolume: CONFIG.SFX_VOLUME,
    musicVolume: CONFIG.MUSIC_VOLUME,
    
    // Carregar um SFX
    loadSFX: function(name, loop = false) {
        try {
            this[name] = new Audio(`assets/audio/${name}.mp3`);
            this[name].volume = this.sfxVolume;
            this[name].loop = loop;
            this[name].load();
            console.log(`✅ SFX ${name} carregado`);
        } catch (e) {
            console.error(`❌ Erro ao carregar ${name}:`, e);
        }
    },
    
    // Tocar SFX
    playSFX: function(soundName, volume = null) {
        if (!this[soundName]) {
            console.warn(`⚠️ Som ${soundName} não encontrado`);
            return;
        }
        
        try {
            // Clonar o áudio para permitir múltiplas reproduções
            const sound = this[soundName].cloneNode();
            sound.volume = volume !== null ? volume : this.sfxVolume;
            sound.play().catch(e => {
                // Falha silenciosa - navegador pode bloquear autoplay
                console.warn(`Autoplay bloqueado para ${soundName}`);
            });
        } catch (e) {
            console.error(`Erro ao tocar ${soundName}:`, e);
        }
    },
    
    // Parar som em loop
    stopLoopSFX: function(soundName) {
        if (this[soundName] && !this[soundName].paused) {
            this[soundName].pause();
            this[soundName].currentTime = 0;
        }
    }
};

// Carregar todos os sons
function loadAudio() {
    console.log('🎵 Carregando áudio...');
    
    // Carregar SFX
    audio.loadSFX('ataque_janis');
    audio.loadSFX('dash');
    audio.loadSFX('mobilete', true); // Loop
    audio.loadSFX('morte_caveira');
    audio.loadSFX('morte_chacal');
    audio.loadSFX('morte_janis');
    audio.loadSFX('morte_faquinha');
    audio.loadSFX('morte_madmax');
    audio.loadSFX('morte_morcego');
    audio.loadSFX('phone_ring', true); // Loop
    
    // Carregar músicas
    try {
        audio.inicio = new Audio('assets/audio/musica_etqgame_tema_inicio.mp3');
        audio.fuga = new Audio('assets/audio/musica_etqgame_fuga.mp3');
        audio.creditos = new Audio('assets/audio/musica_etqgame_end_credits.mp3');
        
        audio.inicio.loop = true;
        audio.fuga.loop = true;
        audio.inicio.volume = audio.musicVolume;
        audio.fuga.volume = audio.musicVolume;
        audio.creditos.volume = audio.musicVolume;
        
        // Preload das músicas
        audio.inicio.load();
        audio.fuga.load();
        audio.creditos.load();
        
        console.log('✅ Músicas carregadas');
    } catch (e) {
        console.error('❌ Erro ao carregar músicas:', e);
    }
}

// Tocar música
function playMusic(phase) {
    // Parar música atual
    if (gameState.currentMusic) {
        gameState.currentMusic.pause();
        gameState.currentMusic.currentTime = 0;
    }
    
    // Tocar nova música
    if (phase === 'inicio' && audio.inicio) {
        audio.inicio.play().catch(e => {
            console.warn('Autoplay de música bloqueado - clique na tela para ativar');
        });
        gameState.currentMusic = audio.inicio;
        gameState.musicPhase = 'inicio';
    } else if (phase === 'fuga' && audio.fuga) {
        audio.fuga.play().catch(e => {
            console.warn('Autoplay de música bloqueado');
        });
        gameState.currentMusic = audio.fuga;
        gameState.musicPhase = 'fuga';
    } else if (phase === 'creditos' && audio.creditos) {
        audio.creditos.play().catch(e => {
            console.warn('Autoplay de música bloqueado');
        });
        gameState.currentMusic = audio.creditos;
        gameState.musicPhase = 'creditos';
    }
}

// Atualizar sons baseados em proximidade
function updateProximitySounds() {
    const map = maps[gameState.currentMap];
    
    // Som do telefone tocando
    if (map.orelhao && !gameState.dashUnlocked) {
        const orelhaoCenter = {
            x: map.orelhao.x + map.orelhao.w / 2,
            y: map.orelhao.y + map.orelhao.h / 2
        };
        const playerCenter = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2
        };
        
        const distance = Math.sqrt(
            Math.pow(playerCenter.x - orelhaoCenter.x, 2) + 
            Math.pow(playerCenter.y - orelhaoCenter.y, 2)
        );
        
        // Tocar telefone quando estiver próximo
        if (distance < 150 && audio.phone_ring && audio.phone_ring.paused) {
            audio.phone_ring.play().catch(() => {});
        }
        // Parar se afastar
        else if (distance > 200 && audio.phone_ring && !audio.phone_ring.paused) {
            audio.phone_ring.pause();
        }
    }
}
