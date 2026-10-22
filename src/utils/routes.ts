/** Legal pages the owner keeps out of search results: closed in robots, marked noindex, absent from the sitemap. */
export const hiddenPaths = ['legal/', 'legal/consent/', 'legal/cookies/', 'legal/privacy/', 'consent/', 'cookies/', 'privacy/'] as const;

export const isHiddenPath = (path: string) => (hiddenPaths as readonly string[]).includes(path.replace(/^\/+/, ''));
