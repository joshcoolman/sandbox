'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import styles from '../blog.module.css'

const STORAGE_KEY = 'site-theme'

// Global light/dark toggle. Sets data-theme on <html> so every base-site surface
// (home, blog, docs, news) responds; persists across navigation via localStorage.
// The no-FOUC inline script in app/layout.tsx applies the saved value before paint.
export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
  }, [])

  function toggle() {
    const next = !isLight
    setIsLight(next)
    const theme = next ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }

  return (
    <button
      className={styles.themeToggle}
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  )
}
