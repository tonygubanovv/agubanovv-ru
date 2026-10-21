/**
 * AGUBANOVV.RU — кнопка.
 * Варианты: primary (неоновая), ghost (прозрачная). Размеры: md, sm.
 */

type ButtonVariant = 'primary' | 'ghost'
type ButtonSize = 'md' | 'sm'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  disabled = false,
  className = '',
  children,
}: ButtonProps) {
  const Tag = href ? 'a' : 'button'
  const classes = `btn btn-${variant} btn-${size} ${className}`.trim()

  return (
    <Tag
      className={classes}
      {...(href ? { href } : { type: 'button' })}
      {...(disabled ? { disabled } : {})}
    >
      {children}
    </Tag>
  )
}
