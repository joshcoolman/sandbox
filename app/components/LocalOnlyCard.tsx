'use client'

import CurtainLink from './CurtainLink'
import { useIsLocal } from '@/app/(news)/_components/NewsEditContext'
import styles from './LocalOnlyCard.module.css'

const LOCAL_ROUTES = [
  { href: '/x', label: '/x', description: 'X broadcast queue' },
  { href: '/sketches', label: '/sketches', description: 'Scratch prototypes' },
  { href: '/news', label: '/news', description: 'AI news feed' },
]

/**
 * Lists routes that exist but aren't surfaced in the public site nav, so they
 * don't get forgotten when working locally. Renders nothing on the deployed
 * site -- gated by useIsLocal(), which only resolves true after mount on a
 * localhost-style hostname.
 */
export default function LocalOnlyCard() {
  const isLocal = useIsLocal()
  if (!isLocal) return null

  return (
    <aside className={styles.card} aria-label="Local-only routes">
      <span className={styles.label}>Local only &middot; not on public site</span>
      <div className={styles.links}>
        {LOCAL_ROUTES.map((route) => (
          <CurtainLink
            key={route.href}
            href={route.href}
            className={styles.link}
            curtainTransition={true}
          >
            <span className={styles.arrow} aria-hidden="true">
              &rarr;
            </span>
            <span className={styles.linkLabel}>{route.label}</span>
            <span className={styles.linkDescription}>{route.description}</span>
          </CurtainLink>
        ))}
      </div>
    </aside>
  )
}
