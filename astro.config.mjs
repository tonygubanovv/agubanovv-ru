import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { copyFile, writeFile } from 'node:fs/promises';
import { sitemapMeta } from './src/utils/sitemapMeta.ts';
import { isHiddenPath } from './src/utils/routes.ts';
import { site } from './src/config/site.ts';

export default defineConfig({
  site: 'https://agubanovv.ru',
  base: '/',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    ...(site.search.indexingEnabled ? [sitemap({
      filter: (page) => !isHiddenPath(new URL(page).pathname) && !page.endsWith('/404/') && !page.endsWith('/404.html'),
      serialize: (item) => ({ ...item, ...sitemapMeta(new URL(item.url).pathname) }),
    })] : []),
    {
      name: 'sitemap-public-alias',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          if (!site.search.indexingEnabled) {
            const empty = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
            await writeFile(new URL('sitemap-0.xml', dir), empty);
            await writeFile(new URL('sitemap-index.xml', dir), '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://agubanovv.ru/sitemap-0.xml</loc></sitemap></sitemapindex>');
          }
          // The owner reads /sitemap.xml in the webmaster consoles, so it must list the pages themselves,
          // not an index with one link to a second file.
          await copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir));
        },
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
