import type { Metadata } from 'next'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { KoboldBlaster } from './components/KoboldBlaster'
import './styles.css'

export const metadata: Metadata = experimentMetadata('kobold-blaster')

export default function KoboldBlasterPage() {
  return (
    <>
      <KoboldBlaster />
      <div className="kobold-credits">
        <span>Code &mdash; <strong>Claude Code</strong></span>
        <span className="kobold-credits-divider">·</span>
        <span>Art &mdash; <strong>GPT-image-1</strong></span>
        <span className="kobold-credits-divider">·</span>
        <span>Characters &mdash; <strong>Dungeon Crawler Carl</strong> by Matt Dinniman</span>
      </div>
    </>
  )
}
