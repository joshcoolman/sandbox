import type { ReactNode } from 'react'
import styles from './x.module.css'

// Scopes a dark background to the /x route only — the rest of the site is light mode.
export default function XLayout({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>
}
