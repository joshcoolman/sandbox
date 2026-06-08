import type { Metadata } from 'next'
import { Bitter, Lora } from 'next/font/google'
import styles from './layout.module.css'

// The base site moved to Hanken/Fraunces, but a couple of experiments (e.g.
// moodboard) consume the old global --font-bitter / --font-lora that the root
// layout used to provide. They render only under this route, so we supply those
// fonts here — keeping the experiments unchanged without re-bloating the base site.
const bitter = Bitter({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-bitter',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: 'Design Experiments',
  description: 'Interactive design experiments by Josh Coolman — layouts, typography, animation, and visual systems built with code.',
}

export default function DesignExperimentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Experiment PAGES stay dark in both site themes: the per-experiment frame
    // leaves a gutter that falls through to this background, and the experiments
    // were authored on (and look best against) a dark ground. The gallery index
    // overrides this with its own data-theme="light" paper surface — so only the
    // experiments themselves keep the dark treatment.
    <div className={`${styles.layout} ${bitter.variable} ${lora.variable}`} data-theme="dark">
      {children}
    </div>
  )
}
