import type { Metadata } from 'next'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { KoboldBlaster } from './components/KoboldBlaster'
import styles from './page.module.css'

export const metadata: Metadata = experimentMetadata('kobold-blaster')

export default function KoboldBlasterPage() {
  return (
    <>
      <KoboldBlaster className={styles.demo} />
      <div className={styles.credits}>
        <span>Code &mdash; <strong>Claude Code</strong></span>
        <span className={styles.divider}>·</span>
        <span>Art &mdash; <strong>GPT-image-1</strong></span>
        <span className={styles.divider}>·</span>
        <span>Characters &mdash; <strong>Dungeon Crawler Carl</strong> by Matt Dinniman</span>
      </div>
    </>
  )
}
