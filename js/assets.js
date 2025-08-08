// assets.js - Sistema de gerenciamento de assets

const assets = {
    // Campo de futebol
    campo: { img: new Image(), loaded: false },
    campoTraves: { img: new Image(), loaded: false },
    
    // Árvores
    arvore001: { img: new Image(), loaded: false, width: 180, height: 194 },
    arvore002: { img: new Image(), loaded: false, width: 194, height: 200 },
    arvore003: { img: new Image(), loaded: false, width: 162, height: 200 },
    arvore004: { img: new Image(), loaded: false, width: 150, height: 190 },
    arvore006: { img: new Image(), loaded: false, width: 169, height: 194 },
    arvorebloco001: { img: new Image(), loaded: false, width: 354, height: 186 },
    
    // Postes
    poste000: { img: new Image(), loaded: false, width: 40, height: 120 },
    poste001: { img: new Image(), loaded: false, width: 40, height: 120 },
    
    // Objetos
    parquinho: { img: new Image(), loaded: false, width: 199, height: 241 },
    banco01: { img: new Image(), loaded: false, width: 61, height: 50 },
    banco03: { img: new Image(), loaded: false, width: 53, height: 43 },
    banco04: { img: new Image(), loaded: false, width: 53, height: 45 },
    caixadeluz: { img: new Image(), loaded: false, width: 45, height: 45 },
    garrafaquebrada01: { img: new Image(), loaded: false, width: 40, height: 24 },
    garrafaquebrada02: { img: new Image(), loaded: false, width: 40, height: 24 },
    cadeiradepraia01: { img: new Image(), loaded: false, width: 29, height: 40 },
    orelhao001: { img: new Image(), loaded: false, width: 40, height: 60 },
    
    // Tiles de grama
    grama000: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama001: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama002: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama003: { img: new Image(), loaded: false, width: 120, height: 120 },
    grama004: { img: new Image(), loaded: false, width: 120, height: 120 },
    
    // Tiles de asfalto
    asfaltosujo001: { img: new Image(), loaded: false, width: 120, height: 120 },
    asfaltosujo002: { img: new Image(), loaded: false, width: 120, height: 120 },
    asfaltosujo003: { img: new Image(), loaded: false, width: 120, height: 120 },
    asfaltosujo004: { img: new Image(), loaded: false, width: 120, height: 120 },
    asfaltosujo005: { img: new Image(), loaded: false, width: 120, height: 120 },
    
    // Eixão
    eixaoCamada1: { img: new Image(), loaded: false, width: 3000, height: 868 },
    eixaoCamada2: { img: new Image(), loaded: false, width: 3000, height: 868 },
    
    // Carros do Eixão
    carro001frente: { img: new Image(), loaded: false, width: 114, height: 140 },
    carro001fundos: { img: new Image(), loaded: false, width: 102, height: 130 },
    carro002frente: { img: new Image(), loaded: false, width: 118, height: 140 },
    carro002fundos: { img: new Image(), loaded: false, width: 120, height: 138 },
    carro003fundos: { img: new Image(), loaded: false, width: 102, height: 130 },
    carro004frente: { img: new Image(), loaded: false, width: 102, height: 130 },
    carro004fundos: { img: new Image(), loaded: false, width: 93, height: 140 },
    
    // Carros estacionados
    carrolateral_01: { img: new Image(), loaded: false, width: 150, height: 100 },
    carrolateral_02: { img: new Image(), loaded: false, width: 165, height: 110 },
    carrolateral_03: { img: new Image(), loaded: false, width: 150, height: 106 },
    carrolateral_04: { img: new Image(), loaded: false, width: 150, height: 106 },
    carrolateral_05: { img: new Image(), loaded: false, width: 150, height: 100 },
    carrolateral_06: { img: new Image(), loaded: false, width: 166, height: 89 },
    carrolateral_07: { img: new Image(), loaded: false, width: 166, height: 89 },
    carrolateral_08: { img: new Image(), loaded: false, width: 177, height: 127 },
    
    // Mapa KS
    entradaKS01: { img: new Image(), loaded: false, width: 1920, height: 1610 },
    
    // Prédios
    predio0002: { img: new Image(), loaded: false, width: 520, height: 592 },
    predio0003: { img: new Image(), loaded: false, width: 520, height: 592 },
    predio0006: { img: new Image(), loaded: false, width: 400, height: 500 },
    predio0008: { img: new Image(), loaded: false, width: 520, height: 479 },
    
    // Setas direcionais
    setaesquerda: { img: new Image(), loaded: false, width: 50, height: 59 },
    setadireita: { img: new Image(), loaded: false, width: 50, height: 59 },
    setasul: { img: new Image(), loaded: false, width: 50, height: 59 },
    setanorte: { img: new Image(), loaded: false, width: 50, height: 59 }
};

