/**
 * Сбрасывает кэш content-layer, чтобы материалы пересобирались текущим
 * набором remark/rehype-плагинов. Правка src/lib/prose-plugin.ts или
 * astro.config.mjs не меняет сам .md-файл, поэтому astro dev отдаёт
 * собранный ранее HTML: кэш лежит в .astro/ (dev) и node_modules/.astro/
 * (сборка). Запускается автоматически перед `npm run dev`.
 */

import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

for (const dir of ['.astro', path.join('node_modules', '.astro')]) {
  await rm(path.join(root, dir, 'data-store.json'), { force: true });
}
