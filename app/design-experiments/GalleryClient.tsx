'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import CurtainLink from '@/app/components/CurtainLink'
import HomeExperimentCard from '@/app/components/HomeExperimentCard'
import HomeExperimentPlaceholderCard from '@/app/components/HomeExperimentPlaceholderCard'
import type { Experiment } from '@/app/types/experiments'
import styles from './page.module.css'

interface GalleryClientProps {
  experiments: Experiment[]
  runnable: Record<string, boolean>
  requirements: Record<string, string[]>
}

export default function GalleryClient({
  experiments,
  runnable,
  requirements,
}: GalleryClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll restoration: return to the last-viewed experiment on back-nav.
    const hash = window.location.hash?.slice(1)
    const saved = sessionStorage.getItem('gallery-last-slug')
    const target = hash || saved
    if (target) {
      sessionStorage.removeItem('gallery-last-slug')
      const el = document.getElementById(target)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      if (hash) {
        history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={styles.container} data-theme="light">
      <div className={styles.backRow}>
        <CurtainLink href="/" className={styles.backLink} curtainTransition={true} curtainReverse={true}>
          <ChevronLeft size={14} />
          Back
        </CurtainLink>
      </div>
      <h1 className={styles.title}>Design</h1>
      <p className={styles.subtitle}>Like your life depended on it...</p>

      <div className={styles.rule}></div>

      <div className={styles.cardGrid}>
        {experiments.map((experiment, index) => {
          const delay = Math.min(index + 1, 6)
          if (runnable[experiment.slug] === false) {
            return (
              <HomeExperimentPlaceholderCard
                key={experiment.slug}
                experiment={experiment}
                required={requirements[experiment.slug] ?? []}
                delay={delay}
              />
            )
          }
          return (
            <HomeExperimentCard
              key={experiment.slug}
              experiment={experiment}
              delay={delay}
              referrer="/design-experiments"
              lastSlugKey="gallery-last-slug"
            />
          )
        })}
      </div>
    </div>
  )
}
