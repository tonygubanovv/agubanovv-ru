/**
 * AGUBANOVV.RU — подвал сайта.
 * Бренд, навигация, контакты, копирайт.
 */

import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { site, nav } from '@/lib/site'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer glass-strong">
      <div className="shell footer-row">
        <div className="footer-brand">
          <Link href="/" className="footer-wordmark" aria-label={site.title}>
            {site.wordmark}
          </Link>
          <p className="footer-tagline">{site.tagline}</p>
        </div>

        <nav className="footer-nav" aria-label="Навигация">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <a>{item.label}</a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-contacts">
          <h4 className="footer-contact-title">Контакты</h4>
          <ul className="footer-contact-list">
            <li>
              <a href={`mailto:${site.contact.email}`}>
                <Icon name="email" size={16} />
                {site.contact.email}
              </a>
            </li>
            <li>
              <a
                href={`https://t.me/${site.contact.telegram.replace(/^@/, '')}`}
                rel="noopener"
              >
                <Icon name="telegram" size={16} />
                Telegram
              </a>
            </li>
            <li>
              <a href={site.contact.github} rel="noopener">
                <Icon name="github" size={16} />
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell footer-bottom">
        <p className="footer-copy">© {year} {site.wordmark}. Все права защищены.</p>
      </div>
    </footer>
  )
}
