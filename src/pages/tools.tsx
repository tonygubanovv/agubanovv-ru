/**
 * AGUBANOVV.RU — страница инструментов.
 */

import Head from 'next/head'
import { seo } from '@/lib/seo'
import { site } from '@/lib/site'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'

export default function Tools() {
  const pageSeo = seo({
    title: `Инструменты — ${site.title}`,
    description: 'Бесплатные инструменты для цифрового маркетинга: конструктор UTM-ссылок, калькулятор юнит-экономики и другие.',
    path: '/tools/',
  })

  const tools = [
    {
      icon: '🔗',
      title: 'Конструктор UTM-ссылок',
      body: 'Создавайте и проверяйте ссылки с UTM-метками для рекламы, писем и партнёров.',
      href: '/tools/utm/',
    },
    {
      icon: '💰',
      title: 'Калькулятор юнит-экономики',
      body: 'Считайте, сколько можно платить за привлечение клиента при заданном чеке и маржинальности.',
      href: '/tools/unit-economics/',
    },
    {
      icon: '📊',
      title: 'Калькулятор значимости A/B',
      body: 'Оцените объём выборки и поймите, достаточно ли данных для выбора варианта теста.',
      href: '/tools/ab-significance/',
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
        <section className="section shell tools-shell">
          <div className="tools-intro">
            <h1>Инструменты</h1>
            <p className="tools-lead">
              Бесплатные утилиты для ежедневной работы: считать, собирать, проверять. Все считаются в вашем браузере — данные никуда не уходят.
            </p>
          </div>

          <div className="tools-grid">
            {tools.map((tool, i) => (
              <a key={i} href={tool.href} className="tool-card card glow-box">
                <div className="tool-icon" aria-hidden="true">
                  {tool.icon}
                </div>
                <div className="tool-body">
                  <h3>{tool.title}</h3>
                  <p>{tool.body}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
