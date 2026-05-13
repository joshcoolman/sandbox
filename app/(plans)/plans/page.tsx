import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPlans } from '@/lib/plans/loadPlans'
import StatusChip from '../_components/StatusChip'
import styles from '../plans.module.css'

export const metadata: Metadata = {
  title: 'Plans',
  description: 'Design and architecture plans worked out in conversation, rendered for review.',
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function PlansIndex() {
  const plans = getAllPlans()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Plans</span>
          </div>
          <h1 className={styles.title}>Plans</h1>
          <p className={styles.subtitle}>
            Design and architecture plans worked out in conversation with Claude, rendered for review.
            Coding in public — the thinking, not just the result.
          </p>
        </header>

        {plans.length === 0 ? (
          <div className={styles.empty}>
            No plans yet. Drop a markdown file in <code>plans/</code>.
          </div>
        ) : (
          <ul className={styles.list}>
            {plans.map((plan) => (
              <li key={plan.slug} className={styles.item}>
                <Link href={`/plans/${plan.slug}`}>
                  <div className={styles.itemHeader}>
                    <StatusChip status={plan.status} />
                    <span className={styles.itemTitle}>{plan.title}</span>
                  </div>
                  <div className={styles.itemMeta}>{formatDate(plan.modified)} · {plan.slug}.md</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
