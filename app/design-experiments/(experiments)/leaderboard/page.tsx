import { Sora } from 'next/font/google'
import { Leaderboard } from './components/Leaderboard'
import { SAMPLE_PLAYERS } from './data/players'
import styles from './page.module.css'

const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700'] })

export default function LeaderboardPage() {
  return (
    <div className={`${styles.page} ${sora.className}`}>
      <Leaderboard initialPlayers={SAMPLE_PLAYERS} />
    </div>
  )
}
