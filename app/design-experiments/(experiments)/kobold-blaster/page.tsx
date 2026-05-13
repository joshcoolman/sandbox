import type { Metadata } from 'next'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { KoboldBlaster } from './components/KoboldBlaster'
import './styles.css'

export const metadata: Metadata = experimentMetadata('kobold-blaster')

export default function KoboldBlasterPage() {
  return <KoboldBlaster />
}
