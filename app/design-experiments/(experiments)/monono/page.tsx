import type { Metadata } from 'next'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { MononoChat } from './components/MononoChat'
import './styles.css'

export const metadata: Metadata = experimentMetadata('monono')

export default function MononoPage() {
  return <MononoChat />
}
