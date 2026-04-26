import type { Metadata } from 'next'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { AsciiRevealGrid } from './components/AsciiRevealGrid'
import './styles.css'

export const metadata: Metadata = experimentMetadata('ascii-reveal')

export default function AsciiRevealPage() {
  return <AsciiRevealGrid />
}
