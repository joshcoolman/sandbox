import { Space_Mono } from 'next/font/google'
import CurtainLink from './CurtainLink'
import SkullEasterEgg from './SkullEasterEgg'
import ThemeToggle from '../(blog)/_components/ThemeToggle'
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
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Link Worthy
          </CurtainLink>
        </nav>
        <div className={styles.icons}>
          <a
            href="https://github.com/joshcoolman/sandbox"
            className={styles.iconLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <SkullEasterEgg className={styles.skull} variant="dark" />
          <ThemeToggle className={styles.themeToggle} size={18} />
        </div>
      </div>
    </footer>
  )
}
