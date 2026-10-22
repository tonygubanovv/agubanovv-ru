/** Checks the actual static output for the approved custom domain. */
import { readFile, access, readdir } from 'node:fs/promises';
import { site } from '../src/config/site.ts';
import { hiddenPaths } from '../src/utils/routes.ts';
import { checkAnalytics } from './check-analytics.mjs';
import { parse } from 'parse5';


const dist = new URL('../dist/', import.meta.url);
const expectedBase = '/';
const canonicalPrefix = 'https://agubanovv.ru/';
const errors = [];

const home = await readFile(new URL('index.html', dist), 'utf8');
errors.push(...checkAnalytics(home, site, new URL(canonicalPrefix).hostname));

function elements(root) {
  const result = [];
  const visit = node => {
    if (node.tagName) result.push(node);
    node.childNodes?.forEach(visit);
  };
  visit(root);
  return result;
}
// Actual DOM text, as read by search tools and copy/paste; CSS line breaks add no spaces.
function textChunks(node) {
  if (node.nodeName === '#text') return [node.value];
  if (['svg', 'script', 'style', 'sup', 'sub'].includes(node.tagName)) return [];
  return (node.childNodes ?? []).flatMap(textChunks);
}
const normalizeText = value => value.replace(/\s+/gu, ' ').trim();
const homeH1 = elements(parse(home)).find(node => node.tagName === 'h1');
if (normalizeText(textChunks(homeH1).join('')) !== normalizeText(`${site.hero.title} ${site.hero.accent}`)) {
  errors.push('Home H1 text is joined or differs from the configured title');
}

async function exists(path) {
  try { await access(new URL(path, dist)); return true; }
  catch { return false; }
}

const countMatches = (text, line) => text.split('\n').filter(entry => entry === line).length;

