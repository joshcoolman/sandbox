'use client'

import { usePathname } from 'next/navigation'
import { experiments } from '@/lib/experiments/data'
import CurtainLink from '@/app/components/CurtainLink'
import SiteFooter from '@/app/components/SiteFooter'
import { useExperimentBack } from '../useExperimentBack'
import styles from './layout.module.css'

export default function ExperimentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const slug = pathname.split('/').pop() || ''
  const experiment = experiments.find(e => e.slug === slug)
  const back = useExperimentBack()

  if (!experiment) return <>{children}</>

  const tags = experiment.tags
  const footerTags = tags.length > 3 ? tags.slice(0, 3) : tags

  const bgStyle = experiment.bgTop || experiment.bgBottom
    ? { '--experiment-bg': `linear-gradient(to top, ${experiment.bgBottom ?? experiment.bgTop}, ${experiment.bgTop ?? experiment.bgBottom})` } as React.CSSProperties
    : undefined

  return (
    <div className={styles.frame} data-theme={experiment.theme ?? 'dark'} style={bgStyle}>
      <header className={styles.header}>
        <CurtainLink
          href={back.href}
          className={styles.backLink}
          curtainTransition
          curtainReverse
        >
          <span className={styles.backArrow}>&larr;</span> {back.label}
        </CurtainLink>
        <div className={styles.rule} />
        <div className={styles.headerRow}>
          <span className={styles.title}>{experiment.title}</span>
          <span className={styles.meta}>Design Experiment</span>
        </div>
        <div className={styles.rule} />
        <div className={styles.subRow}>
          {tags.map(tag => (
            <span key={tag} className={styles.label}>{tag}</span>
          ))}
        </div>
        <div className={styles.rule} />
      </header>

      {children}

      <div className={styles.footer}>
        <div className={styles.rule} />
        <div className={styles.footerRow}>
          <span className={styles.label}>{experiment.date}</span>
          {footerTags.map(tag => (
            <span key={tag} className={styles.label}>{tag}</span>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
