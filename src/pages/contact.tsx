/**
 * AGUBANOVV.RU — страница контактов.
 */

import Head from 'next/head'
import { seo } from '@/lib/seo'
import { site } from '@/lib/site'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import CTA from '@/components/sections/CTA'

export default function Contact() {
  const pageSeo = seo({
    title: `Контакты — ${site.title}`,
    description: 'Обсудить задачу цифрового маркетинга. Связь по Telegram, почте или через форму обратной связи.',
    path: '/contact/',
  })

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
        <section className="section shell contact-shell">
          <div className="contact-intro">
            <h1>Обсудим вашу задачу</h1>
            <p className="contact-lead">
              Расскажите о продукте, целях и текущих результатах. Предложу, с чего начать и в каком формате могу помочь.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card card glow-box">
              <h3>Telegram</h3>
              <p>Быстрая связь для первичных вопросов и оценки задачи.</p>
              <a href={`https://t.me/${site.contact.telegram.replace(/^@/, '')}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Написать в Telegram
              </a>
            </div>

            <div className="contact-card card glow-box">
              <h3>Электронная почта</h3>
              <p>Для детального brief, техзадания и долгосрочного сотрудничества.</p>
              <a href={`mailto:${site.contact.email}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Написать письмо
              </a>
            </div>

            <div className="contact-card card glow-box">
              <h3>GitHub</h3>
              <p>Открытый код, инструменты и публичные материалы проекта.</p>
              <a href={site.contact.github} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Перейти на GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
