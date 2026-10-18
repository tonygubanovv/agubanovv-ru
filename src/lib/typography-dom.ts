import { typesetText, type TypesetOptions } from './typography';

const SKIP = new Set(['code', 'pre', 'script', 'style', 'textarea', 'svg', 'kbd', 'samp', 'var']);

/**
 * Авто-типограф для уже готового HTML (превью в админке). Тот же алгоритм,
 * что и на сборке, поэтому «как в редакторе» = «как на сайте».
 */
export function typesetHtml(html: string, options: TypesetOptions = {}) {
  const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
  const root = doc.getElementById('r');
  if (!root) return html;

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = typesetText(node.nodeValue ?? '', options);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (SKIP.has(el.tagName.toLowerCase()) || el.hasAttribute('data-notypeset')) return;
    el.childNodes.forEach(walk);
  };

  walk(root);
  return root.innerHTML;
}
