/**
 * Превью админки собирается marked-ом, а сайт — remark/rehype, поэтому
 * структурные обёртки (таблица в .table-wrap, картинка с title в figure)
 * приходится добавлять и здесь. Правила те же, что в src/lib/prose-plugin.ts.
 */

const TABLE = /<table[\s\S]*?<\/table>/g;
const CAPTIONED_IMG =
  /<img\b[^>]*?\bsrc="([^"]+)"[^>]*?\balt="([^"]*)"[^>]*?\btitle="([^"]*)"[^>]*?\/?>/g;

/** marked сноски не понимает, поэтому размечаем их по исходному markdown. */
export function previewFootnotes(source: string) {
  const blocks = source.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  let changed = false;

  const body = blocks
    .map((part, index) => {
      if (index % 2 === 1) return part;
      const defs = new Map<string, string>();
      const text = part.replace(/^\[\^([^\]^]+)\]:[ \t]+(.*)$/gm, (_match, id: string, value: string) => {
        defs.set(id, value.trim());
        changed = true;
        return '';
      });
      if (!defs.size) return part;

      const order: string[] = [];
      const withRefs = text.replace(/\[\^([^\]^]+)\]/g, (match, id: string) => {
        if (!defs.has(id)) return match;
        let number = order.indexOf(id) + 1;
        if (!number) {
          order.push(id);
          number = order.length;
        }
        return `<sup><a href="#preview-fn-${number}" id="preview-fnref-${number}" data-footnote-ref>${number}</a></sup>`;
      });

      const list = order
        .map(
          (id, i) =>
            `<li id="preview-fn-${i + 1}"><p>${defs.get(id)}<a href="#preview-fnref-${i + 1}" aria-label="К сноске ${i + 1}" data-footnote-backref>↩</a></p></li>`,
        )
        .join('');
      // Так же, как в собранном материале: имя секции несёт aria-label, заголовка нет.
      return `${withRefs}\n\n<section data-footnotes class="footnotes" aria-label="Примечания"><ol>${list}</ol></section>\n`;
    })
    .join('');

  return changed ? body.replace(/\n{3,}/g, '\n\n') : source;
}

export function decoratePreviewHtml(html: string) {
  let out = html.replace(
    CAPTIONED_IMG,
    (_match, src: string, alt: string, title: string) =>
      `<figure class="prose-figure"><img src="${src}" alt="${alt}"><figcaption>${title}</figcaption></figure>`,
  );

  // Картинка в markdown пишется как title="…", marked кладёт атрибут на img.
  out = out.replace(
    /<p>(<figure class="prose-figure">[\s\S]*?<\/figure>)<\/p>/g,
    (_match, figure: string) => figure,
  );

  return out.replace(TABLE, (table) => `<div class="table-wrap">${table}</div>`);
}
