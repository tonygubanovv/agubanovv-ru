/* Собирает блог из markdown-файлов в blog/ в статические страницы в web/blog/.
   Запуск: node build.mjs   (после этого — публикация сайта)
   Файлы с подчеркиванием в начале имени (blog/_шаблон.md) в блог не попадают. */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, statSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const SRC = 'blog';
const OUT = join('web', 'blog');

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const META = {
  title: 'Блог — Антон Губанов',
  description: 'Заметки Антона Губанова о digital-маркетинге и продукте.',
  robots: '<meta name="robots" content="noindex, nofollow, noimageindex, noarchive, nosnippet">\n<meta name="googlebot" content="noindex, nofollow">',
  icon: '<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2032%2032%27%3E%3Crect%20width=%2732%27%20height=%2732%27%20fill=%27%23F4F1EC%27/%3E%3Cpath%20d=%27M9%2022%2016%209l7%2013%27%20stroke=%27%2304585a%27%20stroke-width=%271.6%27%20fill=%27none%27/%3E%3C/svg%3E">',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function safeUrl(u) {
  const t = u.trim();
  return /^(https?:|mailto:|tg:|\/|#)/i.test(t) && !/^\/\/[^/]/.test(t) ? t : null;
}

/* Размеры картинки берём из самого файла, чтобы страница не прыгала при прокрутке. */
function dims(src) {
  if (!src.startsWith('/blog/')) return null;
  let b;
  try { b = readFileSync(join(SRC, src.slice('/blog/'.length))); } catch { return null; }

  if (b.slice(0, 8).toString('hex') === '89504e470d0a1a0a') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.slice(0, 6).toString('ascii').startsWith('GIF8')) return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let o = 2; o + 9 < b.length; ) {
      if (b[o] !== 0xff) { o++; continue; }
      const mark = b[o + 1];
      if (mark >= 0xc0 && mark <= 0xcf && mark !== 0xc4 && mark !== 0xc8 && mark !== 0xcc) {
        return { w: b.readUInt16BE(o + 7), h: b.readUInt16BE(o + 5) };
      }
      o += 2 + b.readUInt16BE(o + 2);
    }
  }
  return null;
}

/* Картинки по внешним ссылкам скачиваются в blog/assets/ и отдаются с сайта,
   чтобы чужой хостинг не мог обрезать страницу. Ссылка остаётся внешней,
   только если скачать не удалось. */
const IMAGES = new Map();

function assetName(url) {
  const ext = (/\.([a-z]{3,4})(?:\?|$)/i).exec(url)?.[1]?.toLowerCase();
  const name = createHash('sha1').update(url).digest('hex').slice(0, 10);
  return `img-${name}.${['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'svg'].includes(ext) ? ext : 'png'}`;
}

function pullImages(raw) {
  mkdirSync(join(SRC, 'assets'), { recursive: true });

  const urls = new Set();
  for (const m of raw.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)) urls.add(m[1]);
  const cover = /^cover:[ \t]*(https?:\/\/[^)\s]+)[ \t]*$/im.exec(raw);
  if (cover) urls.add(cover[1]);

  for (const url of urls) {
    if (IMAGES.has(url)) continue;

    const file = assetName(url);
    const dest = join(SRC, 'assets', file);

    if (!existsSync(dest) || !statSync(dest).size) {
      try {
        execFileSync('curl', ['-sL', '--fail', '--max-time', '90', '-o', dest, url], { stdio: 'ignore' });
      } catch { rmSync(dest, { force: true }); }
    }

    IMAGES.set(url, existsSync(dest) && statSync(dest).size ? `/blog/assets/${file}` : url);
    if (IMAGES.get(url) === url) console.log(`не скачалось: ${url}`);
  }
}

