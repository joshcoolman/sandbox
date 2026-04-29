import type { Experiment } from '@/app/types/experiments'
import styles from './HomeExperimentCard.module.css'

function formatDate(dateStr: string): string {
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

interface Props {
  experiment: Experiment
  required: string[]
  delay?: number
}

/**
 * Server-rendered card variant for experiments that require env vars not set
 * in the local environment. Same shape/dimensions as `HomeExperimentCard`
 * so the home grid stays visually consistent — just dashed thumb + a list
 * of the required env keys.
 */
export default function HomeExperimentPlaceholderCard({ experiment, required, delay }: Props) {
  return (
    <div
      className={`${styles.card} ${styles.cardPlaceholder}`}
      data-delay={delay}
      aria-label={`${experiment.title} — requires environment setup`}
    >
      <div className={styles.placeholderThumb} aria-hidden>
        <span className={styles.placeholderThumbLabel}>requires setup</span>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <time>{formatDate(experiment.date)}</time>
        </div>
        <h3 className={styles.title}>{experiment.title}</h3>
        <p className={styles.subtitle}>{experiment.subtitle}</p>
        <div className={styles.placeholderEnvList}>
          {required.map((envKey) => (
            <code key={envKey} className={styles.placeholderEnv}>
              {envKey}
            </code>
          ))}
        </div>
        <p className={styles.placeholderHint}>
          Set these in <code>.env.local</code> to enable.
        </p>
      </div>
    </div>
  )
}
