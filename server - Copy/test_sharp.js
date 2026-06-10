const sharp = require('sharp');
console.log('Sharp version:', sharp.versions);
sharp({
  create: {
    width: 10,
    height: 10,
    channels: 4,
    background: { r: 255, g: 0, b: 0, alpha: 0.5 }
  }
})
.webp()
.toBuffer()
.then(() => console.log('Sharp test SUCCESS'))
.catch(err => console.error('Sharp test FAILED:', err));
