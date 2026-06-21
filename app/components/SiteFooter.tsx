import { Space_Mono } from 'next/font/google'
import { Heart } from 'lucide-react'
import CurtainLink from './CurtainLink'
import SkullEasterEgg from './SkullEasterEgg'
import ThemeToggle from '../(blog)/_components/ThemeToggle'
import { GitHubIcon } from './icons'
import styles from './SiteFooter.module.css'

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={`${styles.footer} ${spaceMono.className}${className ? ` ${className}` : ''}`}>
      <div className={styles.rule} />
      <div className={styles.row}>
        <nav className={styles.nav}>
          <CurtainLink href="/design-experiments" className={styles.navLink} curtainTransition curtainReverse>Design</CurtainLink>
          <CurtainLink href="/blog" className={styles.navLink} curtainTransition>Blog</CurtainLink>
          <CurtainLink href="/docs" className={styles.navLink} curtainTransition>Docs</CurtainLink>
          <CurtainLink href="/news" className={styles.navLink} curtainTransition>News</CurtainLink>
          <CurtainLink href="/recommended" className={styles.navLink} curtainTransition>
            <Heart size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            Link Worthy
          </CurtainLink>
        </nav>
        <div className={styles.icons}>
          <GitHubIcon
            href="https://github.com/joshcoolman/sandbox"
            label="View on GitHub"
            className={styles.iconLink}
            width={20}
            height={20}
          />
          <SkullEasterEgg className={styles.skull} variant="dark" />
          <ThemeToggle className={styles.themeToggle} size={18} />
        </div>
      </div>
    </footer>
  )
}
