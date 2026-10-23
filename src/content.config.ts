import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { blogTags } from './config/site';

const text = z.string().trim().min(1);
// YAML turns an unquoted ISO date into a Date; normalize it to the same public format.
const date = z.preprocess(value => value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString().slice(0, 10) : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date'));
const common = {
  title: text,
  date,
  tags: z.array(z.enum(blogTags)).max(blogTags.length).default([]),
  featured: z.boolean().default(false),
};
const loader = (base: string) => glob({
  base,
  pattern: '*/index.md',
  generateId: ({ entry }) => {
    const id = entry.replace(/\/index\.md$/, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Unsafe content filename: ${entry}`);
    return id;
  },
});
const blog = defineCollection({
  loader: loader('./content/blog'),
  schema: ({ image }) => z.object({
    ...common, summary: text, category: text, updated: date.optional(),
    preserveText: z.boolean().default(false),
    cover: z.object({ src: image(), alt: text }),
  }).strict().refine(data => !data.updated || data.updated >= data.date, 'updated must not precede date'),
});
export const collections = { blog };
