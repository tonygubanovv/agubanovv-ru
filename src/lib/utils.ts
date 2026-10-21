/**
 * AGUBANOVV.RU — общие утилиты.
 */

export function p(href: string): string {
  return href.replace(/\/+$/, '') || '/'
}

export function absolute(path: string, siteUrl: string): string {
  return siteUrl.replace(/\/$/, '') + path
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
