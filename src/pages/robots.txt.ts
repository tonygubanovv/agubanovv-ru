import { absoluteUrl } from '../utils/urls';
export const GET = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('sitemap-index.xml')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
