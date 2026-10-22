import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { sitemapMeta } from './src/utils/sitemapMeta.ts';
import { isClosedPath, movedPaths } from './src/utils/routes.ts';
import { site } from './src/config/site.ts';

const origin = 'https://agubanovv.ru';

export default defineConfig({
  site: origin,
  base: '/',
  trailingSlash: 'always',
  output: 'static',
  // Covers arrive as 2,7 MB PNGs, so the build re-encodes them and the browser picks a variant by width.
  // Sharp stays on purpose: the owner asked for optimization on 22.10.2026, do not put the noop service back.
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  integrations: [
    ...(site.search.indexingEnabled ? [sitemap({
      filter: (page) => !isClosedPath(new URL(page).pathname) && !page.endsWith('/404/') && !page.endsWith('/404.html'),
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
    {
      name: 'page-redirects',
      hooks: {
        // GitHub Pages has no server-side redirects, so the moved addresses keep static stub pages.
        'astro:build:done': async ({ dir }) => {
          for (const [from, to] of Object.entries(movedPaths)) {
            const target = `${origin}/${to}`;
            const page = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Страница переехала</title><meta name="description" content="Страница доступна по адресу /${to}, прежняя ссылка ведёт на неё."><meta name="robots" content="noindex, follow"><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0;url=${target}"></head><body><h1>Страница переехала</h1><p>Перейти по адресу <a href="/${to}">/${to}</a>.</p></body></html>`;
            const file = new URL(`${from}index.html`, dir);
            await mkdir(new URL(from, dir), { recursive: true });
            await writeFile(file, page);
          }
        },
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
