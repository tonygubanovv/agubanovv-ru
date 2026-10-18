/**
 * Валидатор редакционного контента: директивы, списки, таблицы, картинки,
 * сноски, ссылки и якоря. Проверяет и исходники, и собранный HTML —
 * правило, которое никто не проверяет, считается отсутствующим.
 *
 *   node scripts/check-content.mjs              # исходники + dist, если он есть
 *   node scripts/check-content.mjs --no-dist    # только исходники
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { headingSlugs, slugify } from './slugify.mjs';

const ROOT = process.cwd();
const CHECK_DIST = !process.argv.includes('--no-dist');
const problems = [];

const relative = (file) => path.relative(ROOT, file).replace(/\\/g, '/');
const read = (file) => readFile(file, 'utf8');
const exists = async (file) => !!(await stat(file).catch(() => null));
const fail = (file, line, message) =>
  problems.push(`${relative(file)}${line ? `:${line}` : ''}: ${message}`);

/* ------------------------------------------------------------------ разбор */

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Код и inline-`спаны` вычитаются пробелами, чтобы номера строк не съезжали. */
function maskCode(text) {
  let fence = null;
  return text
    .split('\n')
    .map((line) => {
      const marker = /^\s*(`{3,}|~{3,})/.exec(line);
      if (fence) {
        if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
        return ' '.repeat(line.length);
      }
      if (marker) {
        fence = marker[1];
        return ' '.repeat(line.length);
      }
      return line.replace(/`[^`\n]*`/g, (code) => ' '.repeat(code.length));
    })
    .join('\n');
}

function splitFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { front: {}, body: text, bodyStart: 1 };
  const bodyStart = match[0].split('\n').length;
  try {
    return { front: yaml.load(match[1]) ?? {}, body: text.slice(match[0].length), bodyStart };
  } catch (error) {
    return { front: null, yamlError: error.message.split('\n')[0], body: '', bodyStart };
  }
}

function headingsOf(text) {
  const masked = maskCode(text);
  return [...masked.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)].map((match) => ({
    depth: match[1].length,
    text: match[2],
    line: lineOf(masked, match.index),
  }));
}

/** Блоки :::name[подпись] … ::: ; вложенные блоки считаются отдельными. */
function directiveBlocks(masked) {
  const lines = masked.split('\n');
  const blocks = [];
  const stack = [];
  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    const legacy = /^:::([a-z][a-z-]*)[ \t]+(\S[^\n]*)$/i.exec(line);
    const open = /^:::([a-z][a-z-]*)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?$/i.exec(line);
    if (legacy && !open) {
      blocks.push({ bad: 'legacy', line: index + 1, name: legacy[1], label: legacy[2].trim() });
      return;
    }
    if (/^:::$/i.test(line)) {
      if (!stack.length) blocks.push({ bad: 'stray-close', line: index + 1 });
      else blocks.push({ ...stack.pop(), end: index + 1 });
      return;
    }
    if (open) stack.push({ name: open[1], label: open[2] ?? open[3] ?? '', line: index + 1, start: index });
  });
  for (const dangling of stack) blocks.push({ ...dangling, bad: 'unclosed' });
  return blocks;
}

/* -------------------------------------------------------------- источники */

async function loadKit() {
  const text = await read(path.join(ROOT, 'src/lib/directives.ts'));
  const block = /CALLOUT_KINDS[^{]*\{([\s\S]*?)\n\};/.exec(text);
  const kinds = [...(block?.[1] ?? '').matchAll(/^\s{2}([a-z][a-z-]*):\s*\{/gm)].map((match) => match[1]);
  const inline = [...text.matchAll(/name !== '([a-z][a-z-]*)'/g)].map((match) => match[1]);
  if (!kinds.length) fail(path.join(ROOT, 'src/lib/directives.ts'), 0, 'не удалось прочитать CALLOUT_KINDS');
  return { kinds, inline: inline.length ? inline : ['mark'] };
}

async function listFrom(file, pattern) {
  return [...(await read(path.join(ROOT, file))).matchAll(pattern)].map((match) => match[1]);
}

async function publicAssets() {
  const found = new Set();
  const walk = async (dir, prefix) => {
    for (const item of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const url = `${prefix}/${item.name}`;
      if (item.isDirectory()) await walk(path.join(dir, item.name), url);
      else found.add(url);
    }
  };
  await walk(path.join(ROOT, 'public'), '');
  return found;
}

async function staticRoutes() {
  const routes = new Set(['/', '/404/']);
  const walk = async (dir, prefix) => {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        await walk(full, `${prefix}/${item.name}`);
        continue;
      }
      const ext = path.extname(item.name);
      if (!['.astro', '.ts'].includes(ext) || item.name.startsWith('[')) continue;
      const name = path.basename(item.name, ext);
      if (name === 'index') routes.add(`${prefix}/`);
      else if (name !== '404') routes.add(ext === '.astro' ? `${prefix}/${name}/` : `${prefix}/${name}`);
    }
  };
  await walk(path.join(ROOT, 'src/pages'), '');
  return routes;
}

