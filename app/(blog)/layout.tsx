import { Permanent_Marker } from 'next/font/google'
import SiteFooter from '@/app/components/SiteFooter'
import styles from './blog.module.css'

// Handwriting face for the sticky-note stack ("note to self") on the blog index.
// The StickyNoteStack reads var(--font-marker); the standalone sticky-notes
// experiment provides its own, so the blog layout supplies it here.
const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-marker',
})

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.blogLayout} ${permanentMarker.variable}`}>
      {children}
      <SiteFooter className={styles.blogFooter} />
    </div>
  )
}
