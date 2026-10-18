import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import { loadEnv } from 'vite';
import { remarkCallouts } from './src/lib/directives';
import { proseStructure } from './src/lib/prose-plugin';
import { resolveSiteOrigin } from './src/lib/site-origin';
import { typographer } from './src/lib/typography-plugin';

const buildEnv = { ...loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'PUBLIC_'), ...process.env };
const siteOrigin = resolveSiteOrigin(buildEnv);

/**
 * GitHub Pages: project sites live under /<repo>/, user sites under /.
 * The deploy workflow exports GITHUB_REPOSITORY, so `base` is derived there.
 * Locally `base` is `/` unless SITE_BASE is set.
 */
function resolveBase() {
  if (process.env.SITE_BASE) return process.env.SITE_BASE;
  if (!new URL(siteOrigin).hostname.endsWith('.github.io')) return '/';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (!repo) return '/';
  return repo.endsWith('.github.io') ? '/' : `/${repo.toLowerCase()}/`;
}

export default defineConfig({
  site: siteOrigin,
  base: resolveBase(),
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    preact({ compat: false, prefetchLinks: false }),
    mdx(),
    sitemap({
      i18n: { locales: { ru: 'ru-RU' }, defaultLocale: 'ru' },
      filter: (page) => !page.includes('/admin/') && !page.endsWith('/cases/'),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'vitesse-dark' },
      wrap: true,
    },
    remarkPlugins: [remarkDirective, remarkCallouts],
    rehypePlugins: [proseStructure, typographer],
  },
  image: {
    responsiveStep: 240,
    serviceOptions: { pointerData: true },
  },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 1024 },
  },
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