/* ---------------------------------------------------- проверки одного файла */

function checkDirectives(file, masked, bodyStart, kit) {
  const lines = masked.split('\n');
  const counts = {};

  for (const block of directiveBlocks(masked)) {
    const line = bodyStart + block.line - 1;
    if (block.bad === 'legacy') {
      fail(file, line, `заголовок директивы задан пробелом — надо :::${block.name}[${block.label}]`);
      continue;
    }
    if (block.bad === 'stray-close') {
      fail(file, line, 'закрывающая ::: без открытой директивы');
      continue;
    }
    if (block.bad === 'unclosed') {
      fail(file, line, `директива ":::${block.name}" не закрыта до конца файла`);
      continue;
    }
    if (!kit.kinds.includes(block.name)) {
      fail(file, line, `неизвестная директива ":::${block.name}"; разрешены: ${kit.kinds.join(', ')}`);
      continue;
    }
    if (block.label.length > 64) fail(file, line, 'подпись директивы длиннее 64 символов');
    if (/[.!?]$/.test(block.label.trim())) fail(file, line, `подпись ":::${block.name}" — заголовок, точка в конце не нужна`);
    counts[block.name] = (counts[block.name] ?? 0) + 1;

    const inner = lines.slice(block.start, (block.end ?? block.start + 1) - 1).filter((text) => text.trim());
    if (!inner.length) fail(file, line, `директива ":::${block.name}" пустая`);
    if (block.name === 'steps' && !inner.some((text) => /^\s*(?:[-*+]|\d+\.)\s+\S/.test(text))) {
      fail(file, line, 'внутри :::steps нужен список шагов');
    }
    if (block.name === 'quote' && !block.label.trim()) {
      fail(file, line, 'у :::quote нужен автор в подписи: :::quote[Кто сказал]');
    }
  }

  for (const match of masked.matchAll(/(:{1,3})([a-z][a-z-]*)\[/g)) {
    if (match[1].length > 1) continue; // :::fence уже проверен выше
    if (!kit.inline.includes(match[2])) {
      fail(
        file,
        bodyStart + lineOf(masked, match.index) - 1,
        `неизвестная inline-директива ":${match[2]}["]; разрешены: ${kit.inline.join(', ')}`,
      );
    }
  }

  return counts;
}

function checkFootnotes(file, masked, bodyStart) {
  const refs = new Map();
  const defs = new Map();
  for (const match of masked.matchAll(/\[\^([^\]^]+)\](?!:)/g)) refs.set(match[1], bodyStart + lineOf(masked, match.index) - 1);
  for (const match of masked.matchAll(/^\[\^([^\]^]+)\]:[ \t]?/gm)) {
    const line = bodyStart + lineOf(masked, match.index) - 1;
    if (defs.has(match[1])) fail(file, line, `повтор определения сноски [^${match[1]}]`);
    defs.set(match[1], line);
  }
  for (const [id, line] of refs) if (!defs.has(id)) fail(file, line, `ссылка [^${id}] без определения сноски`);
  for (const [id, line] of defs) if (!refs.has(id)) fail(file, line, `определение [^${id}] на него никто не ссылается`);
  return refs.size;
}

function checkMedia(file, masked, bodyStart, entry) {
  for (const match of masked.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:[ \t]+"([^"]*)")?\)/g)) {
    const line = bodyStart + lineOf(masked, match.index) - 1;
    const [, alt, target, caption] = match;
    if (alt.trim().length < 3) fail(file, line, 'картинке нужно описание: ![Что видно](путь)');
    if (/^https?:\/\//i.test(target)) continue;
    if (!target.startsWith('/')) {
      fail(file, line, `путь картинки должен начинаться с / (файл лежит в public): ${target}`);
      continue;
    }
    if (!entry.assets.has(target)) fail(file, line, `файл картинки не найден: public${target}`);
    if (caption === undefined) continue;
    if (!caption.trim()) fail(file, line, 'у подписи к картинке пустой текст');
    else entry.captioned += 1;
  }
}

