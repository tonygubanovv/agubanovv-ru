/**
 * AGUBANOVV.RU — страница блога.
 */

import Head from 'next/head'
import { seo } from '@/lib/seo'
import { site } from '@/lib/site'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'

export default function Blog() {
  const pageSeo = seo({
    title: `Блог — ${site.title}`,
    description: 'Кейсы и заметки о цифровом маркетинге: позиционирование, юнит-экономика, каналы, эксперименты и отчётность.',
    path: '/blog/',
  })

  const posts = [
    {
      badge: 'Кейс',
      title: 'Юнит-экономика перед медиапланом',
      body: 'Как считать допустимую стоимость привлечения клиента и не слить бюджет на запуске.',
    },
    {
      badge: 'Заметка',
      title: 'Анатомия плохого отчёта',
      body: 'Почему большинство маркетинговых отчётов не влияют на решения — и как это исправить.',
    },
    {
      badge: 'Кейс',
      title: 'Telegram Ads: IB-vendor',
      body: 'Разбор запуска рекламной кампании в Telegram для поставщика на маркетплейсе.',
    },
  ]

  return (
    <>
      <Head>
        <title>{pageSeo.title}</title>
        <meta name="description" content={pageSeo.description} />
        <link rel="canonical" href={pageSeo.canonical} />
        <meta name="theme-color" content={pageSeo.themeColor} />
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
        <section className="section shell blog-shell">
          <div className="blog-intro">
            <h1>Блог</h1>
            <p className="blog-lead">
              Заметки о том, как считать экономику, запускать продвижение и оценивать результаты. С артефактами на выходе и без мотивационного шума.
            </p>
          </div>

          <div className="blog-grid">
            {posts.map((post, i) => (
              <article key={i} className="blog-card card glow-box">
                <span className="badge badge-tech">{post.badge}</span>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
