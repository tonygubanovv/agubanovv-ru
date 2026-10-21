import { defineMiddleware } from 'astro:middleware';
import { typographHtml } from './utils/typography';
import { contactLinks } from './config/site';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const contacts = Object.fromEntries(contactLinks().map(link => [link.key, link.url]));
  return new Response(typographHtml(await response.text(), contacts), { status: response.status, statusText: response.statusText, headers });
});
