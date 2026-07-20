// Run: node generate-icons.js
// Creates icon-192.png and icon-512.png from inline SVG
// Requires: npm install canvas (dev dependency)

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Letter "A"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.55}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

[192, 512].forEach((size) => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), buffer);
  console.log(`Created icon-${size}.png`);
});
