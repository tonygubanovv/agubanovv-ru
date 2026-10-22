import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];
type Child = Element['childNodes'][number];

/**
 * Blocks the owner writes in Markdown without HTML, inside an article:
 *   :::цитата Автор, роль         → a quote card on the plain surface (also :::quote)
 *   :::цитата-акцент Автор, роль  → the same card filled with the accent colour (also :::quote-accent)
 *   :::заметка                    → a note card, text only (also :::note)
 * Blank lines around the markers are optional: without them Markdown joins the marker and the text into one paragraph.
 * A marker with no closing ::: stays on the page as the text he wrote instead of swallowing the article.
 */
type Kind = 'quote' | 'accent' | 'note';
const KINDS: Record<string, Kind> = { quote: 'quote', цитата: 'quote', 'quote-accent': 'accent', 'цитата-акцент': 'accent', note: 'note', заметка: 'note' };
const MARKER = /^:::\s*(?:(\S+)(?:[ \t]+(.*))?)?$/iu;

type Item = { block: { kind: Kind; rest: string; raw: string } } | { end: true } | { node: Child };

const attribute = (node: Node, name: string) => 'attrs' in node ? node.attrs.find(item => item.name === name)?.value : undefined;
const isTag = (node: Node, tagName: string): node is Element => 'tagName' in node && node.tagName === tagName;
const visible = (node: Node) => !('value' in node) || node.value.trim() !== '';

/** The parent is corrected by move(), which is what actually attaches the node. */
const textNode = (value: string, parent: Element): DefaultTreeAdapterMap['textNode'] => ({ nodeName: '#text', value, parentNode: parent });

function shell(html: string): Element {
  const [node] = parseFragment(html).childNodes;
  if (!node || !('tagName' in node)) throw new Error(`Broken block template: ${html}`);
  return node;
}

function move(target: Element, nodes: Child[]): Element {
  for (const node of nodes) {
    (node as { parentNode?: Element }).parentNode = target;
    target.childNodes.push(node);
  }
  return target;
}

const labelled = (tagName: string, className: string, value: string): Element => {
  const node = shell(className ? `<${tagName} class="${className}"></${tagName}>` : `<${tagName}></${tagName}>`);
  return move(node, [textNode(value, node)]);
};

function quoteCard(inner: Child[], rest: string, accent: boolean): Element {
  const card = shell(accent ? '<blockquote class="quote accent"></blockquote>' : '<blockquote class="quote"></blockquote>');
  move(card, inner);
  const comma = rest.indexOf(',');
  const name = (comma === -1 ? rest : rest.slice(0, comma)).trim();
  const role = comma === -1 ? '' : rest.slice(comma + 1).trim();
  if (!name) return card;
  const by = move(shell('<footer class="quote-by"></footer>'), [labelled('span', 'quote-name', name)]);
  if (role) move(by, [textNode('\n', by), labelled('span', 'quote-role', role)]);
  return move(card, [textNode('\n', card), by]);
}

function noteCard(inner: Child[], rest: string): Element {
  const card = shell('<aside class="note"><span class="note-mark" aria-hidden="true"></span><div class="note-body"></div></aside>');
  const body = card.childNodes[1] as Element;
  // A note has no heading of its own: any words left on the marker line stay ordinary text.
  if (rest.trim()) move(body, [labelled('p', '', rest.trim())]);
  move(body, inner);
  return card;
}

/** Cuts a paragraph at its marker lines, so a block can start straight under ::: without a blank line. */
function itemsOf(source: Element): Item[] {
  const items: Item[] = [];
  let inline: Child[] = [];
  const flush = () => {
    // Whitespace between the lines stays: it is the only separator between sentences written on different lines.
    while (inline.length && !visible(inline[0]!)) inline.shift();
    while (inline.length && !visible(inline.at(-1)!)) inline.pop();
    if (inline.some(visible)) items.push({ node: move(shell('<p></p>'), inline) });
    inline = [];
  };
  for (const child of source.childNodes) {
    if (!('value' in child)) {
      inline.push(child);
      continue;
    }
    for (const [position, line] of child.value.split('\n').entries()) {
      if (position) inline.push(textNode('\n', source));
      const match = MARKER.exec(line.trim());
      const kind = match?.[1] ? KINDS[match[1].toLowerCase()] : undefined;
      if (match && !match[1]) {
        flush();
        items.push({ end: true });
      } else if (match && kind) {
        flush();
        items.push({ block: { kind, rest: match[2] ?? '', raw: line.trim() } });
      } else if (line) inline.push(textNode(line, source));
    }
  }
  flush();
  return items;
}

function captionOf(node: Node | undefined): Child[] | null {
  if (!node || !isTag(node, 'p')) return null;
  const [child, ...rest] = node.childNodes.filter(visible);
  if (!child || !isTag(child, 'em') || rest.length) return null;
  return child.childNodes.filter(visible);
}

function figures(children: Child[]): void {
  for (let index = 0; index < children.length; index++) {
    const holder = children[index]!;
    if (!isTag(holder, 'p')) continue;
    const [image, ...rest] = holder.childNodes.filter(visible);
    if (!image || !isTag(image, 'img') || rest.length) continue;
    // The caption is the next element, whatever whitespace the renderer left between them.
    const next = children.findIndex((child, position) => position > index && visible(child));
    const following = next > index ? captionOf(children[next]) : null;
    const title = attribute(image, 'title');
    if (!following && !title) continue;
    if (title) image.attrs = image.attrs.filter(item => item.name !== 'title');
    const figure = shell('<figure></figure>');
    const caption = shell('<figcaption></figcaption>');
    move(caption, following ?? [textNode(title!, caption)]);
    move(figure, [image, textNode('\n', figure), caption]);
    children.splice(index, following ? next - index + 1 : 1, figure);
  }
}

function transform(prose: Element): void {
  const items = prose.childNodes.flatMap(child => (isTag(child, 'p') ? itemsOf(child) : [{ node: child }]));
  const result: Child[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    if (!('block' in item)) {
      if ('node' in item) result.push(item.node);
      continue;
    }
    const inner: Child[] = [];
    let cursor = index;
    let closed = false;
    while (++cursor < items.length) {
      const next = items[cursor]!;
      if ('end' in next) {
        closed = true;
        break;
      }
      if ('block' in next) break;
      if ('node' in next) inner.push(next.node);
    }
    result.push(closed
      ? item.block.kind === 'note' ? noteCard(inner, item.block.rest) : quoteCard(inner, item.block.rest, item.block.kind === 'accent')
      : labelled('p', '', item.block.raw));
    if (closed) index = cursor;
  }
  const children = prose.childNodes;
  children.length = 0;
  children.push(...result);
  figures(children);
}

function walk(node: Node): void {
  if (!('childNodes' in node)) return;
  if ('tagName' in node && ['pre', 'code', 'script', 'style', 'svg'].includes(node.tagName)) return;
  if ('tagName' in node && (attribute(node, 'class') ?? '').split(/\s+/).includes('prose')) transform(node);
  else for (const child of [...node.childNodes]) walk(child);
}

/** Rewrites the owner's block markers in the parsed page. Runs before typography so their wording is formatted too. */
export const applyBlocks = (root: Node): void => walk(root);
