const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Function to draw the icon
function drawIcon(canvas, size) {
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#4285f4'; // Google blue
  ctx.fillRect(0, 0, size, size);
  
  // Draw rounded corners
  const radius = size * 0.125; // 1/8 of the size
  ctx.fillStyle = '#4285f4';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Draw three white lines (representing tabs)
  ctx.fillStyle = 'white';
  const lineHeight = size * 0.1;
  const lineSpacing = size * 0.2;
  const startY = size * 0.3;
  const marginX = size * 0.2;
  
  // Top line
  ctx.fillRect(marginX, startY, size - 2 * marginX, lineHeight);
  
  // Middle line
  ctx.fillRect(marginX, startY + lineSpacing, size - 2 * marginX, lineHeight);
  
  // Bottom line (shorter)
  ctx.fillRect(marginX, startY + 2 * lineSpacing, (size - 2 * marginX) * 0.7, lineHeight);

  return canvas;
}

function generateIcons() {
  console.log('Generating extension icons...');
  
  // Create icons directory if it doesn't exist
  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
  }
  
  // Generate icons of different sizes
  const sizes = [16, 48, 128];
  
  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    drawIcon(canvas, size);
    
    // Save the icon
    const iconPath = path.join(iconsDir, `icon${size}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(iconPath, buffer);
    console.log(`Generated ${iconPath}`);
  });
  
  console.log('Icon generation complete!');
}

generateIcons();
