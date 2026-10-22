import { blogTagSlugs } from '../config/site';

/** The single entry point for local URLs, including public assets and fragments. */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\/+/, '');
  if (!clean) return `${base}/`;
  if (clean.startsWith('#')) return `${base}/${clean}`;
  const [pathname, fragment] = clean.split('#');
  const suffix = /\.[a-z0-9]+$/i.test(pathname!) ? '' : '/';
  return `${base}/${pathname!.replace(/\/$/, '')}${suffix}${fragment ? `#${fragment}` : ''}`;
}

export function absoluteUrl(path = ''): string {
  return new URL(url(path), import.meta.env.SITE).href;
}

/** Resolve a topic through the shared list so its URL stays stable when rendering. */
export function tagSlug(tag: string): string {
  if (!Object.hasOwn(blogTagSlugs, tag)) throw new Error(`Unknown blog topic: ${tag}`);
  return blogTagSlugs[tag as keyof typeof blogTagSlugs];
}
