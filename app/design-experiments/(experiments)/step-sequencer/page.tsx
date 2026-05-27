import type { Metadata } from 'next'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { Sequencer } from './components/Sequencer'
import styles from './page.module.css'

export const metadata: Metadata = experimentMetadata('step-sequencer')

export default function StepSequencerPage() {
  return (
    <div className={styles.stage}>
      <Sequencer />
    </div>
  )
}