/* Картинка по ссылке из markdown или из поля cover: → локальный путь и размеры. */
function picture(url, alt) {
  const src = safeUrl(url);
  if (!src) return null;
  const u = IMAGES.get(src) || src;
  return { src: u, alt: alt || '', dims: dims(u) };
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(«—])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (m, alt, url) => {
      const src = safeUrl(url);
      if (!src) return alt;
      const u = IMAGES.get(src) || src;
      const d = dims(u);
      return `<img src="${u}" alt="${alt || ''}" loading="lazy"${d ? ` width="${d.w}" height="${d.h}"` : ''}>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, (m, text, url) => {
      const u = safeUrl(url);
      return u ? `<a href="${u}" rel="noopener">${text}</a>` : text;
    });
}

/* Якорь заголовка: кириллица остаётся кириллицей, повторы получают -2, -3. */
function anchor(text, used) {
  const base = text.toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'razdel';
  const n = (used.get(base) || 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

function renderMarkdown(md, toc) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const used = new Map();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (line.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.max(heading[1].length, 2);
      const text = heading[2].trim();
      const plain = text.replace(/[*_`]/g, '').trim();
      const id = anchor(plain, used);
      if (toc && level <= 3 && plain) toc.push({ level, id, text: esc(plain) });
      out.push(`<h${level} id="${id}">${inline(esc(text))}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    if (/^!\[[^\]]*\]\([^)]*\)\s*$/.test(line)) { out.push(inline(esc(line.trim()))); i++; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${buf.map((p) => inline(esc(p))).join('<br>')}</blockquote>`);
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.test(line);
    const numbered = /^\d+[.)]\s+(.*)$/.test(line);
    if (bullet || numbered) {
      const items = [];
      const re = bullet ? /^[-*+]\s+(.*)$/ : /^\d+[.)]\s+(.*)$/;
      while (i < lines.length) {
        const m = re.exec(lines[i]);
        if (!m) break;
        items.push(`<li>${inline(esc(m[1]))}</li>`);
        i++;
      }
      out.push(`<${bullet ? 'ul' : 'ol'}>${items.join('')}</${bullet ? 'ul' : 'ol'}>`);
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>\s?|```|-{3,}\s*$|!\[)/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) && !/^\d+[.)]\s+/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push(`<p>${inline(esc(buf.join(' ')))}</p>`);
  }

  return out.join('\n');
}

function parseFile(name, raw, mtime) {
  const fm = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/.exec(raw);
  const fields = {};
  let body = raw;

  if (fm) {
    for (const row of fm[1].split('\n')) {
      const kv = /^([A-Za-z][A-Za-z0-9-]*):[ \t]*(.*)$/.exec(row.trim());
      if (kv) fields[kv[1]] = kv[2].trim();
    }
    body = raw.slice(fm[0].length).replace(/^[ \t]*\n/, '');
  }

  // Первая строка вида «# Текст» — это название записи, в тексте оно не повторяется.
  const h1 = /^[ \t]*#[ \t]+(.+?)[ \t]*\n/.exec(body);
  if (h1) {
    body = body.slice(h1[0].length);
    if (!fields.title) fields.title = h1[1].trim();
  }

  if (!fields.title) throw new Error(`${join(SRC, name)}: нет заголовка — строка «# Название» или поле title`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date || '')) fields.date = mtime;

  const slug = name.replace(/\.md$/, '');
  const [y, mo, d] = fields.date.split('-').map(Number);
  const toc = [];
  return {
    slug,
    title: fields.title,
    lead: fields.lead || '',
    date: fields.date,
    dateHuman: `${d} ${MONTHS[mo - 1]} ${y}`,
    cover: fields.cover ? picture(fields.cover, fields['cover-alt']) : null,
    toc,
    body: renderMarkdown(body.trim(), toc),
  };
}

const NAV = [
  ['/#experience', 'Опыт'],
  ['/#contacts', 'Контакты'],
  ['/blog.html', 'Блог'],
];

