/**
 * AGUBANOVV.RU — бейдж.
 * Вариант tech — неоновый стиль.
 */

type BadgeVariant = 'tech' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export default function Badge({
  variant = 'tech',
  className = '',
  children,
}: BadgeProps) {
  const classes = `badge ${variant === 'tech' ? 'badge-tech' : ''} ${className}`.trim()

  return <span className={classes}>{children}</span>
}
