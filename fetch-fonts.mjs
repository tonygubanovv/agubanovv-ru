import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUT = join(process.cwd(), 'web', 'fonts');
const families = [
  { query: 'Onest:wght@400..700', slug: 'onest' },
];

// Знаки, которых нет в подмножествах latin/cyrillic/cyrillic-ext: без них
// браузер берёт системный шрифт, и в тексте появляется чужое начертание.
const SIGNS = '₽←→↑↓№—–…«»“”‘’•×÷±²³°§†‡™';
const KEEP = new Set(['cyrillic', 'cyrillic-ext', 'latin']);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let css = '';
let bytes = 0;

for (const fam of families) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${fam.query}&display=swap`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${fam.slug}: css ${res.status}`);
  const text = await res.text();

  const seen = new Set();
  for (const m of text.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g)) {
    const [, subset, body] = m;
    if (!KEEP.has(subset)) continue;
    const url = (/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/).exec(body)?.[1];
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const name = (/font-family:\s*'([^']+)'/).exec(body)[1];
    const weight = (/font-weight:\s*([^;]+)/).exec(body)[1].trim();
    const range = (/unicode-range:\s*([^;]+)/).exec(body)[1].trim();
    const hash = (/\/([A-Za-z0-9_-]{6,})\.woff2$/).exec(url)[1].slice(-8);
    const file = `${fam.slug}-${subset}-${hash}.woff2`;

    const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    writeFileSync(join(OUT, file), buf);
    bytes += buf.byteLength;

    css += `@font-face{font-family:'${name}';font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/${file}) format('woff2');unicode-range:${range}}\n`;
    console.log(`${file}  wght ${weight}  ${(buf.byteLength / 1024).toFixed(1)} KB`);
  }
}

// Отдельный маленький файл под знаки вне подмножеств: тот же Onest, те же веса.
{
  const url = `https://fonts.googleapis.com/css2?family=${families[0].query}&display=swap&text=${encodeURIComponent(SIGNS)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`signs: css ${res.status}`);
  const text = await res.text();
  const block = /@font-face\s*\{([^}]+)\}/.exec(text)?.[1];
  if (!block) throw new Error('signs: нет @font-face');
  const src = (/url\((https:\/\/fonts\.gstatic\.com\/[^)\s]+)\)/).exec(block)?.[1];
  const range = (/unicode-range:\s*([^;]+)/).exec(block)?.[1]?.trim();
  const weight = (/font-weight:\s*([^;]+)/).exec(block)?.[1]?.trim();
  if (!src || !range) throw new Error('signs: в файле нет этих знаков');
  const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
  const kit = /[?&]kit=([^&]+)/.exec(src)?.[1] || /[?&]v=([^&]+)/.exec(src)?.[1] || 'v1';
  const file = `onest-signs-${kit.replace(/[^A-Za-z0-9_-]/g, '').slice(-8)}.woff2`;
  writeFileSync(join(OUT, file), buf);
  bytes += buf.byteLength;
  css += `@font-face{font-family:'Onest';font-style:normal;font-weight:${weight || '400 700'};font-display:swap;src:url(/fonts/${file}) format('woff2');unicode-range:${range}}\n`;
  console.log(`${file}  wght ${weight}  ${(buf.byteLength / 1024).toFixed(1)} KB  ${range}`);
}

writeFileSync(join(process.cwd(), 'web', 'fonts.css'), css);
console.log(`\n${(bytes / 1024).toFixed(0)} KB total, ${css.split('@font-face').length - 1} faces`);