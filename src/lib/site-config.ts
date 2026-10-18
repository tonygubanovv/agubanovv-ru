/**
 * Единственная точка правды про идентичность сайта, навигацию и контакты.
 * Правил: никаких имён, фамилий, доменов и контактов внутри компонентов —
 * всё читается отсюда. Плейсхолдеры реальными значениями заменяются в .env.
 */

import { resolveSiteOrigin } from './site-origin';
import { siteDefaults } from './site-defaults';

const env = import.meta.env as Record<string, string | undefined>;

export const site = {
  /** Домен для canonical, sitemap, RSS и OG. Заменить в PUBLIC_SITE_URL. */
  url: resolveSiteOrigin(env),

  /** Человекочитаемая подпись разделов. Имени здесь быть не должно. */
  discipline: 'Digital & PMM',
  wordmark: 'digital/pmm',
  title: 'Заметки, кейсы и инструменты digital-маркетолога',
  tagline: 'Продуктовый маркетинг: решения, расчёты и практика',
  description:
    'Кейсы, заметки и инструменты продуктового маркетолога. Как считать экономику, запускать продвижение и оценивать результаты.',

  locale: 'ru-RU',
  lang: 'ru',
  timezone: 'Europe/Moscow',

  /** Подпись автора в материалах — роль, не имя. */
  byline: 'Продуктовый маркетинг и рост',

  contact: {
    email: env.PUBLIC_CONTACT_EMAIL?.trim() || siteDefaults.email,
    telegram: env.PUBLIC_CONTACT_TELEGRAM?.trim() || siteDefaults.telegram,
    github: env.PUBLIC_CONTACT_GITHUB?.trim() || siteDefaults.github,
  },

  /** Формат дат в каталоге и материалах. */
  dateFormat: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  } as Intl.DateTimeFormatOptions,
} as const;

export type NavItem = { href: string; label: string; hint?: string };

export const nav: readonly NavItem[] = [
  { href: '/', label: 'Обзор', hint: 'Чем занимаюсь и как это устроено' },
  { href: '/blog/', label: 'Разборы', hint: 'Кейсы и заметки с фильтрами' },
  {
    href: '/tools/',
    label: 'Инструменты',
    hint: 'Считать, собирать, проверять',
  },
  { href: '/about/', label: 'Подход', hint: 'Как я работаю с ростом' },
] as const;

/** Таксономия контента: один источник для каталога, фильтров и админки. */
export const topics = [
  {
    slug: 'positioning',
    title: 'Позиционирование',
    about: 'Кто клиент, чем продукт отличается и как об этом говорить',
  },
  {
    slug: 'growth',
    title: 'Юнит-экономика',
    about: 'Стоимость клиента, окупаемость и границы разумных ставок',
  },
  {
    slug: 'performance',
    title: 'Перформанс',
    about: 'Каналы, креативы, ставки и атрибуция',
  },
  {
    slug: 'launch',
    title: 'Запуски',
    about: 'План запуска, продуктовые релизы, первые 90 дней',
  },
  {
    slug: 'research',
    title: 'Исследования',
    about: 'Кастдев, путь клиента, опросы, работа с возражениями',
  },
  {
    slug: 'analytics',
    title: 'Аналитика',
    about: 'Воронки, когорты, эксперименты, отчётность',
  },
  {
    slug: 'content',
    title: 'Контент и поиск',
    about: 'Запросы, кластеры, редактурный процесс',
  },
  {
    slug: 'process',
    title: 'Процессы',
    about: 'План, ритм, зоны ответственности',
  },
] as const;

export type TopicSlug = (typeof topics)[number]['slug'];
export const topicBySlug = new Map<string, (typeof topics)[number]>(topics.map((t) => [t.slug, t]));

/**
 * Параметры публикации из админки. Токен здесь отсутствует намеренно:
 * он живёт только в localStorage браузера и никогда не собирается в бандл.
 */
export const publish = {
  repo: env.PUBLIC_REPO?.trim() || siteDefaults.repo,
  contentDir: env.PUBLIC_CONTENT_DIR ?? 'src/content/blog',
  coverDir: env.PUBLIC_COVER_DIR ?? 'public/images/covers',
  branch: env.PUBLIC_MAIN_BRANCH ?? 'main',
} as const;

/** Порядок разделов в шапке и на карте сайта. */
export const collectionsRoute = {
  article: '/blog',
  case: '/cases',
} as const;
