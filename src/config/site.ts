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
  social: [{ label: 'GitHub', url: 'https://github.com/tonygubanovv' }],
  analytics: { yandexId: undefined as number | undefined, privacyApproved: false },
} as const;
