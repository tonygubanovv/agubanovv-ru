// The extension is required: `npm run smoke` loads this file through Node, not through Vite.
import { site } from '../config/site.ts';

/**
 * Любой адрес приводится к пути внутри сайта: https://agubanovv.ru/blog/slug/, /blog/slug/ и blog/slug/
 * дают одно и то же. Главная — пустая строка.
 */
const toPath = (address: string) => {
  const trimmed = address.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed === '' ? '' : `${trimmed}/`;
};

/** Страницы документов закрыты от поиска всегда: `noindex`, вне sitemap и запрещены директивой Disallow в robots.txt. */
export const legalPaths = ['legal/', 'legal/consent/', 'legal/cookies/', 'legal/privacy/', 'consent/', 'cookies/', 'privacy/'];

/**
 * Всё, что поисковики не должны показывать: страницы документов плюс список владельца `site.search.closed`.
 * Закрытая страница получает `noindex, follow`, теряет canonical и исчезает из карты сайта.
 */
export const closedPaths = [...legalPaths, ...site.search.closed.map(toPath)];

export const isClosedPath = (path: string) => closedPaths.includes(toPath(path));

/**
 * Addresses of publications the owner moved under /blog/. The build leaves only a redirect page
 * at the old path, because those links were already shared before the move.
 */
export const movedPaths: Record<string, string> = {
  'telegram-ads-ib-vendor/': 'blog/telegram-ads-ib-vendor/',
  'salesbot-utm-amocrm/': 'blog/salesbot-utm-amocrm/',
};
