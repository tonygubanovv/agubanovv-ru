import { typesetText } from './typography';

/**
 * Редакционный набор директив (markdown-шорткаты) для блога, кейсов и любых
 * других страниц. Один и тот же набор использует сайт (через remark) и
 * предпросмотр админки (через calloutsToHtml), поэтому текст в них совпадает.
 *
 * Синтаксис контейнера — только такой (пробел после имени директивой не считается):
 *
 *     :::note[Заголовок]
 *     текст
 *     :::
 *
 * Заголовок также можно задать атрибутом: :::note{title="Заголовок"}.
 * Inline-директивы: :mark[важное].
 */

type MdastNode = {
  type: string;
  name?: string;
  value?: string;
  attributes?: Record<string, string | null>;
  children?: MdastNode[];
  position?: {
    start?: { line?: number; column?: number };
    end?: { line?: number; column?: number };
  };
};

export type CalloutKind = 'note' | 'warn' | 'takeaway' | 'steps' | 'details' | 'quote';

type KindMeta = {
  /** Класс, который ждёт global.css @layer prose. */
  cls: string;
  /** Заголовок по умолчанию; null — заголовка нет, если автор его не указал. */
  title: string | null;
};

export const CALLOUT_KINDS: Record<CalloutKind, KindMeta> = {
  note: { cls: 'callout callout-note', title: 'Заметка' },
  warn: { cls: 'callout callout-warn', title: 'Осторожно' },
  takeaway: { cls: 'callout callout-takeaway', title: 'Вывод' },
  steps: { cls: 'callout callout-steps', title: 'Шаги' },
  details: { cls: 'callout callout-details', title: 'Подробнее' },
  quote: { cls: 'pull-quote', title: null },
};

const KIND_NAMES = Object.keys(CALLOUT_KINDS) as CalloutKind[];

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}

function textOf(node: MdastNode | undefined): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(textOf).join('').trim();
}

/** Есть ли у контейнера заголовок: атрибут title/label или строка на линии fences. */
function readTitle(node: MdastNode, meta: KindMeta) {
  const attribute = node.attributes?.title ?? node.attributes?.label;
  const children = node.children ?? [];
  const first = children[0];
  const onFenceLine =
    !!first &&
    first.type === 'paragraph' &&
    !!first.position?.start?.line &&
    first.position.start.line === node.position?.start?.line;

  if (typeof attribute === 'string' && attribute.trim()) {
    return { title: attribute.trim(), children };
  }
  if (onFenceLine && first) {
    const title = textOf(first.children?.[0] ?? first);
    if (title) return { title, children: children.slice(1) };
  }
  return { title: meta.title, children };
}

function shell(kind: CalloutKind, title: string | null, inner: MdastNode[]): MdastNode[] {
  const meta = CALLOUT_KINDS[kind];
  const typeset = (value: string) => escapeHtml(typesetText(value));
  const open: string[] = [];
  const close: string[] = [];

  if (kind === 'quote') {
    open.push(`<blockquote class="${meta.cls}">`);
    if (title) close.push(`<footer class="pull-quote-attribution">${typeset(title)}</footer>`);
    close.push('</blockquote>');
    return [{ type: 'html', value: open.join('') }, ...inner, { type: 'html', value: close.join('') }];
  }

  if (kind === 'details') {
    open.push(`<details class="${meta.cls}">`);
    open.push(`<summary class="callout-title">${typeset(title ?? meta.title ?? '')}</summary>`);
    close.push('</details>');
    return [{ type: 'html', value: open.join('') }, ...inner, { type: 'html', value: close.join('') }];
  }

  open.push(`<div class="${meta.cls}">`);
  if (title) open.push(`<p class="callout-title">${typeset(title)}</p>`);
  close.push('</div>');
  return [{ type: 'html', value: open.join('') }, ...inner, { type: 'html', value: close.join('') }];
}

function fail(file: string | undefined, node: MdastNode, message: string): never {
  const line = node.position?.start?.line ?? '?';
  throw new Error(`[prose] ${file ?? 'markdown'}, строка ${line}: ${message}`);
}

