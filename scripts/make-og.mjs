/** Social preview uses the website palette and local Onest font files. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import opentype from 'opentype.js';
import sharp from 'sharp';

const css = await readFile('src/styles/global.css', 'utf8');
const color = (name) => {
  const value = css.match(new RegExp(`--c-${name}:\\s*(#[a-f0-9]{6})`, 'i'))?.[1];
  if (!value) throw new Error(`Missing palette token: ${name}`);
  return value;
};
const background = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${color('bg')}"/>
  <rect x="64" y="60" width="48" height="6" rx="3" fill="${color('accent')}"/>
  <g stroke="${color('accent')}" stroke-width="12" stroke-linecap="round">
    <path d="M920 430V260"/><path d="M980 430V180"/><path d="M1040 430V120"/>
  </g>
  <circle cx="1100" cy="120" r="12" fill="${color('secondary')}"/>
  <path d="M64 540H1136" stroke="${color('line')}"/>
</svg>`;
const labels = [
  { text: 'digital/pmm', left: 64, top: 92, size: 24, ink: 'muted' },
  { text: 'Заметки, кейсы\nи инструменты', left: 64, top: 210, size: 56, ink: 'ink' },
  { text: 'Продуктовый маркетинг', left: 64, top: 410, size: 28, ink: 'muted' },
];
const font = opentype.parse(Uint8Array.from(await readFile('scripts/assets/Onest.ttf')).buffer);
const paths = labels.flatMap(({ text, left, top, size, ink }) =>
  text.split('\n').map((line, index) => {
    let x = left;
    return [...line]
      .map((character) => {
        const glyph = font.charToGlyph(character);
        const outline = glyph.getPath(0, 0, size).toPathData({ decimalPlaces: 2, optimize: false, flipY: false });
        if (outline.includes('NaN')) throw new Error('Invalid glyph outline: ' + character);
        const transform = 'translate(' + x + ' ' + (top + size + index * size * 1.2) + ')';
        x += (glyph.advanceWidth * size) / font.unitsPerEm;
        return '<path fill="' + color(ink) + '" transform="' + transform + '" d="' + outline + '"/>';
      })
      .join('');
  }),
);
const svg = background.replace('</svg>', paths.join('') + '</svg>');
await mkdir('public/og', { recursive: true });
await writeFile('public/og/default.png', await sharp(Buffer.from(svg)).png().toBuffer());
console.log('[og] public/og/default.png');
