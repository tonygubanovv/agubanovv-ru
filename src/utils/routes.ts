/** Legal pages the owner keeps out of search results: closed in robots, marked noindex, absent from the sitemap. */
export const hiddenPaths = ['legal/', 'legal/consent/', 'legal/cookies/', 'legal/privacy/', 'consent/', 'cookies/', 'privacy/'] as const;

export const isHiddenPath = (path: string) => (hiddenPaths as readonly string[]).includes(path.replace(/^\/+/, ''));

/**
 * Addresses of publications the owner moved under /blog/. The build leaves only a redirect page
 * at the old path, because those links were already shared before the move.
 */
export const movedPaths: Record<string, string> = {
  'telegram-ads-ib-vendor/': 'blog/telegram-ads-ib-vendor/',
  'salesbot-utm-amocrm/': 'blog/salesbot-utm-amocrm/',
};
