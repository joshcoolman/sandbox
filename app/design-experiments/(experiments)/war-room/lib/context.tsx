'use client'

// HudProvider wires the engine together: one scheduler, one hud store, the
// ambient event channels, and the cinematic release tick. Panels grab both
// via useHud(). The provider is arrangement-agnostic — wrap any composition
// of panels and they coordinate.

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { createScheduler, type Scheduler } from './scheduler'
import { createHudStore, CIN, type HudStore } from './hud'
import { createAmbientChannels } from './events'
import { mulberry32 } from './rng'

type HudCtx = { scheduler: Scheduler; hud: HudStore }

const Ctx = createContext<HudCtx | null>(null)

export function HudProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HudCtx | null>(null)
  if (!ref.current) {
    // Construction is pure (no browser APIs, no randomness) — safe during SSR.
    ref.current = { scheduler: createScheduler(), hud: createHudStore() }
  }
  const { scheduler, hud } = ref.current

  useEffect(() => {
    const detach = scheduler.attach()
    // Client-only seed — hydration-safe by construction.
    const rng = mulberry32(((performance.now() * 1000) | 0) ^ 0x9e3779b9)
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const removeAmbient = scheduler.add(createAmbientChannels(hud, rng, calm))

    // Cinematic release: once the dossier fade completes, clear the
    // engagement so the globe's ambient drift resumes and the dossier unmounts.
    const removeRelease = scheduler.add(clock => {
      const e = hud.frame.engagement
      if (e && clock.t - e.engagedAt > CIN.RELEASE + CIN.FADE) hud.disengage()
    })

    return () => {
      removeAmbient()
      removeRelease()
      detach()
    }
  }, [scheduler, hud])

  return <Ctx.Provider value={ref.current}>{children}</Ctx.Provider>
}

export function useHud(): HudCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useHud must be used inside <HudProvider>')
  return ctx
}
