// Fullscreen immersive experiment -- lives outside (experiments) wrapper
// because the infinite canvas needs to control the full viewport
import { InfiniteCanvas } from './components/InfiniteCanvas'

export default function MoodboardPage() {
  return <InfiniteCanvas />
}
