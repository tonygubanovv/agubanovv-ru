import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const text = z.string().trim().min(1);
// YAML turns an unquoted ISO date into a Date; normalize it to the same public format.
const date = z.preprocess(value => value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString().slice(0, 10) : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date'));
const common = {
  title: text,
  date,
  tags: z.array(text.max(40)).max(6).default([]),
  featured: z.boolean().default(false),
};
const loader = (base: string) => glob({
  base,
  pattern: '*.md',
  generateId: ({ entry }) => {
    const id = entry.replace(/\.md$/, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Unsafe content filename: ${entry}`);
    return id;
  },
});
const blog = defineCollection({
  loader: loader('./src/content/blog'),
  schema: ({ image }) => z.object({
    ...common, description: text, category: text, updated: date.optional(),
    cover: z.object({ src: image(), alt: text }).optional(),
  }).refine(data => !data.updated || data.updated >= data.date, 'updated must not precede date'),
});
const projects = defineCollection({
  loader: loader('./src/content/projects'),
  schema: ({ image }) => z.object({
    ...common, summary: text, role: text.optional(),
    cover: z.object({ src: image(), alt: text }).optional(),
  }),
});
export const collections = { blog, projects };