function checkLinks(file, masked, bodyStart, entry, ctx) {
  const withoutImages = masked.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  let total = 0;

  for (const match of withoutImages.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    total += 1;
    const line = bodyStart + lineOf(withoutImages, match.index) - 1;
    const target = match[2];

    if (/^(?:mailto:|tel:|https?:)/i.test(target)) {
      if (/^http:\/\//i.test(target)) fail(file, line, `ссылка по http, а нужен https: ${target}`);
      continue;
    }
    if (target.startsWith('#')) {
      const anchor = decodeURIComponent(target.slice(1));
      if (!entry.anchors.has(anchor) && !entry.anchors.has(slugify(anchor))) {
        fail(file, line, `якорь «#${anchor}» не найден среди заголовков материала`);
      }
      continue;
    }
    if (!target.startsWith('/')) {
      fail(file, line, `ссылка должна быть от корня — GitHub Pages живёт в /<repo>/: ${target}`);
      continue;
    }

    const clean = target.split('#')[0].split('?')[0];
    const material = /^\/(blog|cases)\/([^/]+)\/?$/.exec(clean);
    if (material) {
      const linked = ctx.materials.get(material[2]);
      if (!linked) fail(file, line, `ссылка на несуществующий материал: ${clean}`);
      else if (linked.draft) fail(file, line, `ссылка на черновик: ${clean}`);
      else if (material[1] === 'cases' && linked.kind !== 'case') fail(file, line, `заметка «${material[2]}» открывается по /blog/: ${clean}`);
      else if (material[1] === 'blog' && linked.kind === 'case') fail(file, line, `кейс «${material[2]}» открывается по /cases/${material[2]}/: ${clean}`);
      continue;
    }

    const tool = /^\/tools\/([^/]+)\/?$/.exec(clean);
    if (tool) {
      if (!ctx.tools.has(tool[1])) fail(file, line, `инструмента «${tool[1]}» нет в src/lib/tools.ts: ${clean}`);
      continue;
    }

    if (ctx.routes.has(clean) || ctx.routes.has(`${clean.replace(/\/$/, '')}/`) || ctx.assets.has(clean)) continue;
    if (ctx.assets.has(clean.replace(/\/$/, ''))) continue;
    fail(file, line, `ссылка ведёт в никуда: ${clean} — нет страницы, материала, инструмента или файла`);
  }

  return total;
}

function checkFrontmatter(file, data, ctx) {
  for (const key of ['kind', 'title', 'dek', 'topic', 'date']) {
    if (data[key] === undefined) fail(file, 0, `в frontmatter нет «${key}»`);
  }
  if (!['article', 'case'].includes(data.kind)) fail(file, 0, `kind должен быть article или case, сейчас «${data.kind}»`);
  if (data.topic && !ctx.topics.has(data.topic)) {
    fail(file, 0, `тема «${data.topic}» не из src/lib/site-config.ts: ${[...ctx.topics].join(', ')}`);
  }
  const dek = String(data.dek ?? '');
  if (dek && (dek.length < 40 || dek.length > 240)) fail(file, 0, `лид должен быть 40-240 символов, сейчас ${dek.length}`);
  if (Array.isArray(data.tags) && data.tags.length > 6) fail(file, 0, 'тегов больше шести');
  if (data.seo?.title && String(data.seo.title).length > 68) fail(file, 0, 'seo.title длиннее 68 символов');
  if (data.seo?.description && String(data.seo.description).length > 190) fail(file, 0, 'seo.description длиннее 190 символов');

  if (data.kind === 'case') {
    for (const key of ['context', 'role', 'channels', 'metrics']) {
      if (data[key] === undefined) fail(file, 0, `кейсу нужно поле «${key}»`);
    }
    const metrics = Array.isArray(data.metrics) ? data.metrics : [];
    if (metrics.length < 1 || metrics.length > 4) fail(file, 0, `у кейса 1-4 метрики, сейчас ${metrics.length}`);
    metrics.forEach((metric, index) => {
      if (!metric?.value || !metric?.label) fail(file, 0, `метрике ${index + 1} нужны value и label`);
      if (metric?.trend && !['up', 'down', 'flat'].includes(metric.trend)) {
        fail(file, 0, `trend у метрики ${index + 1} бывает up/down/flat, а не «${metric.trend}»`);
      }
    });
    if (Array.isArray(data.channels) && !data.channels.length) fail(file, 0, 'у кейса пустой список каналов');
  }

  if (data.cover) {
    const src = String(data.cover.src ?? '');
    if (!src.startsWith('/')) fail(file, 0, 'cover.src должен начинаться с /');
    else if (!ctx.assets.has(src)) fail(file, 0, `обложка не найдена: public${src}`);
    if (String(data.cover.alt ?? '').trim().length < 3) fail(file, 0, 'cover.alt обязателен');
  }

  for (const related of Array.isArray(data.related) ? data.related : []) {
    if (related === ctx.slug) {
      fail(file, 0, 'материал ссылается на себя в related');
      continue;
    }
    const entry = ctx.materials.get(related);
    if (!entry) fail(file, 0, `related ссылается на несуществующий материал «${related}»`);
    else if (entry.draft) fail(file, 0, `related ссылается на черновик «${related}»`);
  }

  for (const marker of ['TODO', 'FIXME', 'правка:', 'Lorem']) {
    if (new RegExp(marker, 'i').test(`${data.title} ${data.dek}`)) fail(file, 0, `в frontmatter остался служебный маркер «${marker}»`);
  }
}

/* ------------------------------------------------------------------- dist */

async function checkDist(entries) {
  const dist = path.join(ROOT, 'dist');
  if (!(await exists(dist))) return 'dist не собран, HTML не проверялся';

  const pages = [];
  const walk = async (dir) => {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) await walk(full);
      else if (item.name.endsWith('.html')) pages.push(full);
    }
  };
  await walk(dist);

  for (const page of pages) {
    if (relative(page).includes('/admin/')) continue;
    const html = (await read(page)).replace(/<script[\s\S]*?<\/script>/g, ' ');
    if (/:::/.test(html)) fail(page, 0, 'в собранном HTML остались неразобранные :::');
    if (/>\s*Footnotes\s*<|Back to reference/.test(html)) fail(page, 0, 'служебные подписи секции сносок не переведены на русский');
    for (const match of html.matchAll(/href="#([^"]+)"/g)) {
      const anchor = decodeURIComponent(match[1]);
      if (anchor.includes('=')) continue; // фильтры каталога живут в hash и в id не попадают
      const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`id="${escaped}"`).test(html)) fail(page, 0, `битый якорь на странице: #${anchor}`);
    }
  }

  for (const entry of entries) {
    const page = path.join(dist, entry.kind === 'case' ? 'cases' : 'blog', entry.slug, 'index.html');
    if (!(await exists(page))) {
      if (!entry.draft) fail(page, 0, `материал «${entry.slug}» не собран`);
      continue;
    }
    const html = await read(page);
    const declared = Object.values(entry.directives).reduce((sum, count) => sum + count, 0);
    const rendered = [...html.matchAll(/<(?:div|details|blockquote) class="(?:callout|pull-quote)/g)].length;
    if (rendered !== declared) fail(page, 0, `директив в тексте ${declared}, размечено ${rendered}: часть ::: не дошла до HTML`);

    const tables = (html.match(/<table/g) ?? []).length;
    const wrappers = (html.match(/class="table-wrap"/g) ?? []).length;
    if (tables !== wrappers) fail(page, 0, `таблиц ${tables}, а обёрток .table-wrap ${wrappers}`);

    const figures = (html.match(/<figure class="prose-figure"/g) ?? []).length;
    if (figures !== entry.captioned) fail(page, 0, `картинок с подписью ${entry.captioned}, а figure в HTML ${figures}`);

    const checkboxes = (html.match(/class="task-list-item"/g) ?? []).length;
    if (checkboxes !== entry.taskItems) fail(page, 0, `пунктов задачи в тексте ${entry.taskItems}, в HTML ${checkboxes}`);

    const footnoteRefs = (html.match(/data-footnote-ref/g) ?? []).length;
    if (footnoteRefs !== entry.footnotes) fail(page, 0, `сносок в тексте ${entry.footnotes}, ссылок на них в HTML ${footnoteRefs}`);
    if (footnoteRefs) {
      const section = html.match(/<section[^>]*class="footnotes"[^>]*>/);
      if (!section || !/aria-label="Примечания"/.test(section[0])) {
        fail(page, 0, 'у секции сносок нет доступного имени «Примечания»');
      }
      // Служебный заголовок генератора ломает оглавление: его быть не должно.
      if (/<h2[^>]*>\s*Примечания\s*<\/h2>/.test(html)) {
        fail(page, 0, 'служебный заголовок секции сносок не удалён');
      }
    }
  }

  return `проверено ${pages.length} html-страниц`;
}

/* ------------------------------------------------------------------- main */

const kit = await loadKit();
const ctx = {
  assets: await publicAssets(),
  routes: await staticRoutes(),
  topics: new Set(await listFrom('src/lib/site-config.ts', /slug:\s*'([^']+)'/g)),
  tools: new Set(await listFrom('src/lib/tools.ts', /slug:\s*'([^']+)'/g)),
  materials: new Map(),
};

const blogDir = path.join(ROOT, 'src/content/blog');
const entries = [];
for (const name of await readdir(blogDir).catch(() => [])) {
  if (!/\.(md|mdx)$/.test(name)) continue;
  const file = path.join(blogDir, name);
  const entry = {
    slug: path.basename(name, path.extname(name)),
    file,
    kind: 'article',
    draft: false,
    directives: {},
    captioned: 0,
    taskItems: 0,
    footnotes: 0,
    links: 0,
    anchors: new Set(),
    assets: ctx.assets,
  };
  const parsed = splitFrontmatter(await read(file));
  entry.parsed = parsed;
  if (parsed.front !== null) {
    entry.kind = parsed.front.kind ?? 'article';
    entry.draft = !!parsed.front.draft;
  }
  entries.push(entry);
  ctx.materials.set(entry.slug, entry);
}
if (!entries.length) fail(blogDir, 0, 'в src/content/blog нет ни одного материала');

// Kind/draft уже известны для всех файлов, поэтому cross-ссылки проверяются корректно.
for (const entry of entries) {
  const parsed = entry.parsed;
  if (parsed.front === null) {
    fail(entry.file, 0, `frontmatter не парсится: ${parsed.yamlError}`);
    continue;
  }
  const data = parsed.front;

  const body = maskCode(parsed.body);
  checkFrontmatter(entry.file, data, { ...ctx, slug: entry.slug });

  const headings = headingsOf(parsed.body);
  const anchors = headingSlugs(headings);
  entry.anchors = new Set(anchors);
  headings.forEach((heading, index) => {
    const line = parsed.bodyStart + heading.line - 1;
    if (index > 0 && heading.depth - headings[index - 1].depth > 1) {
      fail(entry.file, line, `заголовок h${heading.depth} идёт после h${headings[index - 1].depth} — уровень пропущен`);
    }
    if (!anchors[index]) fail(entry.file, line, `у заголовка «${heading.text}» не получается якорь`);
    else if (anchors.indexOf(anchors[index]) !== index) fail(entry.file, line, `якорь «${anchors[index]}» повторяется — переформулируй заголовок`);
  });

  entry.directives = checkDirectives(entry.file, body, parsed.bodyStart, kit);
  entry.footnotes = checkFootnotes(entry.file, body, parsed.bodyStart);
  checkMedia(entry.file, body, parsed.bodyStart, entry);
  entry.taskItems = [...body.matchAll(/^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]+\S/gm)].length;
  entry.links = checkLinks(entry.file, body, parsed.bodyStart, entry, ctx);

  for (const marker of ['TODO', 'FIXME', 'правка:', 'Lorem']) {
    if (new RegExp(marker, 'i').test(body)) fail(entry.file, 0, `в тексте остался служебный маркер «${marker}»`);
  }
}

const distNote = CHECK_DIST ? await checkDist(entries) : 'dist пропущен (--no-dist)';

if (problems.length) {
  console.error(`\ncheck-content: проблем — ${problems.length}`);
  for (const line of problems) console.error(`  · ${line}`);
  console.error('\nНабор директив и правила текста: docs/CONTENT_KIT.md\n');
  process.exit(1);
}

const totals = {
  materials: entries.length,
  directives: entries.reduce((sum, entry) => sum + Object.values(entry.directives).reduce((a, b) => a + b, 0), 0),
  links: entries.reduce((sum, entry) => sum + entry.links, 0),
  tasks: entries.reduce((sum, entry) => sum + entry.taskItems, 0),
};

console.log(
  `check-contentOK: материалов ${totals.materials}, директив ${totals.directives}, ссылок ${totals.links}, пунктов задачи ${totals.tasks}; ${distNote}.`,
);
