export interface PageSeo { title: string; description: string; keywords: string }

/** Visual Markdown editors save literal pipes as \|; keep them inside the cell. */
function tableCells(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  const row = line.trim();
  for (let index = 1; index < row.length - 1; index++) {
    const char = row[index];
    const next = row[index + 1];
    if (char === '\\' && (next === '|' || next === '\\')) {
      cell += next;
      index++;
    } else if (char === '|') {
      cells.push(cell.trim().replaceAll('&#124;', '|'));
      cell = '';
    } else cell += char;
  }
  cells.push(cell.trim().replaceAll('&#124;', '|'));
  return cells;
}

/** The same small table reader is used by Astro and the output checks. */
export function parseSeoTable(source: string): Map<string, PageSeo> {
  const pages = new Map<string, PageSeo>();
  const lines = source.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.trim().startsWith('|')) continue;
    const cells = tableCells(line);
    if (cells[0] === 'Адрес' || cells.every(cell => /^:?-+:?$/.test(cell))) continue;
    const [path, title, description, keywords] = cells;
    const fail = (reason: string): never => { throw new Error(`content/seo.md, строка ${index + 1}: ${reason}`); };
    if (!line.trim().endsWith('|') || cells.length !== 4) fail('нужны ровно четыре ячейки; символ | внутри текста запишите как \\| или &#124;');
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
  return clean === '404.html' ? '/404.html' : clean ? `/${clean}/` : '/';
}
