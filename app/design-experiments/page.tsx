'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Space_Grotesk, Bitter, Lora, Space_Mono } from 'next/font/google'
import { ChevronLeft } from 'lucide-react'
import styles from './page.module.css'
import type { Experiment } from '../types/experiments'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

const bitter = Bitter({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-bitter',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-lora',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
})

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('gallery-visited')
    const experiments = containerRef.current?.querySelectorAll(`.${styles.experiment}`)

    if (hasVisited) {
      // Skip animation on return visits — show everything immediately
      experiments?.forEach((el) => el.classList.add(styles.visible))
      return
    }

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
  }, [])

  const experiments: Experiment[] = [
    {
      slug: 'day-at-a-glance',
      date: 'February 12, 2026',
      title: 'Day at a Glance',
      description: 'Time-aware workday timeline with dynamic now-line that tracks real time. Features 9am-5pm schedule with colored event bars that partially fill as the hour progresses -- gray above the now-line, color below. Past events auto-dim. Built with CSS grid, inline linear-gradient for the fill effect, and 60-second interval updates.',
      screenshot: '/screenshots/day-at-a-glance.png',
      tags: ['CSS Grid', 'Timeline', 'Dynamic State', 'Dark Theme']
    },
    {
      slug: 'sourcing-image',
      date: 'February 11, 2026',
      title: 'Sourcing Image',
      description: 'Fully agentic editorial layout -- the only inputs were "use the image library, pick a topic, make it beautiful." Claude sourced 10 images from a personal library, invented the article topic, wrote the copy, and designed a magazine-style layout with varied image treatments: full-bleed hero, side-by-side pairs, sticky insets, captioned features, and an asymmetric photo grid. Cormorant Garamond and DM Sans on warm off-white.',
      screenshot: '/screenshots/sourcing-image.png',
      tags: ['Agentic Design', 'Editorial Layout', 'Image Sourcing', 'Magazine']
    },
    {
      slug: 'crossfit-challenge-2',
      date: 'February 9, 2026',
      title: 'CrossFit Design Challenge: Day 2',
      description: 'Day 2 leveled up the same four designer personas with new constraints: dark mode across all designs, meaningful animation (glitch effects, scroll reveals, chart animations), and data visualization (SVG charts, radial indicators, bar graphs). Same gym content, same personas, dramatically elevated execution. Pure CSS animations, no external libraries.',
      screenshot: '/screenshots/crossfit-challenge-2.png',
      tags: ['Dark Mode', 'CSS Animation', 'Data Viz', 'Agent Teams']
    },
    {
      slug: 'crossfit-challenge',
      date: 'February 8, 2026',
      title: 'CrossFit Design Challenge',
      description: 'Four autonomous AI agents each designed a CrossFit homepage for IRON REPUBLIC gym, working in parallel with distinct aesthetic personas. Brutal/industrial, minimal/refined, editorial/magazine, and tech/data-forward approaches -- all built agenically, then refined with human-in-the-loop collaboration. Includes editorial writeup on the process.',
      screenshot: '/screenshots/crossfit-challenge.png',
      tags: ['Agent Teams', 'Design Challenge', 'CSS Modules', 'Multi-Layout']
    },
    {
      slug: 'youre-doing-it-wrong',
      date: 'February 8, 2026',
      title: 'You\'re Doing It Wrong',
      description: 'Long-form blog post exploring why "AI-powered design tools" miss the point. Argues that agentic apps apply old paradigms to new technology, while the real shift is learning to work directly with agents through code. Features typography from Spec Sheet with editorial layout and accent highlights.',
      screenshot: '/screenshots/youre-doing-it-wrong.png',
      tags: ['Blog Post', 'Typography', 'Editorial', 'Long-Form Content']
    },
    {
      slug: 'terminator',
      date: 'February 6, 2026',
      title: 'Terminator - Text Scramble',
      description: 'Interactive terminal-style text scramble effect with two-phase animation. Enter custom text to see it scramble chaotically for 1 second, then resolve sequentially line-by-line. Features balanced line breaking and automatic uppercase conversion. Default text: Ghost in the Shell quote on identity and consciousness.',
      screenshot: '/screenshots/terminator.png',
      tags: ['Text Animation', 'Terminal UI', 'Interactive', 'Split-Flap Effect']
    },
    {
      slug: 'geist-pixel',
      date: 'February 6, 2026',
      title: 'Geist Pixel',
      description: 'Typographic specimen featuring Vercel\'s Geist Pixel display font with 5 bitmap-inspired variants. Includes a split-flap text scramble effect using Space Mono - solid wall of characters that resolves line-by-line into readable text. Click to replay the animation.',
      screenshot: '/screenshots/geist-pixel.png',
      tags: ['Typography', 'Split-Flap Effect', 'Text Animation', 'Monospace']
    },
    {
      slug: 'color-spec',
      date: 'February 6, 2026',
      title: 'Brand Guidelines',
      description: 'Interactive brand guidelines with live color and typography customization. Features animated Activity line chart and Analytics bar chart widgets with CSS-only animations. Click the gear icon for a push-in sidebar with color pickers using Chroma.js scale generation and 9 curated font pairings. All changes persist via localStorage.',
      screenshot: '/screenshots/color-spec.png',
      tags: ['React Components', 'Animated Charts', 'Color Systems', 'Typography']
    },
    {
      slug: 'spec-sheet',
      date: 'February 2, 2026',
      title: 'Spec Sheet',
      description: 'Type specimen sheet with interactive font pairing selector. Features size scale, weight ramp, character set display, drop cap pull quote, and colorful pairing cards inspired by the Color Spec experiment. Text-based controls with underline hover animations.',
      screenshot: '/screenshots/spec-sheet.png',
      tags: ['Typography', 'Font Pairings', 'Dark/Light Mode', 'Type Specimen']
    },
    {
      slug: 'blend',
      date: 'February 2, 2026',
      title: 'Blend',
      description: 'Swiss modernist gradient specimen system featuring organic mesh gradients via SVG blur technique. Includes 27 gradient cards across linear and mesh styles, systematic labeling, scroll-triggered animations, and an analytics dashboard mockup.',
      screenshot: '/screenshots/blend.png',
      tags: ['Gradient Study', 'SVG Mesh', 'Swiss Design', 'Scroll Animation']
    }
  ]

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${spaceGrotesk.variable} ${bitter.variable} ${lora.variable} ${spaceMono.variable}`}
    >
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          <ChevronLeft size={14} />
          Back
        </Link>
      </div>
      <h1 className={styles.title}>Design Experiments</h1>
      <p className={styles.subtitle}>
        A sandbox for exploring visual design systems, widgets, and layouts
      </p>

      <div className={styles.rule}></div>

      {experiments.map((experiment, index) => (
        <div
          key={experiment.slug}
          className={styles.experiment}
          data-delay={Math.min(index + 1, 6)}
        >
          <div className={styles.experimentPreviewContainer}>
            <Link href={`/${experiment.slug}`}>
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
              <Link href={`/${experiment.slug}`}>{experiment.title}</Link>
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

      <div className={styles.footer}>
        <p>
          Design experiments by Josh Coolman •{' '}
          <a href="https://github.com/joshcoolman-smc/sandbox">GitHub</a>
        </p>
      </div>
    </div>
  )
}
