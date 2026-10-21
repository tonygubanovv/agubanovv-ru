/**
 * AGUBANOVV.RU — карточка.
 * Обёртка со стилем карточки (граница, фон, hover-свечение).
 */

interface CardProps {
  className?: string
  children: React.ReactNode
}

export default function Card({ className = '', children }: CardProps) {
  const classes = `card ${className}`.trim()

  return <article className={classes}>{children}</article>
}
