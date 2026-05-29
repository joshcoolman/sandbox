'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Menu, X } from 'lucide-react'
import CurtainLink from '@/app/components/CurtainLink'
import type { NewsSummary } from '@/lib/news/types'
import styles from '../news.module.css'

interface NewsSidebarProps {
  summaries: NewsSummary[]
}

function formatDate(slug: string): string {
  const date = new Date(slug + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function NewsSidebar({ summaries }: NewsSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <>
      <div className={styles.sidebarBack}>
        <CurtainLink href="/" className={styles.sidebarBackLink} curtainTransition={true} curtainReverse={true}>
          <ChevronLeft size={14} />
          Back
        </CurtainLink>
      </div>
      <div className={styles.sidebarHeader}>
        <Link href="/news" className={styles.sidebarTitle}>
          News
        </Link>
      </div>
      <div className={styles.sidebarItems}>
        {summaries.map((summary) => {
          const href = `/news/${summary.slug}`
          const isActive = pathname === href
          return (
            <Link
              key={summary.slug}
              href={href}
              className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.sidebarLinkDate}>{formatDate(summary.slug)}</span>
              {summary.videoCount > 0 && (
                <span className={styles.sidebarLinkCount}>{summary.videoCount} videos</span>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div
        className={`${styles.sidebarOverlay} ${mobileOpen ? styles.sidebarOverlayVisible : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <nav className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        {content}
      </nav>
    </>
  )
}
