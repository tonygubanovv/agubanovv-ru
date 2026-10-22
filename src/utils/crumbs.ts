/** Short Russian names shared by the visible breadcrumb trail and its structured data. */
import { absoluteUrl } from './urls';

export type Crumb = { label: string; path?: string };

const sections: Record<string, string> = {
  blog: 'Блог',
  privacy: 'Политика',
  cookies: 'Cookie',
  consent: 'Согласие',
};

/** Only the section root is a real page, so deeper segments never become links. */
export function trail(path = '', current?: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Главная', path: '' }];
  const section = path.replace(/^\/+/, '').split('/')[0];
  const label = sections[section];
  if (label) crumbs.push({ label, path: `${section}/` });
  if (current) crumbs.push({ label: current });
  return crumbs;
}

export function breadcrumbGraph(crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(index === crumbs.length - 1 ? {} : { item: absoluteUrl(crumb.path) }),
    })),
  };
}
