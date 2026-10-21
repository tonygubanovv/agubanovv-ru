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
  name: 'Личный сайт',
  author: undefined as string | undefined,
  role: 'Digital-маркетинг',
  description: 'Личный сайт о digital-маркетинге: проекты, практические заметки и идеи на пересечении маркетинга и технологий.',
  hero: {
    title: 'Маркетинг.',
    accent: 'С мыслью о главном.',
    description: 'Личное пространство о digital-маркетинге. Здесь будут проекты, наблюдения и практические заметки на пересечении маркетинга и технологий.',
  },
  about: 'Этот сайт — место для профессиональных материалов: от постановки задачи и выбора подхода до выводов. Первые публикации ещё впереди.',
  topics: ['Маркетинг', 'Аналитика', 'Технологии'],
  navigation: [
    { label: 'Проекты', path: 'projects/' },
    { label: 'Блог', path: 'blog/' },
    { label: 'Обо мне', path: '#about' },
  ],
  analytics: { yandexId: undefined as number | undefined, privacyApproved: false },
} as const;
