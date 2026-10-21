/**
 * AGUBANOVV.RU — корневой компонент Next.js (_app).
 * Подключает глобальные стили, инициализирует тему из localStorage.
 * Каждая страница оборачивается в SEO-слой через Head.
 */

import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import '@/styles/global.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  // Инициализация темы до первого рендера (без вспышки)
  useEffect(() => {
    const stored = localStorage.getItem('site-theme')
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const theme = stored ?? system
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [])

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <a className="skip-link" href="#main">К содержимому</a>

      <Component {...pageProps} />
    </>
  )
}
