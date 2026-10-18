/**
 * Узельная копия src/lib/slug.ts: скриптам сборки недоступен TypeScript.
 * Если меняешь транслит в src/lib/slug.ts — меняй здесь; расхождение ловит
 * scripts/check-content.mjs (якоря в тексте против id в собранном HTML).
 */
const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Неразрывные и узкие пробелы — тоже разделители слов. */
const SPACE_CHARS = '[\\u00A0\\u2007\\u202F]';

export function slugify(input) {
  return String(input)
    .replace(new RegExp(SPACE_CHARS, 'g'), ' ')
    .toLowerCase()
    .replace(/[а-яё]/gu, (ch) => MAP[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export function headingSlugs(headings) {
  const seen = new Map();
  return headings.map((heading) => {
    const base = slugify(heading.text) || 'razdel';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count > 1 ? `${base}-${count}` : base;
  });
}
