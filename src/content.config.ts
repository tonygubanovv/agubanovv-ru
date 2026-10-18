import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { topics } from './lib/site-config';

/**
 * Контент-модель блога. Статьи и кейсы живут в одной коллекции и различаются
 * полем kind: article → /blog/<slug>/, case → /cases/<slug>/.
 * Slug = имя файла, и это единственный источник URL: в frontmatter его нет.
 */

const topicSlugs = topics.map((t) => t.slug) as unknown as [string, ...string[]];

const metric = z.object({
  value: z.string().min(1),
  label: z.string().min(3),
  note: z.string().optional(),
  trend: z.enum(['up', 'down', 'flat']).default('up'),
});

const blogBase = z.object({
  title: z.string().min(8, 'Заголовок короче 8 символов'),
  dek: z
    .string()
    .min(40, 'Лид короче 40 символов: это анотация и для карточки, и для SEO')
    .max(240, 'Лид длиннее 240 символов: его обрежут в сниппете'),
  topic: z.enum(topicSlugs),
  tags: z.array(z.string()).max(6, 'Не больше 6 тегов').default([]),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  noindex: z.boolean().default(false),
  cover: z
    .object({
      src: z.string().startsWith('/'),
      alt: z.string().min(3),
    })
    .optional(),
  seo: z
    .object({
      title: z.string().max(68).optional(),
      description: z.string().max(190).optional(),
    })
    .default({}),
});

const articleSchema = blogBase.extend({
  kind: z.literal('article'),
  channels: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
});

const caseSchema = blogBase.extend({
  kind: z.literal('case'),
  /** Анонимизированное описание клиента: отрасль + масштаб, без имён. */
  context: z.string().min(12, 'У кейса должен быть context: отрасль и масштаб без имён'),
  duration: z.string().min(2).default('3 месяца'),
  role: z.string().min(4, 'Укажите роль в проекте').default('Продуктовый маркетинг'),
  metrics: z.array(metric).min(1, 'У кейса минимум одна метрика').max(4),
  channels: z.array(z.string()).min(1, 'Кейс без каналов не существует'),
  budget: z.string().optional(),
  related: z.array(z.string()).default([]),
});

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
    schema: z.discriminatedUnion('kind', [articleSchema, caseSchema]),
  }),
};

export type ArticleData = z.infer<typeof articleSchema>;
export type CaseData = z.infer<typeof caseSchema>;
export type BlogKind = 'article' | 'case';
export type BlogMetric = z.infer<typeof metric>;
