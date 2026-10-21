/** Simple zero-dependency smoke test for the GitHub Pages project path. */
import { readFile, access, readdir } from 'node:fs/promises';
import { site } from '../src/config/site.ts';
import { runInNewContext } from 'node:vm';


const dist = new URL('../dist/', import.meta.url);
const expectedBase = '/agubanovv-ru/';
const canonicalPrefix = 'https://tonygubanovv.github.io/agubanovv-ru/';
const errors = [];

// Execute the generated bootstrap code against a fake document, without a network.
const home = await readFile(new URL('index.html', dist), 'utf8');
const trackerScripts = [...home.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).filter(code => /metrika\/tag\.js|www\.clarity\.ms\/tag\//.test(code));
for (const hostname of ['127.0.0.1', new URL(canonicalPrefix).hostname]) {
  const inserted = [];
  const context = { location: { hostname, href: `${canonicalPrefix}blog/` }, document: {
    scripts: [], referrer: '', createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: node => inserted.push(node.src) } }],
  } };
  context.window = context;
  for (const code of trackerScripts) {
    try { runInNewContext(code, context, { timeout: 1000 }); }
    catch (error) { errors.push(`Analytics bootstrap failed: ${error.message}`); }
  }
  if (hostname === '127.0.0.1') {
    if (inserted.length || context.ym || context.clarity) errors.push('Trackers initialize on localhost');
  } else if (site.analytics.privacyApproved) {
    if (site.analytics.yandexId && (!inserted.includes(`https://mc.yandex.ru/metrika/tag.js?id=${site.analytics.yandexId}`) || context.ym?.a?.[0]?.[0] !== site.analytics.yandexId || context.ym?.a?.[0]?.[1] !== 'init')) errors.push('Metrika does not initialize with the approved ID');
    if (site.analytics.clarityId && (!inserted.includes(`https://www.clarity.ms/tag/${site.analytics.clarityId}`) || typeof context.clarity !== 'function')) errors.push('Clarity does not initialize with the approved ID');
  }
}

async function exists(path) {
  try { await access(new URL(path, dist)); return true; }
  catch { return false; }
}

for (const path of ['index.html', 'blog/index.html', 'projects/index.html', '404.html', 'robots.txt']) {
  if (!await exists(path)) errors.push(`Missing dist/${path}`);
}
if (!await exists('sitemap-index.xml') || !await exists('sitemap.xml')) {
  errors.push('Missing sitemap-index.xml or its sitemap.xml alias');
}

async function walk(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const pages = [];
  for (const entry of entries) {
    const fileUrl = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) pages.push(...await walk(fileUrl));
    else if (entry.name.endsWith('.html')) pages.push(fileUrl);
  }
  return pages;
}

