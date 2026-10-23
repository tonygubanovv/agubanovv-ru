import table from '../../content/seo.md?raw';
import { parseSeoTable, seoPath } from './seoTable';

const pages = parseSeoTable(table);
export function pageSeo(path = '') {
  const key = seoPath(path);
  const meta = pages.get(key);
  if (!meta) throw new Error(`Добавьте строку для ${key} в content/seo.md`);
  return meta;
}
