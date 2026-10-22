import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];
type Child = Element['childNodes'][number];

/**
 * Blocks the owner writes in Markdown without HTML, inside an article:
 *   :::цитата Автор, роль         → a quote card on the plain surface (also :::quote)
 *   :::цитата-акцент Автор, роль  → the same card filled with the accent colour (also :::quote-accent)
 *   :::заметка                    → a note card, text only (also :::note)
 *   UTM{{расшифровка метки}}      → the word before the marker gets a hidden note card
 * Blank lines around the markers are optional: without them Markdown joins the marker and the text into one paragraph.
 * A marker with no closing ::: stays on the page as the text he wrote instead of swallowing the article.
 */
type Kind = 'quote' | 'accent' | 'note';
const KINDS: Record<string, Kind> = { quote: 'quote', цитата: 'quote', 'quote-accent': 'accent', 'цитата-акцент': 'accent', note: 'note', заметка: 'note' };
const MARKER = /^:::\s*(?:(\S+)(?:[ \t]+(.*))?)?$/iu;

/* The inline marker: two braces hold the hidden text, the word right before them is the visible hint.
   Trailing punctuation stays outside the hint, so «термин.{{…}}» underlines the word and not the dot. */
const TIP = /\{\{([^{}]*)\}\}/gu;
const TIP_WORD = /([^\s.,;:!?)\]]+)([.,;:!?)\]]*)$/u;
const TIP_HOST = new Set(['strong', 'em', 'b', 'i', 'code', 'dfn', 'abbr', 'span']);
/* Nothing inside these is marked: code keeps its own text, links stay clickable as they are,
   and a heading would repeat the marker in the contents, where only its plain words belong. */
const TIP_SKIP = new Set(['pre', 'code', 'script', 'style', 'svg', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

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

const setAttr = (node: Element, name: string, value: string): void => {
  const found = node.attrs.find(item => item.name === name);
  if (found) found.value = value;
  else node.attrs.push({ name, value });
};

const asTerm = (node: Element, id: string): Element => {
  setAttr(node, 'tabindex', '0');
  setAttr(node, 'aria-describedby', id);
  setAttr(node, 'class', `${attribute(node, 'class') ?? ''} tip-term`.trim());
  return node;
};

/** The card and the little pointer hang off the word, so the line itself never moves. */
function tipCard(id: string, hidden: string, term: Element): Element {
  const wrap = shell('<span class="tip"></span>');
  const bubble = shell(`<span class="tip-bubble" role="tooltip" id="${id}"></span>`);
  move(bubble, [textNode(hidden, bubble)]);
  return move(wrap, [term, bubble, shell('<span class="tip-caret" aria-hidden="true"></span>')]);
}

let tipSeq = 0;

/** Rewrites one text node: every whole marker turns the word before it into a hint with a hidden card. */
function tipsInText(parent: Element, node: DefaultTreeAdapterMap['textNode']): number {
  if (!node.value.includes('{{')) return 0;
  let at = parent.childNodes.indexOf(node);
  const out: Child[] = [];
  let made = 0;
  let cursor = 0;
  TIP.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TIP.exec(node.value))) {
    const hidden = match[1].trim();
    const before = node.value.slice(cursor, match.index);
    const word = TIP_WORD.exec(before);
    if (hidden && word?.[1]) {
      const id = `tip-${++tipSeq}`;
      if (word.index) out.push(textNode(before.slice(0, word.index), parent));
      out.push(tipCard(id, hidden, asTerm(labelled('span', '', word[1]), id)));
      // The dot or comma after the word is not part of the hint, so it stays in the sentence.
      if (word[2]) out.push(textNode(word[2], parent));
      cursor = match.index + match[0].length;
      made++;
      continue;
    }
    // **термин**{{пояснение}}: the marker sits straight after a marked-up word, so that word becomes the hint.
    if (!hidden || made || before.trim()) continue;
    const previous = parent.childNodes[at - 1];
    if (!previous || !('tagName' in previous) || !TIP_HOST.has(previous.tagName)) continue;
    const id = `tip-${++tipSeq}`;
    parent.childNodes.splice(at - 1, 1);
    at--;
    if (before) out.push(textNode(before, parent));
    out.push(tipCard(id, hidden, asTerm(previous, id)));
    cursor = match.index + match[0].length;
    made++;
  }
  if (!made) return 0;
  const tail = node.value.slice(cursor);
  parent.childNodes.splice(at, 1, ...out, ...(tail ? [textNode(tail, parent)] : []));
  return made;
}

function inlineTips(node: Element): number {
  let made = 0;
  for (const child of [...node.childNodes]) {
    if ('value' in child) made += tipsInText(node, child);
    else if ('tagName' in child && !TIP_SKIP.has(child.tagName)) made += inlineTips(child);
  }
  return made;
}

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

function transform(prose: Element): number {
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
  return inlineTips(prose);
}

function walk(node: Node): number {
  if (!('childNodes' in node)) return 0;
  if ('tagName' in node && ['pre', 'code', 'script', 'style', 'svg'].includes(node.tagName)) return 0;
  if ('tagName' in node && (attribute(node, 'class') ?? '').split(/\s+/).includes('prose')) return transform(node);
  return [...node.childNodes].reduce((made, child) => made + walk(child), 0);
}

/** Touch has no hover, so a tap opens the card and the script keeps it inside the screen. Shipped only on pages that use the marker. */
const TIP_SCRIPT = `(function () {
  var tips = [].slice.call(document.querySelectorAll('.tip'));
  var edge = 8;
  function close() { tips.forEach(function (tip) { tip.removeAttribute('data-tip-open'); }); }
  function place(tip) {
    var bubble = tip.querySelector('.tip-bubble');
    bubble.style.removeProperty('--tip-shift');
    tip.removeAttribute('data-tip-below');
    var box = bubble.getBoundingClientRect();
    // A card that is not on the screen yet has no box: there is nothing to keep inside it.
    if (!box.width) return;
    // The content box, not window.innerWidth: a scrollbar takes width that the page cannot paint into.
    var width = document.documentElement.clientWidth;
    var shift = edge > box.left ? edge - box.left : 0;
    if (width - edge < box.right) shift = width - edge - box.right;
    if (shift) bubble.style.setProperty('--tip-shift', Math.round(shift) + 'px');
    if (edge > box.top) tip.setAttribute('data-tip-below', 'true');
  }
  tips.forEach(function (tip) {
    tip.addEventListener('pointerenter', function () { place(tip); });
    tip.addEventListener('focusin', function () { place(tip); });
    tip.addEventListener('click', function (event) {
      event.preventDefault();
      var opened = tip.hasAttribute('data-tip-open');
      close();
      if (!opened) { tip.setAttribute('data-tip-open', 'true'); place(tip); }
    });
  });
  document.addEventListener('click', function (event) {
    if (event.target instanceof Element && !event.target.closest('.tip')) close();
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
})();`;

function findByTag(node: Node, tagName: string): Element | null {
  if (isTag(node, tagName)) return node;
  if (!('childNodes' in node)) return null;
  for (const child of node.childNodes) {
    const found = findByTag(child, tagName);
    if (found) return found;
  }
  return null;
}

/** Rewrites the owner's block markers in the parsed page. Runs before typography so their wording is formatted too. */
export const applyBlocks = (root: Node): void => {
  tipSeq = 0;
  if (walk(root) === 0) return;
  const body = findByTag(root, 'body');
  if (body) move(body, [textNode('\n', body), shell(`<script>${TIP_SCRIPT}</script>`)]);
};
