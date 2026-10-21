/**
 * AGUBANOVV.RU — секция Hero (главный экран).
 * Неоновый фон, две кнопки,证明-строка.
 */

import Link from 'next/link'
import Button from '@/components/ui/Button'

interface HeroProps {
  title: string
  lead: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  eyebrow?: string
  proof?: string
}

export default function Hero({
  title,
  lead,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  eyebrow,
  proof,
}: HeroProps) {
  return (
    <section className="hero tech-grid">
      <div className="hero-glow" />
      <div className="hero-content">
        {eyebrow && (
          <div className="hero-eyebrow">
            <span className="eyebrow-line" aria-hidden="true"></span>
            {eyebrow}
          </div>
        )}
        <h1>{title}</h1>
        <p className="hero-lead">{lead}</p>
        <div className="hero-actions">
          <Link href={primaryHref} passHref legacyBehavior>
            <Button variant="primary" className="glow-box">
              {primaryLabel}
            </Button>
          </Link>
          <Link href={secondaryHref} passHref legacyBehavior>
            <Button variant="ghost" className="glow-box">
              {secondaryLabel}
            </Button>
          </Link>
        </div>
        {proof && <p className="hero-proof">{proof}</p>}
      </div>
    </section>
  )
}
