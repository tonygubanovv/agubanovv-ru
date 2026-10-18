import yaml from 'js-yaml';
import { normalizeProse } from './prose-normalize';
import { topics } from './site-config';
import { slugify } from './utils';

/**
 * Схема материала в том же виде, что и zod-контракт в src/content.config.ts.
 * Держится одной строкой с реальными правилами: админка не даёт закоммитить
 * файл, который не прошёл бы сборку.
 */

export type Metric = { value: string; label: string; note?: string; trend: 'up' | 'down' | 'flat' };

export type Draft = {
  kind: 'article' | 'case';
  slug: string;
  title: string;
  dek: string;
  topic: string;
  tags: string[];
  date: string;
  updated?: string;
  draft: boolean;
  featured: boolean;
  noindex: boolean;
  channels: string[];
  related: string[];
  context?: string;
  duration?: string;
  role?: string;
  budget?: string;
  metrics: Metric[];
  cover?: { src: string; alt: string };
  seo: { title?: string; description?: string };
  body: string;
};

export const CASE_BODY = [
  '## Ситуация на входе',
  '',
  'Что было: цифры, каналы, бюджет, что команда считала проблемой.',
  '',
  '## Что посчитали',
  '',
  ':::note Техзадание на данные',
  'Какие числа собрали прежде чем что-то менять.',
  ':::',
  '',
  '| Показатель | Было | Стало |',
  '| --- | ---: | ---: |',
  '| CPL | 000 ₽ | 000 ₽ |',
  '',
  '## Гипотезы',
  '',
  '1. Если …, то … (ожидаемый эффект, как фальсифицировать).',
  '',
  '## Что изменили',
  '',
  '**Продукт:** …',
  '',
  '**Каналы:** …',
  '',
  '## Результат',
  '',
  ':::takeaway',
  'Главная цифра и что за ней стоит.',
  ':::',
  '',
  '## Что осталось сломанным',
  '',
  'Честный остаток: где не сошлось и что не удалось измерить.',
  '',
].join('\n');

export const ARTICLE_BODY = [
  '## Почему это важно',
  '',
  'Чем плох обычный подход и как часто он стоит денег.',
  '',
  '## Метод',
  '',
  ':::note Определение',
  'Коротко о термине, если он вводится впервые.',
  ':::',
  '',
  '1. Шаг первый с конкретным артефактом.',
  '2. Шаг второй.',
  '',
  '## Частые ошибки',
  '',
  ':::warn Что ломает результат',
  'Типичный провал и как его заметить заранее.',
  ':::',
  '',
  '## Что забрать с собой',
  '',
  ':::takeaway',
  'Одна мысль, которую читатель применит на этой неделе.',
  ':::',
  '',
].join('\n');

export function emptyDraft(kind: Draft['kind'] = 'article'): Draft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    kind,
    slug: '',
    title: '',
    dek: '',
    topic: topics[0].slug,
    tags: [],
    date: today,
    draft: true,
    featured: false,
    noindex: false,
    channels: [],
    related: [],
    metrics: [],
    seo: {},
    body: kind === 'case' ? CASE_BODY : ARTICLE_BODY,
    ...(kind === 'case' ? { duration: '3 месяца', role: 'Product marketing' } : {}),
  };
}

