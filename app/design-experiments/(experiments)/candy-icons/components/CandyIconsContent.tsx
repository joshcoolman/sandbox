'use client'

import { CandyIconGrid } from './CandyIconGrid'
import styles from '../page.module.css'

export function CandyIconsContent() {
  return (
    <main className={styles.page}>
      <CandyIconGrid />
    </main>
  )
}
