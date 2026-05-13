import type { PlanStatus } from '@/lib/plans/loadPlans'
import styles from '../plans.module.css'

const STATUS_CLASS: Record<PlanStatus, string> = {
  exploratory: styles.statusExploratory,
  'in-progress': styles.statusInProgress,
  implemented: styles.statusImplemented,
  archived: styles.statusArchived,
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  exploratory: 'Exploratory',
  'in-progress': 'In progress',
  implemented: 'Implemented',
  archived: 'Archived',
}

export default function StatusChip({ status }: { status: PlanStatus }) {
  return <span className={`${styles.statusChip} ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}
