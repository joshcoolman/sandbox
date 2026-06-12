// The coordination store. Two tiers, mirroring seismic-mesh's philosophy:
//
//  - Mutable frame state (strikes, impacts, engagement, glitch window, log
//    ring buffer): read by canvas draw callbacks every frame, mutated by
//    event channels and click handlers. Never touches React.
//  - Subscribed state (DEFCON level, active target id): changes rarely,
//    drives DOM panels through a tiny subscribe/snapshot store.

import { greatCircle, type LatLon } from './geo'
import type { Target } from '../data/targets'

export type Strike = {
  id: string
  pts: Float32Array // normalized equirect (u,v) pairs along the great circle
  breaks: number[] // dateline split indices
  launchedAt: number
  flightMs: number
  from: LatLon
  to: LatLon
  /** Set on arrival — the full arc persists and fades (WarGames afterglow). */
  arrivedAt: number | null
}

export type Impact = { u: number; v: number; at: number }

export type LogLevel = 'info' | 'warn' | 'alert'
export type LogLine = { seq: number; text: string; level: LogLevel; at: number }

export type Engagement = { target: Target; engagedAt: number }

export type HudSnapshot = { defcon: number; activeTargetId: string | null }

// Cinematic phase boundaries (ms after engagedAt) — the single source of
// truth every consumer (dossier DOM, map ping, globe rotation) derives from.
export const CIN = {
  LOCK: 280,
  DECODE: 520,
  HOLD: 2400,
  RELEASE: 8000,
  FADE: 600,
} as const

export function createHudStore() {
  const strikes: Strike[] = []
  const impacts: Impact[] = []
  const logs: LogLine[] = []
  let strikeSeq = 41
  let logSeq = 0

  // Mutable per-frame fields — canvas-side consumers read these directly.
  const frame = {
    engagement: null as Engagement | null,
    glitchUntil: 0,
  }

  let snapshot: HudSnapshot = { defcon: 4, activeTargetId: null }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach(l => l())

  return {
    strikes,
    impacts,
    logs,
    frame,

    subscribe(l: () => void) {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    getSnapshot: () => snapshot,

    setDefcon(d: number) {
      if (d !== snapshot.defcon) {
        snapshot = { ...snapshot, defcon: d }
        emit()
      }
    },

    engage(target: Target, now: number) {
      frame.engagement = { target, engagedAt: now }
      snapshot = { ...snapshot, activeTargetId: target.id }
      emit()
    },

    disengage() {
      frame.engagement = null
      if (snapshot.activeTargetId !== null) {
        snapshot = { ...snapshot, activeTargetId: null }
        emit()
      }
    },

    /**
     * Early dismiss (outside click / Escape): rewind engagedAt so the
     * cinematic jumps straight to its RELEASE phase — the dossier, map
     * crosshair, and globe all fade out in sync, then the provider's
     * release tick disengages as usual.
     */
    releaseNow(now: number) {
      const e = frame.engagement
      if (e && now - e.engagedAt < CIN.RELEASE) {
        e.engagedAt = now - CIN.RELEASE
      }
    },

    launchStrike(from: LatLon, to: LatLon, now: number, flightMs: number): Strike {
      const { pts, breaks } = greatCircle(from, to)
      const strike: Strike = {
        id: `TRJ-${(strikeSeq++ % 900) + 100}`,
        pts,
        breaks,
        launchedAt: now,
        flightMs,
        from,
        to,
        arrivedAt: null,
      }
      strikes.push(strike)
      // Cap the board: shed the oldest faded trail first, never an in-flight bird.
      if (strikes.length > 56) {
        const idx = strikes.findIndex(s => s.arrivedAt !== null)
        strikes.splice(idx === -1 ? 0 : idx, 1)
      }
      return strike
    },

    pushLog(text: string, level: LogLevel, at: number) {
      logs.push({ seq: logSeq++, text, level, at })
      if (logs.length > 48) logs.splice(0, logs.length - 48)
    },
  }
}

export type HudStore = ReturnType<typeof createHudStore>
