/**
 * rehype-плагин редакционной вёрстки текста:
 *   · таблица → <div class="table-wrap"> (скролл по горизонтали на 360px);
 *   · ![alt](src "подпись") → <figure> + <figcaption>;
 *   · id заголовков → транслит-якоря из src/lib/slug.ts;
 *   · секция сносок: служебный заголовок заменён доступным именем, подписи
 *     обратных ссылок переведены.
 * Работает до авто-типографа, чтобы подпись картинки тоже получила его правила.
 *
 * После правки этого файла материал нужно пересобирать со сбросом кэша
 * content-layer (.astro/data-store.json у dev, node_modules/.astro/ — у
 * сборки): собранные .md пересобираются только когда изменился сам файл.
 * Для этого есть npm run predev / node scripts/clean-cache.mjs.
 */

import { headingSlugs } from './slug';

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const element = (tagName: string, className: string[], children: HastNode[]): HastNode => ({
  type: 'element',
  tagName,
  properties: className.length ? { className } : {},
  children,
});

const isBlankText = (node: HastNode) => node.type === 'text' && !String(node.value ?? '').trim();

/** Абзац, состоящий только из картинки с title, — это подпись, а не текст. */
function figureCandidate(node: HastNode): HastNode | null {
  if (node.type !== 'element' || node.tagName !== 'p') return null;
  const meaningful = (node.children ?? []).filter((child) => !isBlankText(child));
  if (meaningful.length !== 1) return null;
  const [img] = meaningful;
  if (img.type !== 'element' || img.tagName !== 'img') return null;
  const title = img.properties?.title;
  return typeof title === 'string' && title.trim() ? img : null;
}

function transform(children: HastNode[]): HastNode[] {
  const out: HastNode[] = [];

  for (const child of children) {
    if (child.type === 'element' && child.children) child.children = transform(child.children);

    if (child.type === 'element' && child.tagName === 'table') {
      out.push(element('div', ['table-wrap'], [child]));
      continue;
    }

    const img = figureCandidate(child);
    if (img) {
      const caption = String(img.properties?.title ?? '').trim();
      delete img.properties?.title;
      out.push(
        element('figure', ['prose-figure'], [
          img,
          element('figcaption', [], [{ type: 'text', value: caption }]),
        ]),
      );
      continue;
    }

    out.push(child);
  }

  return out;
}

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function textOf(node: HastNode): string {
  if (node.type === 'text') return String(node.value ?? '');
  return (node.children ?? []).map(textOf).join('');
}

/**
 * Секцию сносок генератор markdown отдаёт с заголовком «Footnotes». Он и
 * остался бы на английском, и попал бы в оглавление. Служебный заголовок
 * убираем, а имя секции отдаём через aria-label: для скринридера раздел всё
 * равно называется, обратные ссылки сносок переводим.
 */
function localizeGeneratorLabels(node: HastNode) {
  if (node.type === 'element') {
    const children = node.children ?? [];
    const label = children.findIndex(
      (child) => child.type === 'element' && child.tagName === 'h2' && textOf(child).trim() === 'Footnotes',
    );
    if (label !== -1) {
      node.children = children.filter((_, index) => index !== label);
      node.properties ??= {};
      node.properties.ariaLabel = 'Примечания';
    }

    const properties = node.properties ?? {};
    if (typeof properties.ariaLabel === 'string') {
      properties.ariaLabel = properties.ariaLabel.replace(/^Back to reference (\d+)$/, 'К сноске $1');
    }
  }
  for (const child of node.children ?? []) localizeGeneratorLabels(child);
}

/** Якоря считаем сами: slug() от Astro склеивает слова, если внутри уже стоит неразрывный пробел. */
function attachHeadingIds(tree: HastNode) {
  const found: HastNode[] = [];
  const collect = (node: HastNode) => {
    if (node.type === 'element' && HEADINGS.has(String(node.tagName))) found.push(node);
    for (const child of node.children ?? []) collect(child);
  };
  collect(tree);

  headingSlugs(found.map((node) => ({ text: textOf(node) }))).forEach((id, index) => {
    const node = found[index];
    node.properties ??= {};
    node.properties.id = id;
  });
}

export function proseStructure() {
  return (tree: HastNode) => {
    if (tree.type === 'root' && tree.children) tree.children = transform(tree.children);
    localizeGeneratorLabels(tree);
    attachHeadingIds(tree);
  };
}

export default proseStructure;
