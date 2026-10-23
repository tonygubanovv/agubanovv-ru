import Typograf from 'typograf';
import { parse, serialize, type DefaultTreeAdapterMap } from 'parse5';
import { applyBlocks } from './blocks.ts';

const formatter = new Typograf({ locale: ['ru', 'en-US'] });
// Inline markup stays in context, so quotes and short words work across emphasis/links.
// Typograf already protects code, pre, kbd, samp, script, style and URLs.
formatter.addSafeTag(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi);
formatter.addSafeTag(/<math\b[^>]*>[\s\S]*?<\/math>/gi);
formatter.addSafeTag(/<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi);

export const typograph = (text: string): string => formatter.execute(text);

const readableAttributes = new Set(['alt', 'title', 'aria-label', 'aria-description', 'placeholder']);
const metadata = new Set(['description', 'keywords', 'og:title', 'og:description', 'og:site_name', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']);
const jsonTextKeys = new Set(['name', 'headline', 'description', 'articleBody', 'caption']);
function formatJson(value: unknown, key = ''): unknown {
  if (typeof value === 'string') return jsonTextKeys.has(key) ? typograph(value) : value;
  if (Array.isArray(value)) return value.map(item => formatJson(item, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, formatJson(item, name)]));
  return value;
}

/** Runs during prerender and dev; no typography library is sent to the browser. */
export function typographHtml(html: string, contacts: Record<string, string> = {}, siteOrigin?: string): string {
  const document = parse(html);
  // Link attributes must also be updated inside publications whose wording is kept verbatim.
  function prepareLinks(node: DefaultTreeAdapterMap['node']): void {
    if ('tagName' in node && node.tagName === 'a') {
      const href = node.attrs.find(attr => attr.name === 'href');
      if (href?.value.startsWith('contact:')) {
        const key = href.value.slice('contact:'.length);
        const target = contacts[key];
        if (!target || !/^(https:\/\/|mailto:)/.test(target)) throw new Error(`Contact "${key}" must be configured in src/config/site.ts before publishing.`);
        href.value = target;
      }
      if (siteOrigin && href && /^(https?:)?\/\//i.test(href.value)) {
        const target = new URL(href.value, siteOrigin);
        if (target.origin !== new URL(siteOrigin).origin) {
          const set = (name: string, value: string) => {
            const attr = node.attrs.find(attr => attr.name === name);
            if (attr) attr.value = value;
            else node.attrs.push({ name, value });
          };
          const rel = node.attrs.find(attr => attr.name === 'rel')?.value.split(/\s+/).filter(Boolean) ?? [];
          set('target', '_blank');
          set('rel', [...new Set([...rel, 'noopener', 'noreferrer'])].join(' '));
        }
      }
    }
    if ('childNodes' in node) node.childNodes.forEach(prepareLinks);
  }
  prepareLinks(document);
  // Shortcodes become cards first, so their wording still goes through the formatter below.
  applyBlocks(document);
  const preserved: string[] = [];
  function visit(node: DefaultTreeAdapterMap['node']): void {
    if ('tagName' in node) {
      const attribute = (name: string) => node.attrs.find(item => item.name === name)?.value;
      // Explicit author request: keep imported wording, punctuation and spacing verbatim.
      if (attribute('data-preserve-text') === 'true') {
        const index = preserved.push(serialize(node)) - 1;
        node.childNodes = [{ nodeName: '#text', value: `\uE000KEEP${index}\uE001`, parentNode: node }];
        return;
      }
      if (node.tagName === 'script' && attribute('type') === 'application/ld+json') {
        for (const child of node.childNodes) {
          if (child.nodeName === '#text' && 'value' in child) child.value = JSON.stringify(formatJson(JSON.parse(child.value))).replace(/</g, '\\u003c');
        }
      }
      if (['pre', 'code', 'kbd', 'samp', 'script', 'style', 'svg', 'math', 'textarea'].includes(node.tagName)) return;
      for (const attr of node.attrs) {
        if (node.tagName === 'a' && attr.name === 'href' && attr.value.startsWith('mailto:')) {
          node.childNodes = [{ nodeName: '#text', value: decodeURIComponent(attr.value.slice(7).split('?')[0]!), parentNode: node }];
        }
        if (readableAttributes.has(attr.name) || (node.tagName === 'meta' && attr.name === 'content' && metadata.has(attribute('name') ?? attribute('property') ?? ''))) attr.value = typograph(attr.value);
      }
    }
    if ('childNodes' in node) node.childNodes.forEach(visit);
  }
  visit(document);
  return typograph(serialize(document)).replace(/\uE000KEEP(\d+)\uE001/g, (_token, index: string) => preserved[Number(index)]!);
}
