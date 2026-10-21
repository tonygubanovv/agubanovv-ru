/**
 * AGUBANOVV.RU — секция Features (сетка карточек возможностей).
 */

import Link from 'next/link'
import Badge from '@/components/ui/Badge'

interface FeatureItem {
  title: string
  body: string
  badge?: string
  icon?: 'zap' | 'shield' | 'chart' | 'rocket'
}

interface FeaturesProps {
  title: string
  lead?: string
  items: FeatureItem[]
  more?: { href: string; label: string }
}

const iconMap: Record<string, string> = {
  zap: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 4h16v16H4z"/><polygon points="4 4 8 12 12 4"/></svg>`,
}

export default function Features({
  title,
  lead,
  items,
  more,
}: FeaturesProps) {
  return (
    <section className="section">
      <div className="features-head">
        {title && (
          <div className="features-head-text">
            <h2>{title}</h2>
            {lead && <p>{lead}</p>}
          </div>
        )}
        {more && (
          <Link href={more.href} passHref legacyBehavior className="section-more">
            {more.label}
          </Link>
        )}
      </div>

      <div className="features-grid">
        {items.map((item, i) => (
          <article key={i} className="feature-card card glow-box">
            {item.icon && (
              <div className="feature-icon" dangerouslySetInnerHTML={{ __html: iconMap[item.icon] }} />
            )}
            <div className="feature-body">
              {item.badge && <Badge variant="tech">{item.badge}</Badge>}
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