for (const page of await walk(dist)) {
  const html = await readFile(page, 'utf8');
  const path = page.pathname.split('/dist/').at(-1) ?? page.pathname;
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) errors.push(`Expected exactly one H1: ${path}`);
  if (!/<html\b[^>]*lang="ru"/i.test(html)) errors.push(`Missing Russian page language: ${path}`);
  if (!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/i.test(html)) errors.push(`Missing description: ${path}`);
  if (/href=["']#["']/i.test(html)) errors.push(`Placeholder link: ${path}`);
  const analytics = site.analytics;
  const yandexEnabled = analytics.privacyApproved && Number.isSafeInteger(analytics.yandexId) && Number(analytics.yandexId) > 0;
  const clarityEnabled = analytics.privacyApproved && !!analytics.clarityId && /^[a-z0-9]+$/.test(analytics.clarityId);
  if (yandexEnabled) {
    if ((html.match(/metrika\/tag\.js/g) ?? []).length !== 1 || !html.includes(`const counterId = ${analytics.yandexId};`) || !html.includes(`https://mc.yandex.ru/watch/${analytics.yandexId}`)) errors.push(`Missing or duplicate approved Metrika counter: ${path}`);
    if (!html.includes('webvisor:true') || !html.includes('clickmap:true')) errors.push(`Incorrect approved Metrika options: ${path}`);
  } else if (/mc\.yandex\.ru/.test(html)) errors.push(`Unapproved Metrika counter: ${path}`);
  if (clarityEnabled) {
    if ((html.match(/www\.clarity\.ms\/tag\//g) ?? []).length !== 1 || !html.includes(`const projectId = "${analytics.clarityId}";`)) errors.push(`Missing or duplicate approved Clarity counter: ${path}`);
  } else if (/www\.clarity\.ms/.test(html)) errors.push(`Unapproved Clarity counter: ${path}`);
  if ((yandexEnabled || clarityEnabled) && !html.includes('location.hostname !== publicHostname')) errors.push(`Missing local analytics guard: ${path}`);
  // 404 may intentionally have no canonical because it must not be indexed.
  if (!path.endsWith('404.html')) {
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)
      ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    if (!canonical || !canonical[1].startsWith(canonicalPrefix)) {
      errors.push(`Missing/incorrect canonical: ${path}`);
    }
  }
  const re = /\b(?:href|src)=["'](\/[^"']*)["']/g;
  for (const match of html.matchAll(re)) {
    const value = match[1];
    if (!value.startsWith(expectedBase)) errors.push(`Root-absolute asset/link not base-aware: ${path} -> ${value}`);
  }
  // Follow the actual generated local links, including fragments and asset files.
  const links = /\b(?:href|src)=["']([^"']+)["']/g;
  for (const match of html.matchAll(links)) {
    const value = match[1].replace(/&amp;/g, '&');
    const pageUrl = new URL(path === 'index.html' ? '' : path.replace(/index\.html$/, ''), canonicalPrefix);
    const target = new URL(value, pageUrl);
    if (target.origin !== new URL(canonicalPrefix).origin) continue;
    if (!target.pathname.startsWith(expectedBase)) {
      errors.push(`Local link escapes base: ${path} -> ${value}`);
      continue;
    }
    let targetPath = decodeURIComponent(target.pathname.slice(expectedBase.length));
    if (!targetPath || targetPath.endsWith('/')) targetPath += 'index.html';
    if (!await exists(targetPath)) {
      errors.push(`Broken local link/asset: ${path} -> ${value}`);
    } else if (target.hash && targetPath.endsWith('.html')) {
      const targetHtml = await readFile(new URL(targetPath, dist), 'utf8');
      const id = decodeURIComponent(target.hash.slice(1));
      if (!targetHtml.includes(`id="${id}"`) && !targetHtml.includes(`id='${id}'`)) errors.push(`Broken fragment: ${path} -> ${value}`);
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(match[0])) errors.push(`Image without alt: ${path}`);
    if (!/\bwidth=/i.test(match[0]) || !/\bheight=/i.test(match[0])) errors.push(`Image without dimensions: ${path}`);
  }
  for (const match of html.matchAll(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/gi)) {
    const imageUrl = new URL(match[1]);
    if (imageUrl.origin === new URL(canonicalPrefix).origin && !await exists(imageUrl.pathname.slice(expectedBase.length))) errors.push(`Missing OG image: ${path}`);
  }
}

const robots = await readFile(new URL('robots.txt', dist), 'utf8');
if (!robots.includes(`Sitemap: ${canonicalPrefix}sitemap.xml`)) errors.push('Incorrect robots sitemap URL');
if (await exists('sitemap.xml') && await exists('sitemap-index.xml')) {
  const index = await readFile(new URL('sitemap-index.xml', dist), 'utf8');
  const alias = await readFile(new URL('sitemap.xml', dist), 'utf8');
  if (index !== alias) errors.push('sitemap.xml differs from the generated sitemap index');
  for (const match of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!match[1].startsWith(canonicalPrefix) || !await exists(match[1].slice(canonicalPrefix.length))) errors.push(`Broken sitemap reference: ${match[1]}`);
  }
}
if (await exists('CNAME')) errors.push('CNAME must not exist before a domain is approved');
for (const name of await readdir(dist)) {
  if (/^\.env|\.(pem|key|p12|pfx)$/i.test(name)) errors.push(`Sensitive file in dist: ${name}`);
}

if (errors.length) {
  console.error('Static site checks failed:\n' + errors.map(e => '- ' + e).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Static site smoke checks passed.');
}
