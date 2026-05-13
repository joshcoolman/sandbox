'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Menu, X } from 'lucide-react'
import CurtainLink from '@/app/components/CurtainLink'
import type { PlanSummary } from '@/lib/plans/loadPlans'
import StatusChip from './StatusChip'
import styles from '../plans.module.css'

interface PlansSidebarProps {
  plans: PlanSummary[]
}

export default function PlansSidebar({ plans }: PlansSidebarProps) {
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
        <Link href="/plans" className={styles.sidebarTitle}>
          Plans
        </Link>
      </div>
      <div className={styles.sidebarItems}>
        {plans.map((plan) => {
          const href = `/plans/${plan.slug}`
          const isActive = pathname === href
          return (
            <Link
              key={plan.slug}
              href={href}
              className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.sidebarLinkTitle}>{plan.title}</span>
              <span className={styles.sidebarLinkMeta}>
                <StatusChip status={plan.status} />
              </span>
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
