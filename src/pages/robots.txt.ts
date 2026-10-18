import type { APIContext } from 'astro';
import { absolute, asset, p } from '@/lib/utils';

export function GET(_context: APIContext) {
  // Правила robots для GitHub Pages project site: путь от корня домена,
  // поэтому /admin/ берём через p() — он добавляет префикс репозитория.
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Интерфейс публикации и клиентские фильтры не нужны в индексе.',
    `Disallow: ${p('/admin/')}`,
    // Старый корень кейсов — заглушка-редирект; сами кейсы по /cases/<slug>/ открыты.
    `Disallow: ${p('/cases/')}\$`,
    'Disallow: /*?*topic=',
    'Disallow: /*?*q=',
    '',
    `Sitemap: ${absolute(asset('/sitemap-index.xml'))}`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
