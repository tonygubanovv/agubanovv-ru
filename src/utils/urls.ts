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

/** Reversible encoding avoids collisions for Cyrillic and mixed-script tags. */
export const tagSlug = (tag: string) => Array.from(new TextEncoder().encode(tag)).map(n => n.toString(16).padStart(2, '0')).join('');
