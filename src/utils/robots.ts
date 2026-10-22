/** One source of truth for both robots files, so the Yandex copy can never drift from the served one. */
import { absoluteUrl } from './urls';
import { hiddenPaths } from './routes';
import { site } from '../config/site';

/**
 * Yandex drops these parameters when building the index, so a marked-up link never creates a second address
 * for the same page. Google has no Clean-param and relies on <link rel="canonical"> instead.
 */
const ignoredParameters = [
  ['Campaign labels from any ad builder', ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_referrer', 'mtm_source', 'mtm_medium', 'mtm_campaign', 'mtm_term', 'mtm_content', 'mtm_cid', 'mtm_group', 'mtm_track']],
  ['Click identifiers added by ad networks', ['gclid', 'gbraid', 'wbraid', 'msclkid', 'dclid', 'fbclid', 'twclid', 'vkclid', 'yclid', 'srcclid', 'webguruclid', '_openstat']],
  ['Referral markers added by shared links', ['ref', 'source', 'source-sign', 'origin']],
] as const;

const cleanParamLines = ignoredParameters.map(([comment, names]) => `# ${comment}\nClean-param: ${names.join('&')} /`);
const sitemapLine = `Sitemap: ${absoluteUrl('sitemap.xml')}`;
const group = (agent: string) => [agent, 'Allow: /', ...(site.search.indexingEnabled ? hiddenPaths.map(path => `Disallow: /${path}`) : [])];

export const yandexGroup = [...group('User-agent: Yandex'), ...cleanParamLines].join('\n');

const asFile = (groups: string[]) => `${groups.join('\n\n')}\n\n${sitemapLine}\n`;

/** Served at /robots.txt: every crawler plus the Yandex-only directives. */
export const robotsTxt = () => asFile([group('User-agent: *').join('\n'), yandexGroup]);

/** Standalone Yandex-only copy, served at /robots-yandex.txt. Yandex itself only reads /robots.txt. */
export const yandexRobotsTxt = () => asFile([yandexGroup]);
