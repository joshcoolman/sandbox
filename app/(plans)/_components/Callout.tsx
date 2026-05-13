import styles from '../plans.module.css'

type CalloutType = 'note' | 'decision' | 'caveat' | 'tldr'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}

const CLASS_BY_TYPE: Record<CalloutType, string> = {
  note: styles.calloutNote,
  decision: styles.calloutDecision,
  caveat: styles.calloutCaveat,
  tldr: styles.calloutTldr,
}

const LABEL_BY_TYPE: Record<CalloutType, string> = {
  note: 'Note',
  decision: 'Decision',
  caveat: 'Caveat',
  tldr: 'TL;DR',
}

export default function Callout({ type = 'note', title, children }: CalloutProps) {
  return (
    <aside className={`${styles.callout} ${CLASS_BY_TYPE[type]}`}>
      <div className={styles.calloutLabel}>{title ?? LABEL_BY_TYPE[type]}</div>
      <div className={styles.calloutBody}>{children}</div>
    </aside>
  )
}
