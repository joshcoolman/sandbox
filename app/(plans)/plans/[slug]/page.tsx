import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPlans, getPlanBySlug } from '@/lib/plans/loadPlans'
import PlansContent from '../../_components/PlansContent'
import StatusChip from '../../_components/StatusChip'
import styles from '../../plans.module.css'

interface PlanPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const { slug } = await params
  const plan = getPlanBySlug(slug)
  if (!plan) return {}
  return {
    title: `${plan.title} — Plans`,
    description: plan.description,
  }
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { slug } = await params
  const plan = getPlanBySlug(slug)

  if (!plan) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/plans" className={styles.backLink}>← All plans</Link>
        <header className={styles.planHeader}>
          <div className={styles.planHeaderMeta}>
            <StatusChip status={plan.status} />
          </div>
          <h1 className={styles.planTitle}>{plan.title}</h1>
        </header>
        <article className={styles.article}>
          <PlansContent content={plan.content} />
        </article>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return getAllPlans().map((plan) => ({ slug: plan.slug }))
}
