/**
 * AGUBANOVV.RU — единственная точка правды про идентичность, навигацию и контакты.
 * Маркетолог может править здесь, не трогая компоненты и страницы.
 */

export const site = {
  /** Домен для canonical, sitemap, RSS и OG. */
  url: 'https://agubanovv.ru',

  wordmark: 'agubanovv.ru',
  title: 'Агубанов В. — цифровой маркетинг и продуктовый рост',
  tagline: 'Помогаю продуктам находить клиентов и расти: позиционирование, юнит-экономика, каналы.',
  description:
    'Личный сайт цифрового маркетолога. Кейсы, заметки и инструменты о том, как считать экономику, запускать продвижение и оценивать результаты.',

  locale: 'ru-RU',
  lang: 'ru',
  timezone: 'Europe/Moscow',

  contact: {
    email: 'tonygubanovv@yandex.ru',
    telegram: 'tonygubanovv',
    github: 'https://github.com/tonygubanovv',
  },
} as const

export type NavItem = { href: string; label: string; hint?: string }

export const nav: readonly NavItem[] = [
  { href: '/', label: 'Обзор', hint: 'Чем занимаюсь и как это устроено' },
  { href: '/blog/', label: 'Блог', hint: 'Кейсы и заметки' },
  { href: '/tools/', label: 'Инструменты', hint: 'Считать, собирать, проверять' },
  { href: '/about/', label: 'Обо мне', hint: 'Подход к работе с ростом' },
  { href: '/contact/', label: 'Контакты', hint: 'Обсудить задачу' },
] as const

export const socials = [
  { label: 'Telegram', href: 'https://t.me/tonygubanovv', icon: 'telegram' },
  { label: 'GitHub', href: 'https://github.com/tonygubanovv', icon: 'github' },
  { label: 'Почта', href: 'mailto:tonygubanovv@yandex.ru', icon: 'email' },
] as const