function page({ title, description, current, body }) {
  const nav = NAV.map(([href, text]) => {
    const on = href === current ? ' class="is-current"' : '';
    return `        <li><a${on} href="${href}">${text}</a></li>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${META.robots}
<meta name="theme-color" content="#F4F1EC">
<link rel="stylesheet" href="/fonts.css">
<link rel="stylesheet" href="/styles.css">
${META.icon}
</head>
<body>
<a class="skip" href="#main">К основному содержанию</a>

<header class="head" id="top">
  <div class="wrap head-row">
    <a class="mark" href="/">Антон&nbsp;Губанов</a>
    <nav class="nav" aria-label="Разделы сайта">
      <ul>
${nav}
      </ul>
    </nav>
  </div>
</header>

<main id="main">
${body}
</main>

<footer class="foot wrap">
  <p>Антон Губанов · digital-маркетолог</p>
  <p><a href="/">Все о себе</a></p>
</footer>

<button class="up" type="button" aria-label="Вернуться наверх"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13.2V3.1M3.6 7.4 8 3l4.4 4.4"/></svg></button>

<script src="/script.js"></script>
</body>
</html>
`;
}

function feedPosts(posts) {
  if (!posts.length) {
    return `    <section class="blog wrap" aria-labelledby="blog-title">
      <div class="sec-head">
        <p class="sec-num">—</p>
        <div class="sec-title"><h1 id="blog-title" class="page-title">Блог</h1></div>
      </div>
      <p class="empty">Записей пока нет. Новый markdown-файл в папке <code>blog/</code> появится в этой ленте после ближайшей сборки сайта.</p>
    </section>`;
  }

  const rows = posts.map((p) => `      <article class="entry">
        <div class="entry-side">
          <p class="when">${p.dateHuman}</p>
        </div>
        <div class="entry-main">
          <h2 class="entry-title"><a class="line-link" href="/blog/${p.slug}.html">${esc(p.title)}</a></h2>
          ${p.lead ? `<p class="lead">${esc(p.lead)}</p>` : ''}
        </div>
      </article>`).join('\n');

  return `    <section class="blog wrap" aria-labelledby="blog-title">
      <div class="sec-head">
        <p class="sec-num">—</p>
        <div class="sec-title"><h1 id="blog-title" class="page-title">Блог</h1></div>
      </div>
      <div class="feed">
${rows}
      </div>
    </section>`;
}

function postPage(p) {
  const cover = p.cover
    ? `      <figure class="cover">
        <img src="${esc(p.cover.src)}" alt="${esc(p.cover.alt)}" loading="lazy"${
  p.cover.dims ? ` width="${p.cover.dims.w}" height="${p.cover.dims.h}"` : ''}>
      </figure>`
    : '';

  // Навигация нужна, когда есть из чего выбирать: один раздел — не оглавление.
  const toc = p.toc.length > 1
    ? `      <nav class="toc" aria-label="Разделы записи">
        <ul>
${p.toc.map((t) => `          <li class="l${t.level}"><a href="#${t.id}">${t.text}</a></li>`).join('\n')}
        </ul>
      </nav>`
    : '';

  return `    <article class="blog-post wrap" aria-labelledby="post-title">
      <header class="post-head">
        <h1 id="post-title" class="page-title">${esc(p.title)}</h1>
        <p class="sec-meta post-date">${p.dateHuman}</p>
      </header>
${[cover, toc, p.lead ? `      <p class="lead big">${esc(p.lead)}</p>` : ''].filter(Boolean).join('\n')}
      <div class="prose">
${p.body}
      </div>
      <p class="post-end"><a class="back" href="/blog.html">← Все записи</a></p>
    </article>`;
}

// Дата записи: поле date → дата последнего коммита файла → время файла.
// В CI mtime равен дате чекаута, поэтому без даты из git день публикации сдвигался бы на день сборки.
function fileDate(path) {
  let fromGit = '';
  try {
    fromGit = execFileSync(
      'git',
      ['log', '-1', '--format=%ad', '--date=short', '--', path.split('\\').join('/')],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString().trim();
  } catch { /* файла ещё нет в истории — берём время файла */ }
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromGit)) return fromGit;
  const t = statSync(path).mtime;
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

const posts = readdirSync(SRC)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .map((f) => {
    const raw = readFileSync(join(SRC, f), 'utf8');
    pullImages(raw);
    return parseFile(f, raw, fileDate(join(SRC, f)));
  })
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

if (existsSync(join(SRC, 'assets'))) {
  mkdirSync(join(OUT, 'assets'), { recursive: true });
  for (const f of readdirSync(join(SRC, 'assets'))) copyFileSync(join(SRC, 'assets', f), join(OUT, 'assets', f));
}

writeFileSync(join('web', 'blog.html'), page({
  title: 'Блог — Антон Губанов',
  description: META.description,
  current: '/blog.html',
  body: feedPosts(posts),
}));

posts.forEach((p) => {
  writeFileSync(join(OUT, `${p.slug}.html`), page({
    title: `${p.title} — Антон Губанов`,
    description: p.lead || p.title,
    current: '/blog.html',
    body: postPage(p),
  }));
});

const form = posts.length % 10 === 1 && posts.length % 100 !== 11 ? 'запись' : 'записей';
console.log(`${posts.length} ${form} → web/blog.html + web/blog/`);