for (const path of ['index.html', 'blog/index.html', 'telegram-ads-ib-vendor/index.html', '404.html', 'robots.txt', 'robots-yandex.txt', 'privacy/index.html', 'cookies/index.html', 'consent/index.html', 'legal/index.html', 'legal/privacy/index.html', 'legal/cookies/index.html', 'legal/consent/index.html', 'sitemap-0.xml']) {
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
  for (const node of elements(parse(html)).filter(node => node.tagName === 'a')) {
    const attr = name => node.attrs.find(item => item.name === name)?.value ?? '';
    if (attr('href').startsWith('mailto:') && (/\bbutton\b/.test(attr('class')) || attr('role') === 'button')) {
      errors.push(`Email must be a plain mailto link, never a button: ${path}`);
    }
  }
  for (const node of elements(parse(html)).filter(node => /^(h[1-6]|p|figcaption|button)$/.test(node.tagName))) {
    const chunks = textChunks(node).filter(Boolean);
    for (let index = 1; index < chunks.length; index++) {
      if (/[\p{L}\p{N}.!?]$/u.test(chunks[index - 1]) && /^[\p{L}\p{N}]/u.test(chunks[index])) {
        errors.push(`Missing text separator in ${node.tagName}: ${path} -> ${chunks[index - 1].slice(-30)}|${chunks[index].slice(0, 30)}`);
      }
    }
  }
  const pagePath = path.replace(/index\.html$/, '');
  const isPrivatePage = hiddenPaths.includes(pagePath) || path.endsWith('404.html');
  const isNoindex = /<meta\b[^>]*name="robots"[^>]*content="noindex/i.test(html);
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) errors.push(`Expected exactly one H1: ${path}`);
  if (!/<html\b[^>]*lang="ru"/i.test(html)) errors.push(`Missing Russian page language: ${path}`);
  if (!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/i.test(html)) errors.push(`Missing description: ${path}`);
  if (/href=["']#["']/i.test(html)) errors.push(`Placeholder link: ${path}`);
  const analyticsEnabled = site.analytics.privacyApproved && Number.isSafeInteger(site.analytics.yandexId) && Number(site.analytics.yandexId) > 0;
  if (analyticsEnabled) {
    if ((html.match(/metrika\/tag\.js/g) ?? []).length !== 1 || !html.includes(`const counterId = ${site.analytics.yandexId};`)) errors.push(`Missing or duplicate approved Metrika counter: ${path}`);
    if (!html.includes('data-cookie-notice') || !html.includes('data-cookie-accept') || !html.includes('data-cookie-decline')) errors.push(`Missing explicit consent controls: ${path}`);
    if (!html.includes('startAnalytics(choice)') || !html.includes('location.hostname !== publicHostname')) errors.push(`Missing consent/host analytics guard: ${path}`);
  } else if (/mc\.yandex\.ru/.test(html)) errors.push(`Unapproved Metrika counter: ${path}`);
  if (/mc\.yandex\.ru\/watch\/|clarity\.ms/i.test(html)) errors.push(`Unconditional pixel or removed tracker found: ${path}`);
  // Pages closed from indexing carry noindex instead of a canonical.
  if (!isPrivatePage) {
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)
      ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    if (!canonical || !canonical[1].startsWith(canonicalPrefix)) {
      errors.push(`Missing/incorrect canonical: ${path}`);
    }
  }
  const expectCrumbs = !isPrivatePage && path !== 'index.html';
  const hasCrumbs = /<nav class="breadcrumbs"/i.test(html);
  if (expectCrumbs !== hasCrumbs) errors.push(`Breadcrumbs ${hasCrumbs ? 'rendered where they should not be' : 'missing'}: ${path}`);
  if (!site.search.indexingEnabled && !isNoindex) errors.push(`Global indexing lock missing: ${path}`);
  if (site.search.indexingEnabled && isNoindex && !pagePath.endsWith('404.html') && !hiddenPaths.includes(pagePath)) errors.push(`Page is noindex but not listed as closed: ${path}`);
  if (!isNoindex && hiddenPaths.includes(pagePath)) errors.push(`Closed page lost its noindex mark: ${path}`);
  const graphs = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const script of graphs) {
    const json = JSON.parse(script.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '').replace(/\\u003c/g, '<'));
    if (json['@type'] !== 'BreadcrumbList') continue;
    const items = json.itemListElement ?? [];
    const nav = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/i);
    if (!nav || items.length !== (nav[0].match(/<a\b/gi) ?? []).length + 1) errors.push(`BreadcrumbList does not match the visible trail: ${path}`);
    if (items[0]?.name !== 'Главная' || items[0]?.item !== 'https://agubanovv.ru/') errors.push(`Breadcrumb trail must start with the home page: ${path}`);
    items.forEach((item, index) => {
      if (item.position !== index + 1) errors.push(`Breadcrumb position drift: ${path}`);
      const isLast = index === items.length - 1;
      if (isLast === Boolean(item.item)) errors.push(`Breadcrumb link handling is wrong: ${path} -> ${item.name}`);
      if (item.item && !item.item.startsWith(canonicalPrefix)) errors.push(`Breadcrumb URL outside the approved domain: ${path} -> ${item.item}`);
    });
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
if (!/^User-agent: \*$/m.test(robots)) errors.push('robots.txt has no universal group');
if (!/^User-agent: Yandex$/m.test(robots)) errors.push('robots.txt has no Yandex group');
for (const cancelled of ['Host:', 'Noindex:', 'Crawl-delay:']) {
  if (robots.includes(cancelled)) errors.push(`robots.txt uses the unsupported directive ${cancelled}`);
}
const cleanParams = [...robots.matchAll(/^Clean-param: (\S+) (\/\S*)$/gm)];
if (!cleanParams.length) errors.push('robots.txt has no Clean-param for Yandex');
const ignored = new Set(cleanParams.flatMap(([, params]) => params.split('&')));
for (const required of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'msclkid', 'fbclid', 'yclid']) {
  if (!ignored.has(required)) errors.push(`Clean-param does not ignore ${required}`);
}
for (const [, params] of cleanParams) {
  if (params.length > 500) errors.push(`Clean-param exceeds the 500 character limit: ${params.slice(0, 40)}…`);
  for (const name of params.split('&')) if (!/^[a-z0-9_-]+$/.test(name)) errors.push(`Clean-param name is not a lowercase token: ${name}`);
}
const yandexFile = await readFile(new URL('robots-yandex.txt', dist), 'utf8');
if (!robots.includes(yandexFile.split('\n\n').at(-2))) errors.push('robots-yandex.txt drifts from the Yandex group in robots.txt');
for (const path of site.search.indexingEnabled ? hiddenPaths : []) {
  if (countMatches(robots, `Disallow: /${path}`) !== 2) errors.push(`Closed page is not disallowed in both robot groups: /${path}`);
  if (countMatches(yandexFile, `Disallow: /${path}`) !== 1) errors.push(`Closed page is missing from the Yandex file: /${path}`);
}

