/** Shared blog topics in their public display order. */
export const blogTags = ['Telegram Ads', 'Нейросети', 'SEO & GEO', 'Кейсы'] as const;

/** Stable public addresses, independent of the displayed topic names. */
export const blogTagSlugs: Record<(typeof blogTags)[number], string> = {
  'Telegram Ads': 'telegram-ads',
  'Нейросети': 'neuroseti',
  'SEO & GEO': 'seo-geo',
  'Кейсы': 'cases',
};

/** Share destinations use ordinary links; no third-party widgets are loaded. */
export const shareServices = [
  { label: 'Telegram', icon: 'telegram', endpoint: 'https://t.me/share/url', urlParam: 'url', titleParam: 'text' },
  { label: 'ВКонтакте', icon: 'vk', endpoint: 'https://vk.com/share.php', urlParam: 'url', titleParam: 'title' },
] as const;

/** Personal recommendations and the owner's exact referral addresses. */
export const recommendations = [
  { name: 'Tilda', url: 'https://tilda.ru/?r=7536403', description: 'Собрать сайт или лендинг без программирования.' },
  { name: 'Seopapa', url: 'https://seopapa.com/agbnv', description: 'Продвижение сайтов в Яндексе через поведенческие факторы.' },
  { name: 'Плати по миру', url: 'https://platipomiru.com/?code=XVSQGOLB', description: 'Зарубежная карта для оплаты подписок и сервисов.' },
  { name: 'Мишка VPN', url: 'https://mishka.cc/invite/869f4c75252e', description: 'Мой VPN на всех устройствах. Пользуюсь уже два года.' },
  { name: 'Vitamin.tools', url: 'https://vitamin.tools/?ref2=385b1e94-9fe4-4d17-a54f-9f7c00414dbb', description: 'Рекламные кабинеты и бонусы. Реферальные бонусы делим 50/50.' },
  { name: 'Salebot', url: 'https://salebot.pro/l/152537', description: 'Мой любимый конструктор воронок и ботов в Telegram.' },
  { name: 'Qoder', url: 'https://qoder.com/activities?referral_code=6ree2iTPEJoqWyE5vT0rlQmByyvt4amO', description: 'Редактор с ИИ, чтобы попробовать вайбкодинг. Есть бесплатный тариф.' },
  { name: 'Keys.so', url: 'https://www.keys.so/ru/?p=57950', description: 'Подсмотреть запросы, SEO и рекламу конкурентов.' },
  { name: 'Timeweb Cloud', url: 'https://timeweb.cloud/r/kt656114', description: 'Облачные серверы для сайтов, ботов и своих проектов.' },
  { name: 'TGStat', url: 'https://tgstat.ru/x/X2eGo', description: 'Статистика Telegram-каналов и поиск площадок для рекламы.' },
] as const;

/** Set each public contact once. Missing values are not rendered anywhere. */
export const links = {
  telegram: 'https://t.me/tonygubanovv' as string | undefined,
  email: 'tonygubanovv@yandex.ru' as string | undefined,
  privacyEmail: 'tonygubanovv@yandex.ru',
};
export const contactLinks = () => [
  ...(links.telegram ? [{ key: 'telegram', label: 'Telegram', url: links.telegram }] : []),
  ...(links.email ? [{ key: 'email', label: links.email, url: `mailto:${links.email}` }] : []),
];

export const site = {
  name: 'Антон Губанов',
  author: 'Антон Губанов',
  role: 'Digital-маркетолог',
  description: 'Личный сайт Антона Губанова: статьи о digital-маркетинге, SEO, GEO и технологиях. Эксперименты, наблюдения и выводы из практики.',
  hero: {
    title: 'Маркетинг.',
    accent: 'От гипотез к выводам.',
    description: 'Я Антон Губанов, digital-маркетолог. Проверяю подходы на практике и делюсь тем, что получилось: экспериментами, наблюдениями и выводами.',
  },
  about: {
    intro: 'Я Антон Губанов, диджитал-маркетолог. Работаю в компании в сфере информационной безопасности и делюсь опытом продвижения сложных B2B-продуктов.',
    more: [
      'В блоге разбираю Telegram Ads, SEO, GEO и нейросети на конкретных задачах. Пишу о продвижении Telegram-каналов, поисковых экспериментах и инструментах, которые помогают связать рекламу с результатами.',
      'Этот сайт — место для моих статей, кейсов и наблюдений из практики. Здесь собираю то, что удалось проверить: от рекламных запусков до технических решений для маркетинга.',
    ],
  },
  navigation: [
    { label: 'Блог', path: 'blog/' },
    { label: 'Рекомендую', path: 'recommend/' },
  ],
  // Индексация сайтом владеет этот блок. indexingEnabled: false закрывает весь сайт сразу.
  // closed — отдельные страницы: впиши адрес как в браузере, и он закроется от поисковика
  // (страница получит noindex и исчезнет из карты сайта). Для посетителя она останется открытой.
  // Страницы документов закрыты всегда, их сюда вписывать не нужно — список в src/utils/routes.ts.
  search: {
    indexingEnabled: true as boolean,
    closed: ['https://agubanovv.ru/blog/telegram-ads-ib-vendor/'],
  },
  analytics: { yandexId: 113586660 as number | undefined, privacyApproved: true },
  /** Public ownership tokens for search engines; rendered in every page <head>. */
  verification: {
    yandex: '1a79001ad80f627e',
    google: '6XETKa1QzG373kEImKULNHN9I-I0iV8mRj2orvuqKxM',
    bing: '5B5199D1ACA69B0BBDE7153766706793',
  },
  legal: {
    operatorName: 'Губанов Антон Андреевич',
    operatorStatus: 'самозанятый',
    updated: '2026-10-22',
    consentVersion: '2026-10-22.1',
    consentDays: 180,
  },
} as const;
