// Teste básico
console.log('Mad Night iniciando...');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Desenhar algo para testar
ctx.fillStyle = '#ff0000';
ctx.fillRect(100, 100, 50, 50);

ctx.fillStyle = '#ffffff';
ctx.font = '30px Arial';
ctx.fillText('Mad Night Funciona!', 200, 300);

console.log('Se você vê um quadrado vermelho, está funcionando!');
