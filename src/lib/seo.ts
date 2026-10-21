/**
 * AGUBANOVV.RU — SEO-слой.
 * Генерирует полный набор мета-тегов для каждой страницы.
 * Используется в _app.tsx и на страницах.
 */

export type SeoProps = {
  title: string
  description: string
  path: string
  ogImage?: string
  noindex?: boolean
}

export function seo({
  title,
  description,
  path,
  ogImage,
  noindex = false,
}: SeoProps) {
  const siteUrl = 'https://agubanovv.ru'
  const canonical = siteUrl.replace(/\/$/, '') + path
  const image = ogImage ?? `${siteUrl.replace(/\/$/, '')}/images/og-default.png`

  return {
    title,
    description,
    canonical,
    noindex,
    themeColor: '#0a0b0f',
    og: {
      type: 'website' as const,
      site_name: 'agubanovv.ru',
      title,
      description,
      url: canonical,
      image,
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      image,
    },
  }
}
