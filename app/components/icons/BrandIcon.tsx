import type { ReactNode, SVGProps } from 'react'

export interface BrandIconProps extends SVGProps<SVGSVGElement> {
  href?: string
  label?: string
}

export function BrandIcon({
  href,
  label,
  className,
  children,
  ...svgProps
}: BrandIconProps & { children: ReactNode }) {
  const glyph = (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={href ? undefined : className}
      {...svgProps}
    >
      {children}
    </svg>
  )

  if (!href) return glyph

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {glyph}
    </a>
  )
}
