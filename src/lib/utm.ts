import { typesetText as t } from './typography';

/**
 * Правила разметки — часть продукта, а не настройка: они же показываются
 * в подсказках инструмента и в статье про UTM-дисциплину.
 */
export const MEDIUMS = [
  { value: 'cpc', label: t('Контекст и тизеры'), group: 'Performance' },
  { value: 'display', label: t('Медийная сетка'), group: 'Performance' },
  { value: 'social', label: t('Соцсети и посевы'), group: 'Earned' },
  { value: 'search_paid', label: t('Платный поиск'), group: 'Performance' },
  { value: 'email', label: t('Письма своей базе'), group: 'CRM' },
  { value: 'push', label: t('Пуш и in-app'), group: 'CRM' },
  { value: 'seeding', label: t('Посевы у авторов'), group: 'Earned' },
  { value: 'partner', label: t('Партнёрские ссылки'), group: 'Partner' },
  { value: 'offline', label: t('Офлайн: визитки, наружка'), group: 'Offline' },
  { value: 'content', label: t('Статьи и колонки'), group: 'Earned' },
] as const;

export const SOURCES = [
  'yt_direct',
  'vk_ads',
  'ok_ads',
  'tg_ads',
  'tg_channel',
  'google_search',
  'yandex_direct',
  'pinterest',
  'vc_ru',
  'habr',
  'partner_blog',
  'email_sends',
  'app_push',
  'conference',
  'flyer',
] as const;

/** Шаблон кампании: <год>_<продукт>_<месяц>_<цель> — год и месяц цифрами. */
export const CAMPAIGN_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+){1,5}$/;

export type ParamKey = 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content';

export const PARAM_KEYS: ParamKey[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

const BAD_CHARS = /[^a-z0-9_\-./]/;

export type Issue = { level: 'error' | 'warn'; field: string; text: string };

export function validateUrl(url: string): Issue[] {
  const issues: Issue[] = [];
  if (!url.trim()) {
    issues.push({ level: 'error', field: 'url', text: t('Нужен адрес посадки — без него ссылку не собрать.') });
    return issues;
  }
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      issues.push({ level: 'error', field: 'url', text: t('Ожидается http или https.') });
    }
    if (parsed.searchParams.has('utm_source')) {
      issues.push({
        level: 'warn',
        field: 'url',
        text: t('В адресе уже есть utm_source: новые параметры перекроют старые в части отчётов.'),
      });
    }
    if (parsed.hostname === location.hostname && parsed.hostname !== '') {
      issues.push({
        level: 'warn',
        field: 'url',
        text: t('Внутренняя ссылка: utm-разметка разрывает сессию аналитики. Для своих переходов используйте другой параметр.'),
      });
    }
  } catch {
    issues.push({ level: 'error', field: 'url', text: t('Адрес не читается как URL — проверьте протокол и домен.') });
  }
  return issues;
}

export function validateParam(key: ParamKey, value: string): Issue | null {
  if (!value) {
    if (key === 'utm_source' || key === 'utm_medium' || key === 'utm_campaign') {
      return { level: 'error', field: key, text: t(`${labelOf(key)} обязателен, иначе канал не будет виден в отчёте.`) };
    }
    return null;
  }
  if (value !== value.toLowerCase()) {
    return { level: 'error', field: key, text: t('Только нижний регистр: заглавные буквы создают дубль строки в отчёте.') };
  }
  if (/\s/.test(value)) {
    return { level: 'error', field: key, text: t('Пробелы превращаются в %20 и ломают склейку с CRM.') };
  }
  if (BAD_CHARS.test(value)) {
    return { level: 'warn', field: key, text: t('Лучше ограничиться латиницей, цифрами, _ и -.') };
  }
  if (key === 'utm_medium' && !MEDIUMS.some((medium) => medium.value === value)) {
    return { level: 'warn', field: key, text: t('Такого medium в реестре нет: выберите существующее или добавьте значение в список.') };
  }
  if (key === 'utm_campaign' && !CAMPAIGN_PATTERN.test(value)) {
    return { level: 'warn', field: key, text: t('Шаблон: год_продукт_месяц_цель, без точек и слэшей.') };
  }
  if (key === 'utm_source' && !SOURCES.includes(value as (typeof SOURCES)[number])) {
    return { level: 'warn', field: key, text: t('Новый source. Если он появляется впервые — зафиксируйте его в реестре.') };
  }
  return null;
}

export function labelOf(key: ParamKey) {
  return key.replace('utm_', '');
}

export function buildUrl(base: string, params: Record<ParamKey, string>) {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return '';
  }
  for (const key of PARAM_KEYS) {
    const value = params[key].trim();
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Пакетная сборка: список источников или креативов → набор ссылок. */
export function expand(
  base: string,
  params: Record<ParamKey, string>,
  lines: string[],
  axis: 'utm_source' | 'utm_content',
) {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  if (!cleaned.length) return [buildUrl(base, params)];
  return cleaned.map((value) => buildUrl(base, { ...params, [axis]: value }));
}
