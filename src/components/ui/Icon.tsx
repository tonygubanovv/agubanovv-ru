/**
 * AGUBANOVV.RU — иконки (SVG, self-hosted, никаких CDN).
 * Единый компонент для иконок навигации и соцсетей.
 */

type IconName =
  | 'telegram'
  | 'github'
  | 'email'
  | 'arrow-right'
  | 'chevron-down'
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export default function Icon({ name, size = 20, color, className = '' }: IconProps) {
  const icons: Record<IconName, string> = {
    telegram: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.26 18.43l3.57 2.09c1.18.69 2.6.33 3.24-.67l3.23-5.65c.55-.96.22-2.2-.83-2.71l-2.58-1.23c-1.18-.57-2.38.22-2.9 1.28l-1.13 2.37c-.36.74-.48 1.52-.48 2.28 0 .22.01.45.03.68zm9.45-14.25c-1.68 0-3.29.76-4.28 2.02L4.44 11.48c-.66.85-.72 2.05-.22 3.03l1.91 3.66c.31.59.75.92 1.34.92h.04c.46 0 .89-.28 1.18-.78l1.46-2.48c.73-1.25 2.35-1.68 3.22-1.05l2.98 2.09c.46.32 1.04.26 1.4-.1l2.47-2.17c1.08-.94 1.48-2.42 1.08-3.59l-1.42-4.13c-.23-.65-.85-1.18-1.53-1.38z"/></svg>`,
    github: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-4.77 0-2.08-1.3-3.8-3.25-4.59a3.37 3.37 0 0 0-1.06-1.85 3.37 3.37 0 0 0-.28-1.42c0-.86-.26-1.55-.68-2.14a7.6 7.6 0 0 0-1.9-1.24c-1.48-.54-3.05-.55-4.58-.22a12.2 12.2 0 0 0-2.9.23c-1.57.41-2.98 1.23-3.96 2.42a7.6 7.6 0 0 0-1.54 2.28c-.12.75-.12 1.53 0 2.29a3.37 3.37 0 0 0 1.05 2.23c.23.43.44.84.65 1.22a12.3 12.3 0 0 0 2.19 1.49c.78.34 1.66.49 2.52.49a12.4 12.4 0 0 0 2.79-.18c1.05-.24 2.09-.61 3.08-1.08a3.37 3.37 0 0 0 2.19-1.23c.6-.83.9-1.85.9-2.95v-2.98c0-.68-.27-1.34-.72-1.84a3.37 3.37 0 0 0-1.51-1.13c-1.05-.4-2.23-.57-3.32-.57a6.6 6.6 0 0 0-2.36.28c-.97.23-1.83.64-2.56 1.18a12.3 12.3 0 0 0-2.09 1.95c-.42.6-.76 1.29-.99 1.99a3.37 3.37 0 0 0-.37 2.06v3.87"/></svg>`,
    email: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    'arrow-right': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`,
    'chevron-down': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    menu: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    close: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    sun: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    moon: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79"/></svg>`,
  }

  return (
    <span
      className={`icon ${className}`.trim()}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: icons[name] }}
      aria-hidden="true"
    />
  )
}
