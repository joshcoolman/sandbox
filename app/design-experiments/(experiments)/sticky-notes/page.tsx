import type { Metadata } from 'next'
import path from 'path'
import { Permanent_Marker } from 'next/font/google'
import { experimentMetadata } from '@/lib/experiments/metadata'
import { getAllNotes } from './loadNotes'
import StickyNoteStack from './components/StickyNoteStack'
import styles from './styles.module.css'

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-marker',
})

export const metadata: Metadata = experimentMetadata('sticky-notes')

export default function StickyNotesExperiment() {
  const notes = getAllNotes(path.join(process.cwd(), 'app/design-experiments/(experiments)/sticky-notes/data'))

  return (
    <div className={`${styles.page} ${permanentMarker.variable}`}>
      <p className={styles.description}>
        A stack of post-it notes. Click to open the lightbox, then click near
        the card to flip through. Click left to go back, far away to close.
        Content is loaded from markdown files -- the consumer decides where the
        notes directory lives.
      </p>

      <div className={styles.showcase}>
        <StickyNoteStack notes={notes} />
      </div>
    </div>
  )
}
