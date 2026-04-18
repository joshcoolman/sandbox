// Fullscreen immersive experiment -- lives outside (experiments) wrapper
// because the infinite canvas needs to control the full viewport
import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { InfiniteCanvas } from './components/InfiniteCanvas'
import { BackLinkOverlay } from './components/BackLinkOverlay'

export const metadata: Metadata = experimentMetadata('moodboard');

export default function MoodboardPage() {
  return (
    <>
      <BackLinkOverlay />
      <InfiniteCanvas />
    </>
  )
}
