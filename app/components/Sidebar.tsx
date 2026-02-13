'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './Sidebar.module.css'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/design-experiments', label: 'Design Experiments' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        <div className={`${styles.hamburgerLine} ${open ? styles.hamburgerLineTop : ''}`} />
        <div className={`${styles.hamburgerLine} ${open ? styles.hamburgerLineMid : ''}`} />
        <div className={`${styles.hamburgerLine} ${open ? styles.hamburgerLineBot : ''}`} />
      </button>

      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
        onClick={() => setOpen(false)}
      />

      <nav className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <ul className={styles.navList}>
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