/** Правила зеркалят zod-схему: ошибки здесь = падение сборки. */
export function validateDraft(draft: Draft): { field: string; text: string }[] {
  const errors: { field: string; text: string }[] = [];
  if (draft.title.trim().length < 8) errors.push({ field: 'title', text: 'Заголовок от 8 символов.' });
  const dek = draft.dek.trim();
  if (dek.length < 40) errors.push({ field: 'dek', text: 'Лид от 40 символов: он уходит в карточку и сниппет.' });
  if (dek.length > 240) errors.push({ field: 'dek', text: 'Лид длиннее 240 символов — обрежут.' });
  if (!topics.some((topic) => topic.slug === draft.topic)) errors.push({ field: 'topic', text: 'Тема вне списка.' });
  if (draft.tags.length > 6) errors.push({ field: 'tags', text: 'Тегов не больше шести.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.push({ field: 'date', text: 'Дата в формате 2026-10-18.' });
  if ((draft.seo.title ?? '').length > 68) errors.push({ field: 'seoTitle', text: 'SEO title длиннее 68 символов.' });
  if ((draft.seo.description ?? '').length > 190) {
    errors.push({ field: 'seoDescription', text: 'SEO description длиннее 190 символов.' });
  }
  if (!draft.body.trim()) errors.push({ field: 'body', text: 'Пустое тело материала.' });

  if (draft.kind === 'case') {
    if ((draft.context ?? '').trim().length < 12) {
      errors.push({ field: 'context', text: 'Context: отрасль и масштаб без имён, от 12 символов.' });
    }
    if (draft.metrics.length === 0) errors.push({ field: 'metrics', text: 'У кейса минимум одна метрика.' });
    if (draft.metrics.length > 4) errors.push({ field: 'metrics', text: 'Метрик не больше четырёх.' });
    draft.metrics.forEach((metric, index) => {
      if (!metric.value.trim() || metric.label.trim().length < 3) {
        errors.push({ field: `metric-${index}`, text: 'У каждой метрики нужны value и label.' });
      }
    });
    if (draft.channels.length === 0) errors.push({ field: 'channels', text: 'Кейс без каналов не существует.' });
    if (!(draft.role ?? '').trim()) errors.push({ field: 'role', text: 'Укажите роль в проекте.' });
  } else if (draft.channels.length === 0) {
    errors.push({ field: 'channels', text: 'Заполните каналы: по ним работают фильтры и связанные материалы.' });
  }
  return errors;
}

function toFrontmatter(draft: Draft) {
  const data: Record<string, unknown> = { kind: draft.kind };
  data.title = draft.title.trim();
  data.dek = draft.dek.trim();
  data.topic = draft.topic;
  if (draft.tags.length) data.tags = draft.tags;
  data.date = draft.date;
  if (draft.updated) data.updated = draft.updated;
  data.draft = draft.draft;
  if (draft.featured) data.featured = true;
  if (draft.noindex) data.noindex = true;

  if (draft.kind === 'case') {
    data.context = draft.context?.trim();
    data.duration = draft.duration;
    data.role = draft.role;
    if (draft.budget) data.budget = draft.budget;
    data.channels = draft.channels;
    data.metrics = draft.metrics.map((metric) => ({
      value: metric.value,
      label: metric.label,
      ...(metric.note ? { note: metric.note } : {}),
      trend: metric.trend,
    }));
  } else if (draft.channels.length) {
    data.channels = draft.channels;
  }

  if (draft.cover?.src) data.cover = { src: draft.cover.src, alt: draft.cover.alt };
  if (draft.related.length) data.related = draft.related;
  if (draft.seo.title || draft.seo.description) {
    data.seo = { ...(draft.seo.title ? { title: draft.seo.title } : {}), ...(draft.seo.description ? { description: draft.seo.description } : {}) };
  }
  return data;
}

export function serializeDraft(draft: Draft) {
  const front = yaml.dump(toFrontmatter(draft), {
    lineWidth: 0,
    noRefs: true,
    quotingType: '"',
    sortKeys: false,
  });
  // Файл проходит normalizeProse перед записью: синтаксис директив и списков
  // в репозитории всегда тот же, что проверяет scripts/check-content.mjs.
  return `---\n${front.trimEnd()}\n---\n\n${normalizeProse(draft.body).trim()}\n`;
}

export function parseFile(text: string, slug: string): Draft {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  const data = (match ? yaml.load(match[1]) : {}) as Record<string, unknown>;
  const body = (match?.[2] ?? text).trim();
  const base = emptyDraft((data.kind as Draft['kind']) ?? 'article');
  return {
    ...base,
    slug,
    kind: data.kind === 'case' ? 'case' : 'article',
    title: String(data.title ?? ''),
    dek: String(data.dek ?? ''),
    topic: String(data.topic ?? base.topic),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    date: String(data.date ?? base.date).slice(0, 10),
    updated: data.updated ? String(data.updated).slice(0, 10) : undefined,
    draft: Boolean(data.draft),
    featured: Boolean(data.featured),
    noindex: Boolean(data.noindex),
    channels: Array.isArray(data.channels) ? data.channels.map(String) : [],
    related: Array.isArray(data.related) ? data.related.map(String) : [],
    context: data.context ? String(data.context) : undefined,
    duration: data.duration ? String(data.duration) : undefined,
    role: data.role ? String(data.role) : undefined,
    budget: data.budget ? String(data.budget) : undefined,
    metrics: Array.isArray(data.metrics)
      ? (data.metrics as Record<string, unknown>[]).map((metric) => ({
          value: String(metric.value ?? ''),
          label: String(metric.label ?? ''),
          note: metric.note ? String(metric.note) : undefined,
          trend: (metric.trend as Metric['trend']) ?? 'up',
        }))
      : [],
    cover:
      data.cover && typeof data.cover === 'object'
        ? { src: String((data.cover as Record<string, unknown>).src ?? ''), alt: String((data.cover as Record<string, unknown>).alt ?? '') }
        : undefined,
    seo: {
      title: data.seo ? String((data.seo as Record<string, unknown>).title ?? '') || undefined : undefined,
      description: data.seo ? String((data.seo as Record<string, unknown>).description ?? '') || undefined : undefined,
    },
    body,
  };
}

export const draftFileName = (draft: Pick<Draft, 'slug' | 'title'>) =>
  `${draft.slug || slugify(draft.title)}.md`;

export const materialPath = (draft: Draft, dir: string) =>
  `${dir.replace(/\/+$/, '')}/${draftFileName(draft)}`;
