/**
 * Якоря заголовков. Слаг транслитерируется: в адресной строке GitHub Pages
 * кириллица читается плохо, а Astro-слаг склеивает слова, если типограф уже
 * поставил туда неразрывный пробел. Поэтому id считаем сами (см. prose-plugin).
 */

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(input: string) {
  return String(input)
    // Неразрывные и узкие пробелы — тоже разделители, иначе слова склеиваются.
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .toLowerCase()
    .replace(/[а-яё]/gu, (ch) => TRANSLIT[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

/** Уникальные якоря для списка заголовков в порядке документа. */
export function headingSlugs(headings: readonly { text: string }[]) {
  const seen = new Map<string, number>();
  return headings.map((heading) => {
    const base = slugify(heading.text) || 'razdel';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count > 1 ? `${base}-${count}` : base;
  });
}
