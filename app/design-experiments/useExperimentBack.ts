'use client'

import { useEffect, useState } from 'react'

export interface ExperimentBack {
  href: string
  label: string
}

const DEFAULT_BACK: ExperimentBack = {
  href: '/design-experiments',
  label: 'Design',
}

export function useExperimentBack(): ExperimentBack {
  const [back, setBack] = useState<ExperimentBack>(DEFAULT_BACK)

  useEffect(() => {
    const referrer = sessionStorage.getItem('experiment-referrer')
    if (referrer === '/') {
      setBack({ href: '/', label: 'Home' })
    }
  }, [])

  return back
}
