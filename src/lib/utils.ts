import { site } from './site-config';

/**
 * Единственный способ строить ссылки в проекте. `import.meta.env.BASE_URL`
 * нужен из-за GitHub Pages project sites (/repo/...), а `trailingSlash: 'always'`
 * требует слэш на конце — helper гарантирует оба.
 */
export function p(...parts: (string | number | undefined | null)[]) {
  const base = import.meta.env.BASE_URL || '/';
  const clean = parts
    .filter((x): x is string | number => x !== undefined && x !== null && x !== '')
    .map((x) => String(x).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  const path = [base.replace(/\/+$/, ''), ...clean].join('/').replace(/\/{2,}/g, '/');
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * Путь к файлу из /public (фавикон, обложка, rss, og). В отличие от p()
 * не добавляет слэш в конец: GitHub Pages отдаёт такие файлы как есть.
 */
export function asset(path: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/** Каталог разборов: /blog/ с предустановленным фильтром типа через hash. */
export const catalogHref = (kind?: 'case' | 'article') => `${p('/blog/')}${kind ? `#kind=${kind}` : ''}`;

export function absolute(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const relative = `/${path.replace(/^\/+/, '')}`;
  const prefixed = base && relative !== base && !relative.startsWith(`${base}/`) ? `${base}${relative}` : relative;
  return new URL(prefixed, site.url).href;
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ').trim();
}

const dateFmt = new Intl.DateTimeFormat(site.locale, site.dateFormat);

export function formatDate(value: string | Date | undefined) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return dateFmt.format(d);
}

export function formatLongDate(value: string | Date | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat(site.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    value instanceof Date ? value : new Date(`${value}T00:00:00`),
  );
}

/** Время чтения: 180 слов/мин для русского, без обмана «2 минуты». */
export function readingTime(markdown: string) {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/[\s—–-]+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return { words, minutes: Math.max(1, Math.round(words / 180)) };
}

export { slugify } from './slug';

export function humanNumber(value: number) {
  return new Intl.NumberFormat(site.locale, { maximumFractionDigits: 2 }).format(value);
}

/** Русская плюсализация: 1 материал / 2 материала / 5 материалов. */
export function pluralRu(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
