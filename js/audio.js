// audio.js - Sistema de áudio

MadNight.audio = {
   // Músicas
   musicas: {
       inicio: null,
       fuga: null,
       creditos: null,
       menu: null  // ADICIONADO
   },
   
   // Efeitos sonoros
   sfx: {
       ataque_janis: null,
       dash: null,
       mobilete: null,
       morte_caveira: null,
       morte_chacal: null,
       morte_janis: null,
       morte_faquinha: null,
       morte_madmax: null,
       morte_morcego: null,
       phone_ring: null
   },
   
   // Volume padrão
   sfxVolume: MadNight.config.audio.sfxVolume,
   musicVolume: MadNight.config.audio.musicVolume,
   
   // Música atual tocando
   currentMusic: null,
   ambientMusic: null,
   
   // Carregar um efeito sonoro
   loadSFX: function(name, loop = false) {
       try {
           this.sfx[name] = new Audio(`assets/audio/${name}.mp3`);
           this.sfx[name].volume = this.sfxVolume;
           this.sfx[name].loop = loop;
           this.sfx[name].load();
           console.log(`SFX carregado: ${name}`);
       } catch (e) {
           console.error(`Erro ao carregar SFX ${name}:`, e);
       }
   },
   
   // Carregar uma música
   loadMusic: function(name, loop = true) {
       try {
           // MODIFICADO: Adiciona suporte para música do menu
           const filename = name === 'menu' ? 'menu_ambient' : 
                          `musica_etqgame_${name === 'inicio' ? 'tema_inicio' : name === 'fuga' ? 'fuga' : 'end_credits'}`;
           this.musicas[name] = new Audio(`assets/audio/${filename}.mp3`);
           this.musicas[name].loop = loop;
           this.musicas[name].volume = this.musicVolume;
           this.musicas[name].load();
           console.log(`Música carregada: ${name}`);
       } catch (e) {
           console.error(`Erro ao carregar música ${name}:`, e);
       }
   },
   
   // Tocar efeito sonoro
   playSFX: function(soundName, volume = null) {
       if (!this.sfx[soundName]) return;
       
       try {
           const sound = this.sfx[soundName].cloneNode();
           sound.volume = volume !== null ? volume : this.sfxVolume;
           sound.play().catch(() => {});
       } catch (e) {
           // Falha silenciosa
       }
   },
   
   // Tocar som de morte baseado no tipo de inimigo
   playDeathSound: function(enemyType) {
       const deathSounds = {
           'faquinha': 'morte_faquinha',
           'morcego': 'morte_morcego',
           'caveirinha': 'morte_caveira',
           'janis': 'morte_janis',
           'chacal': 'morte_chacal',
           'player': 'morte_madmax'
       };
       
       const soundName = deathSounds[enemyType];
       if (soundName) {
           this.playSFX(soundName, enemyType === 'player' ? 0.8 : 0.6);
       }
   },
   
   // Parar som em loop
stopLoopSFX: function(soundName) {
    if (this.sfx[soundName] && !this.sfx[soundName].paused) {
        this.sfx[soundName].pause();
        this.sfx[soundName].currentTime = 0;
    }
},

// Tocar música
playMusic: function(phase) {
    if (this.currentMusic) {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
    }
    
    if (phase === 'inicio' && this.musicas.inicio) {
        this.musicas.inicio.play().catch(() => {});
        this.currentMusic = this.musicas.inicio;
    } else if (phase === 'fuga' && this.musicas.fuga) {
        this.musicas.fuga.play().catch(() => {});
        this.currentMusic = this.musicas.fuga;
    } else if (phase === 'creditos' && this.musicas.creditos) {
        this.musicas.creditos.play().catch(() => {});
        this.currentMusic = this.musicas.creditos;
    } else if (phase === 'menu' && this.musicas.menu) {
        this.musicas.menu.play().catch(() => {});
        this.currentMusic = this.musicas.menu;
    }
},

// Tocar música ambiente (volume baixo) - NOVO
playAmbient: function(volume = 0.15) {
    if (this.musicas.menu && this.musicas.menu !== this.currentMusic) {
        this.ambientMusic = this.musicas.menu;
        this.ambientMusic.volume = volume;
        this.ambientMusic.loop = true;
        this.ambientMusic.play().catch(() => {});
    }
},

// Parar música ambiente - NOVO
stopAmbient: function() {
    if (this.ambientMusic) {
        this.ambientMusic.pause();
        this.ambientMusic.currentTime = 0;
        this.ambientMusic = null;
    }
},

// Parar todas as músicas (modificado - não para o ambient)
stopMusic: function() {
    if (this.currentMusic) {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
    }
    // Não para o ambientMusic
},

// Toggle música (para debug)
toggleMusic: function() {
    if (this.currentMusic && !this.currentMusic.paused) {
        this.currentMusic.pause();
    } else if (this.currentMusic) {
        this.currentMusic.play().catch(() => {});
    }
},
   
   // Atualizar volume dos SFX
   setSFXVolume: function(volume) {
       this.sfxVolume = Math.max(0, Math.min(1, volume));
       for (let key in this.sfx) {
           if (this.sfx[key]) {
               this.sfx[key].volume = this.sfxVolume;
           }
       }
   },
   
   // Atualizar volume da música
   setMusicVolume: function(volume) {
       this.musicVolume = Math.max(0, Math.min(1, volume));
       for (let key in this.musicas) {
           if (this.musicas[key]) {
               this.musicas[key].volume = this.musicVolume;
           }
       }
   },
   
   // Inicializar sistema de áudio
   init: function() {
       console.log('Inicializando sistema de áudio...');
       
       // Carregar todos os SFX
       this.loadSFX('ataque_janis');
       this.loadSFX('dash');
       this.loadSFX('mobilete', true);
       this.loadSFX('morte_caveira');
       this.loadSFX('morte_chacal');
       this.loadSFX('morte_janis');
       this.loadSFX('morte_faquinha');
       this.loadSFX('morte_madmax');
       this.loadSFX('morte_morcego');
       this.loadSFX('phone_ring', true);
       
       // Carregar músicas
       this.loadMusic('inicio', true);
       this.loadMusic('fuga', true);
       this.loadMusic('creditos', false);
       this.loadMusic('menu', true);  // ADICIONADO
       
       console.log('Sistema de áudio inicializado');
   }
};
