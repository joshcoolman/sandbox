// fullscreen: true in experiment data -- the (experiments) layout skips its
// header/footer chrome so the infinite canvas controls the full viewport
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
