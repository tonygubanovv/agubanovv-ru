/**
 * AGUBANOVV.RU — страница 404.
 */

import Head from 'next/head'
import { seo } from '@/lib/seo'
import { site } from '@/lib/site'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'

export default function NotFound() {
  const pageSeo = seo({
    title: 'Страница не найдена — 404',
    description: 'Запрашиваемая страница не найдена на сайте agubanovv.ru.',
    path: '/404/',
    noindex: true,
  })

  return (
    <>
      <Head>
        <title>{pageSeo.title}</title>
        <meta name="description" content={pageSeo.description} />
        <link rel="canonical" href={pageSeo.canonical} />
        <meta name="theme-color" content={pageSeo.themeColor} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={pageSeo.og.title} />
        <meta property="og:description" content={pageSeo.og.description} />
        <meta property="og:url" content={pageSeo.og.url} />
        <meta property="og:image" content={pageSeo.og.image} />
        <meta name="twitter:title" content={pageSeo.twitter.title} />
        <meta name="twitter:description" content={pageSeo.twitter.description} />
        <meta name="twitter:image" content={pageSeo.twitter.image} />
      </Head>

      <SiteHeader />

      <main id="main">
        <section className="section shell not-found">
          <div className="not-found-content">
            <h1 className="not-found-title">404</h1>
            <p className="not-found-lead">Страница не найдена. Возможно, она перемещена или удалена.</p>
            <div className="not-found-actions">
              <a href="/" className="btn btn-primary">
                На главную
              </a>
              <a href="/blog/" className="btn btn-ghost">
                Открыть блог
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
