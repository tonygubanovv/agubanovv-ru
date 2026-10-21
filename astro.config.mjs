import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tonygubanovv.github.io',
  base: '/agubanovv-ru',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404.html') })],
  vite: { plugins: [tailwindcss()] },
});
