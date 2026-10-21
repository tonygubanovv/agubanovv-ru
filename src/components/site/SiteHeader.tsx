/**
 * AGUBANOVV.RU — шапка сайта.
 * Навигация, переключатель темы, кнопка связи, мобильное меню.
 */

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from '@/components/ui/Icon'
import { nav, site } from '@/lib/site'

interface SiteHeaderProps {}

export default function SiteHeader(_props: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  const isActive = useCallback(
    (href: string) => {
      const target = href.replace(/\/+$/, '') || '/'
      const current = currentPath.replace(/\/+$/, '') || '/'
      return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
    },
    [currentPath]
  )

  // Инициализация темы послеmount (избегаем document на сервере)
  useEffect(() => {
    const stored = localStorage.getItem('site-theme')
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const next = (stored ?? system) as 'light' | 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.style.colorScheme = next
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.style.colorScheme = next
    try {
      localStorage.setItem('site-theme', next)
    } catch {}
    window.dispatchEvent(new CustomEvent('site:theme', { detail: next }))
  }, [theme])

  const setMenu = useCallback((open: boolean) => {
    setIsOpen(open)
    if (menuButtonRef.current) {
      menuButtonRef.current.setAttribute('aria-expanded', String(open))
    }
    if (menuRef.current) {
      menuRef.current.toggleAttribute('hidden', !open)
      menuRef.current.setAttribute('data-open', String(open))
    }
    if (open) {
      document.documentElement.classList.add('nav-open')
    } else {
      document.documentElement.classList.remove('nav-open')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 6)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = useCallback(() => setMenu(false), [setMenu])

  const isDark = theme === 'dark'

  return (
    <header className="site-header glass" data-header data-scrolled={isScrolled}>
      <div className="shell header-row">
        <Link href="/" className="wordmark" aria-label={site.title}>
          <Icon name="arrow-right" size={24} color="var(--c-accent)" />
          <span>{site.wordmark}</span>
        </Link>

        <nav className="desk-only main-nav" aria-label="Основная навигация">
          {nav.filter((item) => item.href !== '/').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              passHref
              legacyBehavior
              aria-current={isActive(item.href) ? 'page' : undefined}
              title={item.hint}
            >
              <a className="nav-link">{item.label}</a>
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn"
            type="button"
            data-theme-toggle
            aria-label="Переключить тему"
            aria-pressed={isDark}
            onClick={toggleTheme}
          >
            <Icon name="sun" size={18} className="icon-sun" />
            <Icon name="moon" size={18} className="icon-moon" />
          </button>

          <Link href={`mailto:${site.contact.email}`} passHref legacyBehavior>
            <a className="desk-only btn btn-ghost btn-sm" data-cta>
              Написать
            </a>
          </Link>

          <button
            className="icon-btn desk-hidden"
            type="button"
            data-menu-toggle
            ref={menuButtonRef}
            aria-expanded={isOpen}
            aria-controls="site-nav-mobile"
            onClick={() => setMenu(!isOpen)}
          >
            <Icon name="menu" size={20} data-icon-open />
            <Icon name="close" size={20} data-icon-close />
            <span className="sr-only">Меню</span>
          </button>
        </div>
      </div>

      <div className="mobile-nav" id="site-nav-mobile" data-menu ref={menuRef} hidden={!isOpen}>
        <nav className="shell" aria-label="Мобильная навигация">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} passHref legacyBehavior aria-current={isActive(item.href) ? 'page' : undefined} onClick={closeMenu}>
                  <a className="mobile-nav-link">
                    <span className="mobile-nav-label">{item.label}</span>
                    <span className="mobile-nav-hint">{item.hint}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mobile-nav-foot">
            <a className="btn btn-primary btn-sm" href={`mailto:${site.contact.email}`}>
              Написать
            </a>
            <a
              className="btn btn-ghost btn-sm"
              href={`https://t.me/${site.contact.telegram.replace(/^@/, '')}`}
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              Telegram
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
