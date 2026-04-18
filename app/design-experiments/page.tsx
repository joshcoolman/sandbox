'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Space_Grotesk } from 'next/font/google'
import { ChevronLeft } from 'lucide-react'
import CurtainLink from '@/app/components/CurtainLink'
import styles from './page.module.css'
import { experiments } from '@/lib/experiments/data'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('gallery-visited')
    const experiments = containerRef.current?.querySelectorAll(`.${styles.experiment}`)

    if (hasVisited) {
      // Skip animation on return visits — show everything immediately
      experiments?.forEach((el) => el.classList.add(styles.visible))
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

      experiments?.forEach((experiment) => observer.observe(experiment))

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

      {experiments.map((experiment, index) => (
        <div
          key={experiment.slug}
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
      ))}

    </div>
  )
}
