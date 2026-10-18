/**
 * Механическая проверка жёстких правил из docs/DESIGN_RULES.md.
 * Запускается как `npm run check:rules` и в CI перед сборкой: правило,
 * которое нельзя проверить, не считается правилом.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const violations = [];

const SOURCES_EXT = ['.astro', '.tsx', '.ts', '.css', '.md', '.mdx'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', '.git']);

async function* walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) yield* walk(full);
    else if (SOURCES_EXT.includes(path.extname(item.name))) yield full;
  }
}

const read = (file) => readFile(file, 'utf8');

const CHECKS = [
  {
    id: 'breakpoints',
    hint: 'Разрешены только desk (1280) и wide (1536): база 360, без планшетной ступени.',
    test: (text) =>
      [
        ...text.matchAll(
          /(?<![\w-])(?:sm|md|lg|xl|2xl|3xl):|@media\s*\([^)]*(?:min|max)-width:\s*(?!(?:1280|1536)px\b)\d+px/g,
        ),
      ].map((m) => m[0]),
  },
  {
    id: 'no-keyframes',
    hint: 'Никаких keyframes и animation: только transition по токенам.',
    test: (text, file) =>
      file.includes('global.css') && text.includes('prefers-reduced-motion')
        ? []
        : [...text.matchAll(/@keyframes\s|animation\s*:/g)].map((m) => m[0].trim()),
  },
  {
    id: 'no-raw-colors',
    hint: 'Цвет только из токенов: hex/rgb вне src/styles/global.css запрещён.',
    test: (text, file) =>
      file.includes('global.css') || file.endsWith('.svg') || file.includes('make-og')
        ? []
        : [...text.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)].map((m) => m[0]),
  },
  {
    id: 'no-third-party',
    hint: 'Не тянуть шрифты/скрипты с чужих CDN: всё self-hosted.',
    test: (text) =>
      [...text.matchAll(/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|unpkg\.com/g)].map((m) => m[0]),
  },
  {
    id: 'no-important',
    hint: '!important допустим только в блоке prefers-reduced-motion.',
    test: (text, file) =>
      file.includes('global.css') ? [] : [...text.matchAll(/!important/g)].map(() => '!important'),
  },
  {
    id: 'no-caps',
    hint: 'Капслока на сайте нет: text-transform: uppercase и small-caps запрещены.',
    test: (text) =>
      [
        ...text.matchAll(
          /text-transform\s*:\s*(?:uppercase|small-caps|full-small-caps)|font-variant\s*:\s*[^;\n]*small-caps/g,
        ),
      ].map((m) => m[0]),
  },
  {
    id: 'onest-font',
    hint: 'Единственная гарнитура — Onest: используйте var(--font-onest).',
    test: (text, file) =>
      file.endsWith('styles/typography.css')
        ? []
        : [...text.matchAll(/font-family\s*:\s*[^;\n]+/g)]
            .map((m) => m[0])
            .filter((value) => !/var\(--font-onest\)/.test(value)),
  },
  {
    id: 'typography-tokens',
    hint: 'Типографика задаётся ролями --type-* из src/styles/typography.css, без старой шкалы.',
    test: (text) =>
      [
        ...text.matchAll(
          /var\(--text-[\w-]+\)|var\(--font-(?:display|text)\)|font-size:\s*(?!0\.86em|0\.72em)[\d.]+(?:px|rem)/g,
        ),
      ].map((m) => m[0]),
  },
];

for await (const file of walk(path.join(ROOT, 'src'))) {
  const text = await read(file);
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  for (const check of CHECKS) {
    // Документированное исключение: /* rules-allow: <id> — причина */
    if (text.includes(`rules-allow: ${check.id}`)) continue;
    const hits = check.test(text, relative);
    if (hits.length) {
      violations.push(`${relative}: [${check.id}] ${hits.slice(0, 3).join(', ')} — ${check.hint}`);
    }
  }
}

/** Контент проходит тот же контракт, что и админка. */
const blogDir = path.join(ROOT, 'src/content/blog');
const REQUIRED = ['kind', 'title', 'dek', 'topic', 'date'];
try {
  for (const name of await readdir(blogDir)) {
    if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;
    const text = await read(path.join(blogDir, name));
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    if (!match) {
      violations.push(`src/content/blog/${name}: нет frontmatter`);
      continue;
    }
    const front = match[1];
    try {
      // Некорректный YAML (например «title: а: б» без кавычек) ломает сборку, а не только фид.
      (await import('js-yaml')).load(front);
    } catch (error) {
      violations.push(`src/content/blog/${name}: frontmatter не парсится — ${error.message.split('\n')[0]}`);
    }
    for (const key of REQUIRED) {
      if (!new RegExp(`^${key}:`, 'm').test(front)) {
        violations.push(`src/content/blog/${name}: не хватает поля «${key}»`);
      }
    }
    if (/^kind:\s*case/m.test(front)) {
      for (const key of ['context', 'metrics', 'channels', 'role']) {
        if (!new RegExp(`^${key}:`, 'm').test(front)) {
          violations.push(`src/content/blog/${name}: кейсу нужно поле «${key}»`);
        }
      }
    }
    if (/(?:[\p{Script=Han}\p{Script=Kana}]|[àáčłōš]ed)/u.test(text)) {
      violations.push(`src/content/blog/${name}: посторонние символы в тексте (CJK/диакритика)`);
    }
  }
} catch {
  violations.push('src/content/blog: каталог не найден');
}

if (violations.length) {
  console.error(`\nНарушения правил (${violations.length}):`);
  for (const line of violations) console.error(`  · ${line}`);
  console.error('\nСписок правил: docs/DESIGN_RULES.md\n');
  process.exit(1);
}

console.log(
  'Правила соблюдены: брейкпоинты, motion, токены цвета и типографики, Onest, без капслока и сторонних CDN, контракт контента.',
);
