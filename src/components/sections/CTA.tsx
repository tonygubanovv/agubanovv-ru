/**
 * AGUBANOVV.RU — секция CTA (призыв к действию).
 * Стеклянная панель с текстом и кнопками по центру.
 */

import Link from 'next/link'
import Button from '@/components/ui/Button'

interface CTAProps {
  title: string
  body: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

export default function CTA({
  title,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CTAProps) {
  return (
    <section className="cta glass-strong glow-box">
      <div className="cta-content">
        <h2 className="cta-title">{title}</h2>
        <p className="cta-body">{body}</p>
        <div className="cta-actions">
          <Link href={primaryHref} passHref legacyBehavior>
            <Button variant="primary">{primaryLabel}</Button>
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link href={secondaryHref} passHref legacyBehavior>
              <Button variant="ghost">{secondaryLabel}</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
