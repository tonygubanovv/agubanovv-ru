/** Set each public contact once. Missing values are not rendered anywhere. */
export const links = {
  telegram: 'https://t.me/tonygubanovv' as string | undefined,
  email: undefined as string | undefined,
};
export const contactLinks = () => [
  ...(links.telegram ? [{ key: 'telegram', label: 'Telegram', url: links.telegram }] : []),
  ...(links.email ? [{ key: 'email', label: 'Почта', url: `mailto:${links.email}` }] : []),
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
  about: 'Здесь собираю статьи и проекты о digital-маркетинге. В блоге разбираю инструменты, поисковое продвижение и работу с ИИ — на конкретных вопросах и экспериментах. Первый материал посвящён llms.txt: нужен ли этот файл для GEO и что показали логи сервера.',
  topics: ['Digital-маркетинг', 'SEO и GEO', 'ИИ'],
  navigation: [
    { label: 'Проекты', path: 'projects/' },
    { label: 'Блог', path: 'blog/' },
    { label: 'Обо мне', path: '#about' },
  ],
  analytics: { yandexId: undefined as number | undefined, privacyApproved: false },
} as const;
