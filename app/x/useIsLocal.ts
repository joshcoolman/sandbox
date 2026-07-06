'use client'

import { useEffect, useState } from 'react'

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