function transform(nodes: MdastNode[], file?: string): MdastNode[] {
  const out: MdastNode[] = [];
  for (const node of nodes) {
    if (node.type === 'containerDirective' || node.type === 'leafDirective') {
      const kind = node.name as CalloutKind | undefined;
      if (!kind || !CALLOUT_KINDS[kind]) {
        fail(file, node, `неизвестная директива ":::${node.name ?? ''}". Разрешены: ${KIND_NAMES.join(', ')}.`);
      }
      const { title, children } = readTitle(node, CALLOUT_KINDS[kind]);
      out.push(...shell(kind, title, transform(children, file)));
      continue;
    }
    if (node.type === 'textDirective') {
      if (node.name !== 'mark') {
        fail(
          file,
          node,
          `неизвестная inline-директива ":${node.name ?? ''}". Разрешена только :mark[важное].`,
        );
      }
      const body = (node.children ?? [])
        .map((child) => (typeof child.value === 'string' ? typesetText(child.value) : ''))
        .join('');
      out.push({ type: 'html', value: `<mark class="inline-mark">${escapeHtml(body)}</mark>` });
      continue;
    }
    if (node.children) node.children = transform(node.children, file);
    out.push(node);
  }
  return out;
}

export function remarkCallouts() {
  return (tree: { children: MdastNode[] }, file?: { history?: string[]; path?: string }) => {
    const name = file?.history?.[0] ?? file?.path;
    tree.children = transform(tree.children, name);
  };
}

/**
 * Вне блоков ``` и строчного кода `…` — чтобы директивы не подменяли примеры.
 */
function outsideCode(source: string, edit: (text: string) => string) {
  return source
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g)
    .map((part, index) => (index % 2 === 1 ? part : edit(part)))
    .join('');
}

const INLINE_MARK = /:mark\[([^\]\n]+)\]/g;

/**
 * Тот же набор для предпросмотра в админке: markdown уже собран в строку,
 * размечаете вы её сами, поэтому вложенные контейнеры не поддерживаются.
 */
export function calloutsToHtml(source: string) {
  const containers = source.replace(
    /^:::([a-z-]+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?[ \t]*\r?\n([\s\S]*?)^:::[ \t]*$/gim,
    (match, rawKind: string, bracket: string = '', attrTitle: string = '', body: string) => {
      const kind = rawKind as CalloutKind;
      const meta = CALLOUT_KINDS[kind];
      if (!meta) return match;
      const lines = body.replace(/\r/g, '').split('\n');
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
      const title = (bracket || attrTitle || meta.title || '').trim();
      if (kind === 'quote') {
        const footer = title ? `<footer class="pull-quote-attribution">${title}</footer>` : '';
        return `<blockquote class="${meta.cls}">\n\n${lines.join('\n')}\n\n${footer}</blockquote>`;
      }
      if (kind === 'details') {
        return `<details class="${meta.cls}"><summary class="callout-title">${title}</summary>\n\n${lines.join(
          '\n',
        )}\n\n</details>`;
      }
      const heading = title ? `<p class="callout-title">${title}</p>` : '';
      return `<div class="${meta.cls}">${heading}\n\n${lines.join('\n')}\n\n</div>`;
    },
  );

  return outsideCode(containers, (text) => text.replace(INLINE_MARK, '<mark class="inline-mark">$1</mark>'));
}

/** Список директив для подсказок админки и для валидатора контента. */
export const directiveCheatSheet: ReadonlyArray<{ syntax: string; what: string }> = [
  { syntax: ':::note[Заголовок]', what: 'пояснение или определение' },
  { syntax: ':::warn[Заголовок]', what: 'частая ошибка, риск' },
  { syntax: ':::takeaway[Вывод]', what: 'главная мысль блока' },
  { syntax: ':::steps[Как считаем]', what: 'пронумерованный порядок шагов' },
  { syntax: ':::details[Что под капотом]', what: 'сворачиваемый блок' },
  { syntax: ':::quote[Автор]', what: 'выносная цитата' },
  { syntax: ':mark[важное]', what: 'выделение прямо в тексте' },
];
