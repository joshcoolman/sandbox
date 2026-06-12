'use client'

// Full-wall CRT treatment: scanlines + vignette as composited CSS layers
// (zero per-frame cost), plus the glitch flicker — a scheduler tick compares
// hud.frame.glitchUntil to the virtual clock and toggles a class on the wall
// root via the DOM. No React state churn at frame rate.

import { useEffect, useRef } from 'react'
import { useHud } from '../lib/context'

export function CrtOverlay() {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scheduler, hud } = useHud()

  useEffect(() => {
    const wall = ref.current?.parentElement
    if (!wall) return
    const remove = scheduler.add(clock => {
      wall.classList.toggle('is-glitching', clock.t < hud.frame.glitchUntil)
    })
    return () => {
      remove()
      wall.classList.remove('is-glitching')
    }
  }, [scheduler, hud])

  return (
    <div ref={ref} className="wr-crt" aria-hidden>
      <div className="wr-scanlines" />
      <div className="wr-vignette" />
      <div className="wr-glitch-bands" />
    </div>
  )
}
