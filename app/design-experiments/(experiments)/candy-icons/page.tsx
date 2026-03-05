'use client'

import { CandyIconGrid } from './components/CandyIconGrid'
import styles from './page.module.css'

export default function CandyIconsPage() {
  return (
    <main className={styles.page}>
      <CandyIconGrid />
    </main>
  )
}
