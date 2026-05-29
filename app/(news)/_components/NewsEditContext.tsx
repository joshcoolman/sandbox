'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface NewsEditValue {
  editing: boolean
  setEditing: (v: boolean) => void
}

const NewsEditContext = createContext<NewsEditValue>({
  editing: false,
  setEditing: () => {},
})

export function useNewsEdit() {
  return useContext(NewsEditContext)
}

/**
 * True only when the page is being served locally (dev or local prod preview).
 * Hidden on the deployed site. Resolved on the client after mount so it never
 * leaks into the SSR/prerendered markup.
 */
export function useIsLocal() {
  const [local, setLocal] = useState(false)
  useEffect(() => {
    const h = window.location.hostname
    setLocal(
      h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local'),
    )
  }, [])
  return local
}

export default function NewsEditProvider({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false)
  return (
    <NewsEditContext.Provider value={{ editing, setEditing }}>
      {children}
    </NewsEditContext.Provider>
  )
}
