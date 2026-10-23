export interface PageSeo { title: string; description: string; keywords: string }

/** The same small table reader is used by Astro and the output checks. */
export function parseSeoTable(source: string): Map<string, PageSeo> {
  const pages = new Map<string, PageSeo>();
  const lines = source.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().slice(1, -1).split('|').map(cell => cell.trim().replaceAll('&#124;', '|'));
    if (cells[0] === 'Адрес' || cells.every(cell => /^:?-+:?$/.test(cell))) continue;
    const [path, title, description, keywords] = cells;
    const fail = (reason: string): never => { throw new Error(`content/seo.md, строка ${index + 1}: ${reason}`); };
    if (!line.trim().endsWith('|') || cells.length !== 4) fail('нужны ровно четыре ячейки; символ | внутри текста замените на &#124;');
    if (!path || !/^\/(?:[a-z0-9-]+\/)*(?:404\.html)?$/.test(path)) fail('укажите адрес от /, со слэшем в конце (кроме /404.html)');
    if (!title || !description) fail('Title и Description не могут быть пустыми');
    if (pages.has(path!)) fail(`адрес ${path} повторяется`);
    pages.set(path!, { title: title!, description: description!, keywords: keywords ?? '' });
  }
  if (!pages.size) throw new Error('content/seo.md: таблица метаданных пуста');
  return pages;
}

export function seoPath(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  // Compatibility document routes render the same documents and reuse their metadata.
  const document = ['privacy', 'cookies', 'consent'].includes(clean) ? `legal/${clean}` : clean;
  return document === '404.html' ? '/404.html' : document ? `/${document}/` : '/';
}
