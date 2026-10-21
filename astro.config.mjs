import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { copyFile } from 'node:fs/promises';

export default defineConfig({
  site: 'https://tonygubanovv.github.io',
  base: '/agubanovv-ru',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    sitemap({ filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404.html') }),
    {
      name: 'sitemap-public-alias',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          // Keep the official integration's generated index and expose the conventional URL.
          await copyFile(new URL('sitemap-index.xml', dir), new URL('sitemap.xml', dir));
        },
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
