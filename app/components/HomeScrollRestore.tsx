'use client'

import { useEffect } from 'react'

export default function HomeScrollRestore() {
  useEffect(() => {
    const saved = sessionStorage.getItem('home-last-slug')
    if (!saved) return
    sessionStorage.removeItem('home-last-slug')
    const el = document.getElementById(saved)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [])

  return null
}
