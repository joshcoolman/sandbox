'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Space_Grotesk } from 'next/font/google'
import { ChevronLeft } from 'lucide-react'
import CurtainLink from '@/app/components/CurtainLink'
import type { Experiment } from '@/app/types/experiments'
import styles from './page.module.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

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
    const hasVisited = sessionStorage.getItem('gallery-visited')
    const els = containerRef.current?.querySelectorAll(`.${styles.experiment}`)

    if (hasVisited) {
      // Skip animation on return visits — show everything immediately
      els?.forEach((el) => el.classList.add(styles.visible))
    } else {
      sessionStorage.setItem('gallery-visited', '1')

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add(styles.visible)
            }
          })
        },
        { threshold: 0.1 }
      )

      els?.forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }

    // Scroll restoration: check hash or sessionStorage
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
    <div
      ref={containerRef}
      className={`${styles.container} ${spaceGrotesk.variable}`}
    >
      <div className={styles.backRow}>
        <CurtainLink href="/" className={styles.backLink} curtainTransition={true} curtainReverse={true}>
          <ChevronLeft size={14} />
          Back
        </CurtainLink>
      </div>
      <h1 className={styles.title}>Design</h1>
      <p className={styles.subtitle}>
        Like your life depended on it...
      </p>

      <div className={styles.rule}></div>

      {experiments.map((experiment, index) => {
        const isRunnable = runnable[experiment.slug] !== false
        if (!isRunnable) {
          return (
            <PlaceholderRow
              key={experiment.slug}
              experiment={experiment}
              required={requirements[experiment.slug] ?? []}
              index={index}
            />
          )
        }
        return <ExperimentRow key={experiment.slug} experiment={experiment} index={index} />
      })}

    </div>
  )
}

function ExperimentRow({ experiment, index }: { experiment: Experiment; index: number }) {
  return (
    <div
      id={experiment.slug}
      className={styles.experiment}
      data-delay={Math.min(index + 1, 6)}
    >
      <div className={styles.experimentPreviewContainer}>
        <Link
          href={`/design-experiments/${experiment.slug}`}
          onClick={() => {
            sessionStorage.setItem('gallery-last-slug', experiment.slug)
            sessionStorage.setItem('experiment-referrer', '/design-experiments')
          }}
        >
          <Image
            src={experiment.screenshot}
            alt={`${experiment.title} preview`}
            width={280}
            height={210}
            className={styles.experimentPreview}
          />
        </Link>
      </div>
      <div className={styles.experimentContent}>
        <div className={styles.experimentDate}>{experiment.date}</div>
        <h2 className={styles.experimentTitle}>
          <Link
            href={`/design-experiments/${experiment.slug}`}
            onClick={() => {
              sessionStorage.setItem('gallery-last-slug', experiment.slug)
              sessionStorage.setItem('experiment-referrer', '/design-experiments')
            }}
          >{experiment.title}</Link>
        </h2>
        <p className={styles.experimentDescription}>
          {experiment.description}
        </p>
        <div className={styles.experimentTags}>
          {experiment.tags.map((tag) => (
            <span key={`${experiment.slug}-${tag}`} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlaceholderRow({
  experiment,
  required,
  index,
}: {
  experiment: Experiment
  required: string[]
  index: number
}) {
  return (
    <div
      id={experiment.slug}
      className={`${styles.experiment} ${styles.placeholder}`}
      data-delay={Math.min(index + 1, 6)}
      aria-label={`${experiment.title} — requires environment setup`}
    >
      <div className={styles.experimentPreviewContainer}>
        <div className={styles.placeholderThumb} aria-hidden>
          <span className={styles.placeholderThumbLabel}>requires setup</span>
        </div>
      </div>
      <div className={styles.experimentContent}>
        <div className={styles.experimentDate}>{experiment.date}</div>
        <h2 className={styles.experimentTitle}>
          <span className={styles.placeholderTitle}>{experiment.title}</span>
        </h2>
        <p className={styles.experimentDescription}>
          {experiment.subtitle}
        </p>
        <div className={styles.placeholderRequires}>
          <span className={styles.placeholderRequiresLabel}>Needs:</span>
          {required.map((envKey) => (
            <code key={envKey} className={styles.placeholderEnv}>
              {envKey}
            </code>
          ))}
        </div>
        <p className={styles.placeholderHelp}>
          Hidden locally because the required env vars aren&apos;t set. See{' '}
          <code>.env.local.example</code> and the experiment&apos;s README for setup.
        </p>
      </div>
    </div>
  )
}
