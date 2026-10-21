/**
 * AGUBANOVV.RU — главная страница.
 */

import Head from 'next/head'
import { seo } from '@/lib/seo'
import { site } from '@/lib/site'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import CTA from '@/components/sections/CTA'

export default function Home() {
  const pageSeo = seo({
    title: site.title,
    description: site.description,
    path: '/',
  })

  return (
    <>
      <Head>
        <title>{pageSeo.title}</title>
        <meta name="description" content={pageSeo.description} />
        <link rel="canonical" href={pageSeo.canonical} />
        <meta name="theme-color" content={pageSeo.themeColor} />
        <meta property="og:type" content={pageSeo.og.type} />
        <meta property="og:site_name" content={pageSeo.og.site_name} />
        <meta property="og:title" content={pageSeo.og.title} />
        <meta property="og:description" content={pageSeo.og.description} />
        <meta property="og:url" content={pageSeo.og.url} />
        <meta property="og:image" content={pageSeo.og.image} />
        <meta property="og:locale" content={pageSeo.og.locale} />
        <meta name="twitter:card" content={pageSeo.twitter.card} />
        <meta name="twitter:title" content={pageSeo.twitter.title} />
        <meta name="twitter:description" content={pageSeo.twitter.description} />
        <meta name="twitter:image" content={pageSeo.twitter.image} />
        {!pageSeo.noindex ? null : <meta name="robots" content="noindex, nofollow" />}
      </Head>

      <SiteHeader />

      <main id="main">
        <Hero
          title="Цифровой маркетинг без воды"
          lead="Помогаю продуктам находить клиентов и расти: позиционирование, юнит-экономика, каналы продвижения и сквозная аналитика. Только расчёты и гипотезы — без мотивационного шума."
          primaryLabel="Обсудить задачу"
          primaryHref="/contact/"
          secondaryLabel="Перейти в блог"
          secondaryHref="/blog/"
          eyebrow="Digital & Product Marketing"
          proof="Работаю с B2B и B2C продуктами в России и СНГ."
        />

        <Features
          title="Чем могу помочь"
          lead="Весь путь от позиции до отчёта — с цифрами, воронками и понятными выводами."
          more={{ href: '/blog/', label: 'Все кейсы →' }}
          items={[
            {
              title: 'Позиционирование',
              body: 'Определяем, кто ваш клиент, чем продукт отличается и как об этом говорить на рынке.',
              badge: 'Стратегия',
              icon: 'shield',
            },
            {
              title: 'Юнит-экономика',
              body: 'Считаем стоимость клиента, окупаемость и границы разумных ставок перед запуском рекламы.',
              badge: 'Экономика',
              icon: 'chart',
            },
            {
              title: 'Перформанс и каналы',
              body: 'Запускаем и настраиваем рекламу, оптимизируем воронку и атрибуцию по всем точкам касания.',
              badge: 'Реклама',
              icon: 'rocket',
            },
            {
              title: 'Аналитика и отчёты',
              body: 'Собираем сквозную аналитику, воронки, когорты и эксперименты — чтобы решения основывались на данных.',
              badge: 'Данные',
              icon: 'zap',
            },
          ]}
        />

        <CTA
          title="Обсудим вашу задачу"
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
