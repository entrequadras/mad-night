// Mad Night v1.39 - Postes e Iluminação no Mapa KS
// Substitua apenas a definição do Mapa 2 no array maps

// Mapa 2 - Fronteira com o Komando Satânico (v1.39 - Postes e Iluminação)
{
    name: "Fronteira com o Komando Satânico",
    subtitle: "Primeira superquadra",
    width: 1920,
    height: 1610,
    enemies: [
        {x: 267, y: 1524, type: 'faquinha'},
        {x: 444, y: 820, type: 'janis'}
    ],
    escapeEnemies: [
        {x: 400, y: 300, type: 'chacal'},
        {x: 200, y: 200, type: 'caveirinha'},
        {x: 600, y: 400, type: 'caveirinha'}
    ],
    tiles: generateTiles(1920, 1610, 120, ['asfaltosujo001', 'asfaltosujo002', 'asfaltosujo003', 'asfaltosujo004', 'asfaltosujo005']),
    hasBackground: true,
    backgroundAsset: 'entradaKS01',
    buildings: [
        {
            type: 'predio0002', 
            x: 1550, 
            y: 665,
            // v1.39 - Colisões ajustadas
            collisionRects: [
                {x: 1680, y: 1100, w: 200, h: 60},  // Base inferior
                {x: 1680, y: 1060, w: 220, h: 40},  // Meio-baixo
                {x: 1710, y: 1020, w: 220, h: 40},  // Meio
                {x: 1740, y: 960, w: 200, h: 60}    // Meio-alto
            ]
        },
        {
            type: 'predio0006', 
            x: 0, 
            y: 970,
            // v1.39 - Colisões ajustadas
            collisionRects: [
                {x: 40, y: 1220, w: 342, h: 155}    // Retângulo único centralizado
            ]
        },
        {
            type: 'predio0003', 
            x: 1300, 
            y: -60,
            // v1.39 - Colisões ajustadas
            collisionRects: [
                {x: 1360, y: 280, w: 210, h: 40},   // Meio-alto
                {x: 1440, y: 320, w: 190, h: 40},   // Meio
                {x: 1490, y: 360, w: 210, h: 40},   // Meio-baixo
                {x: 1540, y: 400, w: 180, h: 40}    // Base inferior
            ]
        },
        {
            type: 'predio0008', 
            x: 201, 
            y: -90,
            // v1.39 - Colisões ajustadas
            collisionRects: [
                {x: 220, y: 150, w: 350, h: 40},    // Meio-alto
                {x: 250, y: 190, w: 300, h: 40},    // Meio
                {x: 304, y: 230, w: 160, h: 40},    // Meio-baixo
                {x: 361, y: 270, w: 160, h: 40}     // Base inferior
            ]
        },
        {
            type: 'predio0008', 
            x: 550, 
            y: 50,
            // v1.39 - Colisões ajustadas
            collisionRects: [
                {x: 540, y: 290, w: 500, h: 40},    // Meio-alto
                {x: 640, y: 330, w: 380, h: 40},    // Meio
                {x: 690, y: 370, w: 340, h: 40},    // Meio-baixo
                {x: 770, y: 410, w: 190, h: 40}     // Base inferior
            ]
        }
    ],
    trees: [],
    streetLights: [
        // v1.39 - Postes com posições e direções corretas
        {type: 'poste000', x: 695, y: 350, rotation: 0, lightRadius: 100, id: 'ks_post1'},
        {type: 'poste000', x: 355, y: 204, rotation: 0, lightRadius: 100, id: 'ks_post2'},
        {type: 'poste001', x: 1059, y: 170, rotation: 0, lightRadius: 100, id: 'ks_post3'},
        {type: 'poste001', x: 1317, y: 637, rotation: 0, lightRadius: 100, id: 'ks_post4'},
        {type: 'poste001', x: 1729, y: 1185, rotation: 0, lightRadius: 100, id: 'ks_post5'},
        {type: 'poste001', x: 411, y: 1243, rotation: 0, lightRadius: 100, id: 'ks_post6'}
    ],
    objects: [
        // v1.38 - Parquinho e Banco
        {type: 'parquinho', x: 1394, y: 668, rotation: 0},
        {type: 'banco01', x: 1073, y: 544, rotation: 0}
    ],
    walls: [
        // Sem paredes adicionais - usando colisões dos prédios
    ],
    lights: [
        // v1.39 - Luz de janela atrás do prédio
        {x: 360, y: 100, radius: 120, id: 'ks_window1'}
    ],
    shadows: [],
    playerStart: {x: 1440, y: 1550},
    playerStartEscape: {x: 70, y: 70},
    exit: {x: 70, y: 70, w: 60, h: 60},
    orelhao: {x: 1000, y: 412, w: 40, h: 60},
    direction: 'left'
},

// TAMBÉM ATUALIZE A LINHA DO console.log no início do arquivo para:
console.log('Mad Night v1.39 - Postes e Iluminação no Mapa KS');

// E o gameState.version para:
version: 'v1.39' // Postes e Iluminação no Mapa KS!

// E no final do arquivo, atualize os console.logs de debug:
console.log('🎮 Mad Night v1.39 - Postes e Iluminação no Mapa KS');
console.log('📢 Controles: Setas=mover, Espaço=dash, C=ver colisões');
console.log('💡 6 postes de luz adicionados no mapa KS');
console.log('🏠 Luz de janela simulada atrás do prédio');
console.log('🏢 Colisões dos prédios totalmente ajustadas!');
