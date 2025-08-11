// Mad Night v1.40 - Estrutura Modular
// assets.js - Gerenciamento de assets

MadNight.assets = {
    // Definições de todos os assets
    definitions: {
        // Campos e prédios
        campo: { width: 800, height: 462 },
        campoTraves: { width: 800, height: 462 },
        
        // Árvores
        arvore001: { width: 180, height: 194 },
        arvore002: { width: 194, height: 200 },
        arvore003: { width: 162, height: 200 },
        arvore004: { width: 150, height: 190 },
        arvore006: { width: 169, height: 194 },
        arvorebloco001: { width: 354, height: 186 },
        
        // Postes
        poste000: { width: 40, height: 120 },
        poste001: { width: 40, height: 120 },
        
        // Objetos do parquinho
        parquinho: { width: 199, height: 241 },
        banco01: { width: 61, height: 50 },
        banco03: { width: 66, height: 51 },
        banco04: { width: 66, height: 55 },
        
        // Objetos pequenos
        caixadeluz: { width: 45, height: 45 },
        garrafaquebrada01: { width: 40, height: 24 },
        garrafaquebrada02: { width: 40, height: 24 },
        cadeiradepraia01: { width: 29, height: 40 },
        orelhao001: { width: 40, height: 60 },
        
        // Tiles de grama
        grama000: { width: 120, height: 120 },
        grama001: { width: 120, height: 120 },
        grama002: { width: 120, height: 120 },
        grama003: { width: 120, height: 120 },
        grama004: { width: 120, height: 120 },
        
        // Tiles de asfalto
        asfaltosujo001: { width: 120, height: 120 },
        asfaltosujo002: { width: 120, height: 120 },
        asfaltosujo003: { width: 120, height: 120 },
        asfaltosujo004: { width: 120, height: 120 },
        asfaltosujo005: { width: 120, height: 120 },
        
        // Assets do Eixão
        eixaoCamada1: { width: 3000, height: 868 },
        eixaoCamada2: { width: 3000, height: 868 },
        
        // Carros do Eixão
        carro001frente: { width: 114, height: 140 },
        carro001fundos: { width: 102, height: 130 },
        carro002frente: { width: 118, height: 140 },
        carro002fundos: { width: 120, height: 138 },
        carro003fundos: { width: 102, height: 130 },
        carro004frente: { width: 102, height: 130 },
        carro004fundos: { width: 93, height: 140 },
        
        // Carros laterais estacionados
        carrolateral_01: { width: 150, height: 100 },
        carrolateral_02: { width: 165, height: 110 },
        carrolateral_03: { width: 150, height: 106 },
        carrolateral_04: { width: 150, height: 106 },
        carrolateral_05: { width: 150, height: 100 },
        carrolateral_06: { width: 166, height: 89 },
        carrolateral_07: { width: 166, height: 89 },
        carrolateral_08: { width: 177, height: 127 },
        
        // Assets do mapa KS
        entradaKS01: { width: 1920, height: 1610 },
        
        // Prédios do mapa KS
        predio0002: { width: 520, height: 592 },
        predio0003: { width: 520, height: 592 },
        predio0006: { width: 400, height: 500 },
        predio0008: { width: 520, height: 479 },
        
        // Setas direcionais
        setaesquerda: { width: 50, height: 59 },
        setadireita: { width: 50, height: 59 },
        setasul: { width: 50, height: 59 },
        setanorte: { width: 50, height: 59 }
    },
    
    // Container para imagens carregadas
    images: {},
    
    // Container para sprites
    sprites: {
        madmax: [],
        faquinha: [],
        morcego: [],
        caveirinha: [],
        janis: [],
        chacal: []
    },
    
    // Contador de sprites carregados
    spritesLoaded: {
        madmax: 0,
        faquinha: 0,
        morcego: 0,
        caveirinha: 0,
        janis: 0,
        chacal: 0
    },
    
    // Carregar uma imagem
    loadImage: function(name, path) {
        const img = new Image();
        const def = this.definitions[name];
        
        this.images[name] = {
            img: img,
            loaded: false,
            width: def ? def.width : 100,
            height: def ? def.height : 100
        };
        
        img.onload = () => {
            this.images[name].loaded = true;
            console.log(`Asset carregado: ${name}`);
        };
        
        img.onerror = () => {
            console.error(`Erro ao carregar: ${name}`);
        };
        
        img.src = path;
    },
    
    // Carregar sprites de personagem
    loadCharacterSprites: function(characterName, count = 16) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            const filename = `assets/sprites/${characterName}${String(i).padStart(3, '0')}.png`;
            
            img.onload = () => {
                this.spritesLoaded[characterName]++;
            };
            
            img.src = filename;
            this.sprites[characterName][i] = img;
        }
    },
    
    // Inicializar todos os assets
    init: function() {
        console.log('Carregando assets...');
        
        // Carregar campos
        this.loadImage('campo', 'assets/buildings/campo_de_futebol.png');
        this.loadImage('campoTraves', 'assets/buildings/campo_de_futebol_traves.png');
        
        // Carregar árvores
        this.loadImage('arvore001', 'assets/scenary/arvore001.png');
        this.loadImage('arvore002', 'assets/scenary/arvore002.png');
        this.loadImage('arvore003', 'assets/scenary/arvore003.png');
        this.loadImage('arvore004', 'assets/scenary/arvore004.png');
        this.loadImage('arvore006', 'assets/scenary/arvore006.png');
        this.loadImage('arvorebloco001', 'assets/scenary/arvorebloco001.png');
        
        // Carregar postes
        this.loadImage('poste000', 'assets/scenary/poste000.png');
        this.loadImage('poste001', 'assets/scenary/poste001.png');
        
        // Carregar tiles de grama
        for (let i = 0; i <= 4; i++) {
            this.loadImage(`grama00${i}`, `assets/tiles/grama00${i}.png`);
        }
        
        // Carregar tiles de asfalto
        for (let i = 1; i <= 5; i++) {
            this.loadImage(`asfaltosujo00${i}`, `assets/tiles/asfaltosujo00${i}.png`);
        }
        
        // Carregar objetos
        this.loadImage('caixadeluz', 'assets/objects/caixadeluz.png');
        this.loadImage('banco01', 'assets/objects/banco01.png');
        this.loadImage('banco03', 'assets/objects/banco03.png');
        this.loadImage('banco04', 'assets/objects/banco04.png');
        this.loadImage('garrafaquebrada01', 'assets/objects/garrafaquebrada01.png');
        this.loadImage('garrafaquebrada02', 'assets/objects/garrafaquebrada02.png');
        this.loadImage('cadeiradepraia01', 'assets/objects/cadeiradepraia01.png');
        this.loadImage('parquinho', 'assets/objects/parquinho.png');
        this.loadImage('orelhao001', 'assets/objects/orelhao001.png');
        
        // Carregar assets do Eixão
        this.loadImage('eixaoCamada1', 'assets/floors/eixao_da_morte_camada1.png');
        this.loadImage('eixaoCamada2', 'assets/floors/eixao_da_morte_camada2.png');
        
        // Carregar carros
        this.loadImage('carro001frente', 'assets/scenary/carro001-frente.png');
        this.loadImage('carro001fundos', 'assets/scenary/carro001-fundos.png');
        this.loadImage('carro002frente', 'assets/scenary/carro002-frente.png');
        this.loadImage('carro002fundos', 'assets/scenary/carro002-fundos.png');
        this.loadImage('carro003fundos', 'assets/scenary/carro003-fundos.png');
        this.loadImage('carro004frente', 'assets/scenary/carro004-frente.png');
        this.loadImage('carro004fundos', 'assets/scenary/carro004-fundos.png');
        
        // Carregar carros laterais
        for (let i = 1; i <= 8; i++) {
            this.loadImage(`carrolateral_0${i}`, `assets/scenary/carrolateral_0${i}.png`);
        }
        
        // Carregar assets do mapa KS
        this.loadImage('entradaKS01', 'assets/floors/entrada_ks_01.png');
        
        // Carregar prédios
        this.loadImage('predio0002', 'assets/buildings/predio0002.png');
        this.loadImage('predio0003', 'assets/buildings/predio0003.png');
        this.loadImage('predio0006', 'assets/buildings/predio0006.png');
        this.loadImage('predio0008', 'assets/buildings/predio0008.png');
        
        // Carregar setas
        this.loadImage('setaesquerda', 'assets/icons/setaesquerda.png');
        this.loadImage('setadireita', 'assets/icons/setadireita.png');
        this.loadImage('setasul', 'assets/icons/setasul.png');
        this.loadImage('setanorte', 'assets/icons/setanorte.png');
        
        // Carregar sprites de personagens
        this.loadCharacterSprites('madmax');
        this.loadCharacterSprites('faquinha');
        this.loadCharacterSprites('morcego');
        this.loadCharacterSprites('caveirinha');
        this.loadCharacterSprites('janis');
        this.loadCharacterSprites('chacal');
    },
    
    // Verificar se um asset está carregado
    isLoaded: function(name) {
        return this.images[name] && this.images[name].loaded;
    },
    
    // Obter um asset
    get: function(name) {
        return this.images[name];
    },
    
    // Verificar se todos os sprites de um personagem foram carregados
    areSpritesLoaded: function(characterName) {
        return this.spritesLoaded[characterName] >= 16;
    }
};
