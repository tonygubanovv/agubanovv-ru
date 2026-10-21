/**
 * AGUBANOVV.RU — страница "Обо мне".
 */

import Head from 'next/head'
import { seo } from '@/lib/seo'
import { site } from '@/lib/site'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Features from '@/components/sections/Features'
import CTA from '@/components/sections/CTA'

export default function About() {
  const pageSeo = seo({
    title: `Обо мне — ${site.title}`,
    description: 'Подход к работе с ростом: диагностика, запуск, сопровождение. Форматы, инструменты и ответы на вопросы до старта.',
    path: '/about/',
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
        <section className="section shell about-shell">
          <div className="about-intro">
            <h1>Подход к работе</h1>
            <p className="about-lead">
              Диагностика → запуск → сопровождение. Нет шаблонных решений — только то, что подходит под вашу экономику и рынок.
            </p>
          </div>

          <Features
            title="Как мы работаем"
            lead=""
            items={[
              {
                title: 'Диагностика',
                body: 'Анализируем продукт, рынок, конкурентов и текущие цифры. Выходим с пониманием, где точки роста.',
                badge: '1–2 недели',
                icon: 'zap',
              },
              {
                title: 'Стратегия',
                body: 'Формулируем позиционирование, считаем юнит-экономику и выбираем каналы с лучшим возвратом.',
                badge: '1 неделя',
                icon: 'chart',
              },
              {
                title: 'Запуск',
                body: 'Настраиваем рекламу, воронку и аналитику. Запускаем первые кампании и отслеживаем метрики.',
                badge: '2–4 недели',
                icon: 'rocket',
              },
              {
                title: 'Сопровождение',
                body: 'Оптимизируем ставки, креативы и воронку. Еженедельные отчёты и корректировка плана.',
                badge: 'Постоянно',
                icon: 'shield',
              },
            ]}
          />
        </section>

        <CTA
          title="Готовы начать?"
          body="Опишите продукт, текущие цифры и что не сходится. Отвечу в течение двух рабочих дней."
          primaryLabel="Написать в Telegram"
          primaryHref={`https://t.me/${site.contact.telegram.replace(/^@/, '')}`}
          secondaryLabel="Написать письмо"
          secondaryHref={`mailto:${site.contact.email}`}
        />
      </main>

      <SiteFooter />
    </>
  )
}
