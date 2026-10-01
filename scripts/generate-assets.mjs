// Genera iconos y splash screens de iOS en /public y los <link> de splash en index.html.
// Uso: npm run generate-assets
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const BG = '#0f172a';
const glyph = (size, scale) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="DejaVu Sans, Arial, sans-serif"
        font-weight="700" font-size="${size * scale}" fill="#38bdf8">Я</text>
</svg>`;

const icon = (name, size, scale = 0.62) => sharp(Buffer.from(glyph(size, scale))).png().toFile(`public/${name}`);
await Promise.all([
  icon('icon-192.png', 192),
  icon('icon-512.png', 512),
  icon('icon-maskable-512.png', 512, 0.45), // margen de seguridad para máscara
  icon('apple-touch-icon.png', 180),
  icon('favicon.png', 64),
]);

// [ancho css, alto css, factor] de los iPhone/iPad más comunes
const devices = [
  [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3],
  [414, 896, 3], [414, 896, 2], [375, 667, 2], [320, 568, 2],
  [834, 1194, 2], [820, 1180, 2], [768, 1024, 2],
];
const links = [];
for (const [w, h, r] of devices) {
  const file = `splash/${w}x${h}@${r}x.png`;
  const pw = w * r, ph = h * r;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}">
    <rect width="100%" height="100%" fill="${BG}"/>
    <text x="50%" y="48%" text-anchor="middle" dominant-baseline="central" font-family="DejaVu Sans, Arial, sans-serif"
          font-weight="700" font-size="${Math.min(pw, ph) * 0.3}" fill="#38bdf8">Я</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/${file}`);
  links.push(`    <link rel="apple-touch-startup-image" href="/${file}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" />`);
}
const html = readFileSync('index.html', 'utf8');
const out = html.replace(/<!-- SPLASH -->[\s\S]*?<!-- \/SPLASH -->|<!-- SPLASH -->/, `<!-- SPLASH -->\n${links.join('\n')}\n    <!-- /SPLASH -->`);
writeFileSync('index.html', out);
console.log('Iconos y splash generados');
