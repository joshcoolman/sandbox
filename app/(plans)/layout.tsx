import { getAllPlans } from '@/lib/plans/loadPlans'
import PlansSidebar from './_components/PlansSidebar'
import styles from './plans.module.css'

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  const plans = getAllPlans()

  return (
    <div className={styles.layout}>
      <PlansSidebar plans={plans} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
