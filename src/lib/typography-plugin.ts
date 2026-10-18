import { typesetText, type TypesetOptions } from './typography';

/**
 * rehype-плагин: пропускает весь markdown/MDX-вывод через авто-типограф.
 * Обходим hast вручную (без внешних зависимостей), пропускаем технические теги
 * и всё, что помечено data-notypeset.
 */
type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const SKIP = new Set(['code', 'pre', 'script', 'style', 'textarea', 'svg', 'kbd', 'samp', 'var']);

function walk(node: HastNode, options: TypesetOptions) {
  if (node.type === 'text' && typeof node.value === 'string') {
    node.value = typesetText(node.value, options);
    return;
  }
  if (node.type !== 'element' && node.type !== 'root') return;
  if (node.type === 'element') {
    const tag = (node.tagName ?? '').toLowerCase();
    if (SKIP.has(tag)) return;
    const props = node.properties ?? {};
    if (props.dataNotypeset !== undefined || props.notypeset !== undefined) return;
  }
  for (const child of node.children ?? []) walk(child, options);
}

export function typographer(options: TypesetOptions = {}) {
  return (tree: HastNode) => {
    walk(tree, options);
  };
}

export default typographer;
