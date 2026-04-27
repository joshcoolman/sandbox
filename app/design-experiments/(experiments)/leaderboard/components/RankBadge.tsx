import { Trophy, Medal } from 'lucide-react'
import styles from './RankBadge.module.css'

interface RankBadgeProps {
  rank: number
}

export function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <div className={styles.medal} data-rank="1">
        <Trophy size={26} strokeWidth={2.2} fill="currentColor" fillOpacity={0.15} />
      </div>
    )
  }
  if (rank === 2 || rank === 3) {
    return (
      <div className={styles.medal} data-rank={rank}>
        <Medal size={24} strokeWidth={2.2} fill="currentColor" fillOpacity={0.12} />
      </div>
    )
  }
  return <div className={styles.rank}>{rank}</div>
}