// Lista de assets para carregar
const assetList = [
    // Campo
    { key: 'campo', path: 'assets/buildings/campo_de_futebol.png' },
    { key: 'campoTraves', path: 'assets/buildings/campo_de_futebol_traves.png' },
    
    // Árvores
    { key: 'arvore001', path: 'assets/scenary/arvore001.png' },
    { key: 'arvore002', path: 'assets/scenary/arvore002.png' },
    { key: 'arvore003', path: 'assets/scenary/arvore003.png' },
    { key: 'arvore004', path: 'assets/scenary/arvore004.png' },
    { key: 'arvore006', path: 'assets/scenary/arvore006.png' },
    { key: 'arvorebloco001', path: 'assets/scenary/arvorebloco001.png' },
    
    // Postes
    { key: 'poste000', path: 'assets/scenary/poste000.png' },
    { key: 'poste001', path: 'assets/scenary/poste001.png' },
    
    // Tiles grama
    { key: 'grama000', path: 'assets/tiles/grama000.png' },
    { key: 'grama001', path: 'assets/tiles/grama001.png' },
    { key: 'grama002', path: 'assets/tiles/grama002.png' },
    { key: 'grama003', path: 'assets/tiles/grama003.png' },
    { key: 'grama004', path: 'assets/tiles/grama004.png' },
    
    // Tiles asfalto
    { key: 'asfaltosujo001', path: 'assets/tiles/asfaltosujo001.png' },
    { key: 'asfaltosujo002', path: 'assets/tiles/asfaltosujo002.png' },
    { key: 'asfaltosujo003', path: 'assets/tiles/asfaltosujo003.png' },
    { key: 'asfaltosujo004', path: 'assets/tiles/asfaltosujo004.png' },
    { key: 'asfaltosujo005', path: 'assets/tiles/asfaltosujo005.png' },
    
    // Objetos
    { key: 'caixadeluz', path: 'assets/objects/caixadeluz.png' },
    { key: 'banco01', path: 'assets/objects/banco01.png' },
    { key: 'banco03', path: 'assets/objects/banco03.png' },
    { key: 'banco04', path: 'assets/objects/banco04.png' },
    { key: 'garrafaquebrada01', path: 'assets/objects/garrafaquebrada01.png' },
    { key: 'garrafaquebrada02', path: 'assets/objects/garrafaquebrada02.png' },
    { key: 'cadeiradepraia01', path: 'assets/objects/cadeiradepraia01.png' },
    { key: 'parquinho', path: 'assets/objects/parquinho.png' },
    { key: 'orelhao001', path: 'assets/objects/orelhao001.png' },
    
    // Eixão
    { key: 'eixaoCamada1', path: 'assets/floors/eixao_da_morte_camada1.png' },
    { key: 'eixaoCamada2', path: 'assets/floors/eixao_da_morte_camada2.png' },
    
    // Carros
    { key: 'carro001frente', path: 'assets/scenary/carro001-frente.png' },
    { key: 'carro001fundos', path: 'assets/scenary/carro001-fundos.png' },
    { key: 'carro002frente', path: 'assets/scenary/carro002-frente.png' },
    { key: 'carro002fundos', path: 'assets/scenary/carro002-fundos.png' },
    { key: 'carro003fundos', path: 'assets/scenary/carro003-fundos.png' },
    { key: 'carro004frente', path: 'assets/scenary/carro004-frente.png' },
    { key: 'carro004fundos', path: 'assets/scenary/carro004-fundos.png' },
    
    // Carros laterais
    { key: 'carrolateral_01', path: 'assets/scenary/carrolateral_01.png' },
    { key: 'carrolateral_02', path: 'assets/scenary/carrolateral_02.png' },
    { key: 'carrolateral_03', path: 'assets/scenary/carrolateral_03.png' },
    { key: 'carrolateral_04', path: 'assets/scenary/carrolateral_04.png' },
    { key: 'carrolateral_05', path: 'assets/scenary/carrolateral_05.png' },
    { key: 'carrolateral_06', path: 'assets/scenary/carrolateral_06.png' },
    { key: 'carrolateral_07', path: 'assets/scenary/carrolateral_07.png' },
    { key: 'carrolateral_08', path: 'assets/scenary/carrolateral_08.png' },
    
    // Mapa KS
    { key: 'entradaKS01', path: 'assets/floors/entrada_ks_01.png' },
    
    // Prédios
    { key: 'predio0002', path: 'assets/buildings/predio0002.png' },
    { key: 'predio0003', path: 'assets/buildings/predio0003.png' },
    { key: 'predio0006', path: 'assets/buildings/predio0006.png' },
    { key: 'predio0008', path: 'assets/buildings/predio0008.png' },
    
    // Setas
    { key: 'setaesquerda', path: 'assets/icons/setaesquerda.png' },
    { key: 'setadireita', path: 'assets/icons/setadireita.png' },
    { key: 'setasul', path: 'assets/icons/setasul.png' },
    { key: 'setanorte', path: 'assets/icons/setanorte.png' }
];

// Carregar todos os assets
function loadAssets() {
    console.log('🖼️ Carregando assets...');
    let loadedCount = 0;
    const totalAssets = assetList.length;
    
    assetList.forEach(item => {
        assets[item.key].img.src = item.path;
        assets[item.key].img.onload = () => {
            assets[item.key].loaded = true;
            loadedCount++;
            
            // Atualizar loading
            const percent = Math.floor((loadedCount / totalAssets) * 100);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.textContent = `Carregando... ${percent}%`;
            }
            
            if (loadedCount === totalAssets) {
                console.log('✅ Todos os assets carregados!');
            }
        };
        assets[item.key].img.onerror = () => {
            console.warn(`⚠️ Asset não encontrado: ${item.path}`);
            loadedCount++;
        };
    });
}

// Helper para verificar se asset está carregado
function isAssetLoaded(key) {
    return assets[key] && assets[key].loaded;
}

// Helper para obter dimensões do asset
function getAssetDimensions(key) {
    const asset = assets[key];
    if (!asset) return { width: 0, height: 0 };
    return {
        width: asset.width || asset.img.width || 0,
        height: asset.height || asset.img.height || 0
    };
}
