// The coordination store. Two tiers, mirroring seismic-mesh's philosophy:
//
//  - Mutable frame state (strikes, impacts, engagement, glitch window, log
//    ring buffer): read by canvas draw callbacks every frame, mutated by
//    event channels and click handlers. Never touches React.
//  - Subscribed state (DEFCON level, active target id): changes rarely,
//    drives DOM panels through a tiny subscribe/snapshot store.

import { strikeArc, type LatLon } from './geo'
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
  /**
   * Per-bird landing scatter in screen px, applied to the impact at arrival
   * (converted to (u,v) with the live map size in the draw loop). Lets a salvo
   * to one target bloom overlapping blast bubbles instead of stacking exactly.
   */
  impactOffsetPx?: { x: number; y: number } | null
}

export type Impact = { u: number; v: number; at: number; life: number }

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

  function launchStrike(
    from: LatLon,
    to: LatLon,
    now: number,
    flightMs: number,
    impactOffsetPx: { x: number; y: number } | null = null,
  ): Strike {
    const { pts, breaks } = strikeArc(from, to)
    const strike: Strike = {
      id: `TRJ-${(strikeSeq++ % 900) + 100}`,
      pts,
      breaks,
      launchedAt: now,
      flightMs,
      from,
      to,
      arrivedAt: null,
      impactOffsetPx,
    }
    strikes.push(strike)
    // Cap the board: shed the oldest faded trail first, never an in-flight bird.
    if (strikes.length > 72) {
      const idx = strikes.findIndex(s => s.arrivedAt !== null)
      strikes.splice(idx === -1 ? 0 : idx, 1)
    }
    return strike
  }

  // One "shot" = a tight salvo: 3-4 birds converging on the SAME target,
  // fired in rapid succession and landing a few px apart so the blast bubbles
  // overlap instead of stacking. Each bird gets its own origin (via pickFrom)
  // so the trajectories read as separate arcs, not one stacked line. The lead
  // bird lands dead-center; the rest scatter. Returns the lead (for the log id).
  function launchCluster(
    pickFrom: (i: number) => LatLon,
    to: LatLon,
    now: number,
    flightMs: number,
    rng: () => number,
    count = 3 + Math.floor(rng() * 2),
  ): Strike {
    let lead: Strike | null = null
    for (let i = 0; i < count; i++) {
      const launchAt = now + i * (50 + rng() * 90) // rapid succession
      const offset =
        i === 0
          ? null
          : (() => {
              const a = rng() * Math.PI * 2
              const r = 4 + rng() * 8 // ~4-12px from center
              return { x: Math.cos(a) * r, y: Math.sin(a) * r }
            })()
      // slight flight variance so heads arrive staggered, not in lockstep
      const s = launchStrike(pickFrom(i), to, launchAt, flightMs * (0.9 + rng() * 0.2), offset)
      if (i === 0) lead = s
    }
    return lead as Strike
  }

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

    launchStrike,
    launchCluster,

    pushLog(text: string, level: LogLevel, at: number) {
      logs.push({ seq: logSeq++, text, level, at })
      if (logs.length > 48) logs.splice(0, logs.length - 48)
    },
  }
}

export type HudStore = ReturnType<typeof createHudStore>