// Publication dates must come from the content, never from the build clock.
const sourceDates = new Set([site.legal.updated]);
for (const collection of ['blog']) {
  for (const name of await readdir(new URL(`../src/content/${collection}/`, import.meta.url))) {
    if (!name.endsWith('.md')) continue;
    const block = await readFile(new URL(`../src/content/${collection}/${name}`, import.meta.url), 'utf8');
    for (const match of block.matchAll(/^(?:date|updated):\s*"?(\d{4}-\d{2}-\d{2})"?/gm)) sourceDates.add(match[1]);
  }
}

const sitemapPart = await readFile(new URL('sitemap-0.xml', dist), 'utf8');
const entries = [...sitemapPart.matchAll(/<url>([\s\S]*?)<\/url>/g)];
if (!site.search.indexingEnabled && entries.length) errors.push('Disabled indexing must have an empty sitemap');
if (!site.search.indexingEnabled && /^Disallow:/m.test(robots)) errors.push('Crawlers must be able to read the global noindex');
if (site.search.indexingEnabled && entries.length < 7) errors.push(`Sitemap lost pages: ${entries.length} URLs`);
for (const path of hiddenPaths) {
  if (sitemapPart.includes(`<loc>${canonicalPrefix}${path}</loc>`)) errors.push(`Closed page is still in the sitemap: /${path}`);
}
for (const [, body] of entries) {
  const loc = body.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
  if (!loc.startsWith(canonicalPrefix)) errors.push(`Sitemap URL outside the approved domain: ${loc}`);
  if (!/<priority>/.test(body)) errors.push(`Sitemap URL without priority: ${loc}`);
  const lastmod = body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (!lastmod) continue;
  if (!sourceDates.has(lastmod.slice(0, 10))) errors.push(`Sitemap lastmod is not a real publication date: ${loc} -> ${lastmod}`);
  if (Date.parse(lastmod) > Date.now() + 86_400_000) errors.push(`Sitemap lastmod is in the future: ${loc} -> ${lastmod}`);
}

const sitemap = await exists('sitemap.xml') ? await readFile(new URL('sitemap.xml', dist), 'utf8') : '';
if (sitemap !== sitemapPart) errors.push('sitemap.xml is not the page list of this build');
if (!sitemap.includes('<urlset')) errors.push('sitemap.xml must list the pages themselves, not an index of files');

const indexedPages = [];
for (const page of await walk(dist)) {
  const path = page.pathname.split('/dist/').at(-1) ?? page.pathname;
  if (path.endsWith('404.html')) continue;
  if (/<meta\b[^>]*name="robots"[^>]*content="noindex/i.test(await readFile(page, 'utf8'))) continue;
  indexedPages.push(path.replace(/index\.html$/, ''));
}
for (const path of indexedPages) {
  if (!sitemap.includes(`<loc>${canonicalPrefix}${path}</loc>`)) errors.push(`Indexed page is missing from the sitemap: /${path}`);
}

if (await exists('sitemap-index.xml')) {
  for (const match of (await readFile(new URL('sitemap-index.xml', dist), 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!match[1].startsWith(canonicalPrefix) || !await exists(match[1].slice(canonicalPrefix.length))) errors.push(`Broken sitemap reference: ${match[1]}`);
  }
}
if (!await exists('CNAME') || (await readFile(new URL('CNAME', dist), 'utf8')).trim() !== new URL(canonicalPrefix).hostname) errors.push('CNAME does not match the approved custom domain');
for (const name of await readdir(dist)) {
  if (/^\.env|\.(pem|key|p12|pfx)$/i.test(name)) errors.push(`Sensitive file in dist: ${name}`);
}

if (errors.length) {
  console.error('Static site checks failed:\n' + errors.map(e => '- ' + e).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Static site smoke checks passed.');
}
