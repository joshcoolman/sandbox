'use client'

import Image from 'next/image'
import CurtainLink from './CurtainLink'
import type { Experiment } from '@/app/types/experiments'
import styles from './HomeExperimentCard.module.css'

function formatDate(dateStr: string): string {
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

interface Props {
  experiment: Experiment
  delay?: number
  /** Where the experiment's back button should return to. Defaults to home. */
  referrer?: string
  /** sessionStorage key used for scroll restoration on the referring page. */
  lastSlugKey?: string
}

export default function HomeExperimentCard({
  experiment,
  delay,
  referrer = '/',
  lastSlugKey = 'home-last-slug',
}: Props) {
  return (
    <CurtainLink
      id={experiment.slug}
      href={`/design-experiments/${experiment.slug}`}
      className={styles.card}
      data-delay={delay}
      curtainTransition={true}
      onClick={() => {
        sessionStorage.setItem('experiment-referrer', referrer)
        sessionStorage.setItem(lastSlugKey, experiment.slug)
      }}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={experiment.screenshot}
          alt={experiment.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={styles.image}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <time>{formatDate(experiment.date)}</time>
        </div>
        <h3 className={styles.title}>{experiment.title}</h3>
        <p className={styles.subtitle}>{experiment.subtitle}</p>
      </div>
    </CurtainLink>
  )
}
