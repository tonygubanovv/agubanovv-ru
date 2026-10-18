import { siteDefaults } from './site-defaults';

/** Shared by Astro config and the application; no dependency on Vite globals. */
export function resolveSiteOrigin(env: Record<string, string | undefined>) {
  const configured = env.PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return siteDefaults.url;
}
