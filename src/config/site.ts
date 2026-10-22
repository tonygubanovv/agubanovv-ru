/** Shared blog topics in their public display order. */
export const blogTags = ['Telegram Ads', 'Нейросети', 'SEO & GEO', 'Кейсы'] as const;

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
  about: 'Здесь собираю статьи и кейсы о digital-маркетинге. В блоге разбираю инструменты, поисковое продвижение и работу с ИИ — на конкретных вопросах и экспериментах. Первый материал посвящён llms.txt: нужен ли этот файл для GEO и что показали логи сервера.',
  topics: ['Digital-маркетинг', 'SEO и GEO', 'ИИ'],
  navigation: [
    { label: 'Блог', path: 'blog/' },
  ],
  // Temporarily disabled by the owner; re-enable only on an explicit request.
  search: { indexingEnabled: false as boolean },
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
