import type { Metadata } from 'next'
import { Archivo, Space_Mono } from 'next/font/google'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { AdaptiveGrid } from './components/AdaptiveGrid'

const archivo = Archivo({ subsets: ['latin'], variable: '--ag-display' })
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--ag-mono',
})

export const metadata: Metadata = experimentMetadata('adaptive-grid')

export default function AdaptiveGridPage() {
  return (
    <div className={`${archivo.variable} ${spaceMono.variable}`}>
      <AdaptiveGrid />
    </div>
  )
}
