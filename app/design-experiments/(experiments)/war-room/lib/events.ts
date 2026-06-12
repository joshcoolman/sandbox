// Ambient event channels — the autopilot that keeps the wall alive. One
// mechanism for all recurring randomness: channels polled from the shared
// rAF virtual clock. No setInterval anywhere, so hiding the tab freezes
// every pending event with zero special-casing.

import type { Clock, TickFn } from './scheduler'
import type { HudStore } from './hud'
import { sectorCode } from './geo'
import { BASES, HOTSPOTS } from '../data/bases'
import { makeLogLine } from '../data/logLines'

type Channel = {
  minMs: number
  maxMs: number
  nextAt: number
  fire: (clock: Clock) => void
  /** Optional interval multiplier — lets DEFCON bias a channel's cadence. */
  scale?: () => number
}

export function createAmbientChannels(hud: HudStore, rng: () => number, calm = false): TickFn {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
  const shuffled = <T,>(arr: readonly T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function fireStrike(clock: Clock) {
    // WarGames climax cadence: every fire is a tight salvo — 3-4 birds
    // converging on one target in rapid succession, landing a few px apart so
    // the blast bubbles overlap (vs. earlier shots that stacked on the exact
    // spot). Each bird launches from a DIFFERENT base, so the trajectories read
    // as separate arcs fanning into the impact cluster. The ticker only hears
    // about a fraction — logging every bird would drown it.
    const to = rng() < 0.4 ? pick(BASES) : pick(HOTSPOTS)
    const origins = shuffled(BASES).filter(b => b !== to) // distinct bases, never the target itself
    const lead = hud.launchCluster(i => origins[i % origins.length], to, clock.t, 2600 + rng() * 1400, rng)
    if (rng() < 0.3) {
      hud.pushLog(`LAUNCH ${lead.id} ${origins[0].name} > ${sectorCode(to.lat, to.lon)}`, 'warn', clock.t)
    }
  }

  function fireDefcon(clock: Clock) {
    const d = hud.getSnapshot().defcon
    const next = Math.min(5, Math.max(2, d + (rng() < 0.55 ? -1 : 1)))
    if (next === d) return
    hud.setDefcon(next)
    hud.pushLog(`CONDITION CHANGE > DEFCON ${next}`, next <= 2 ? 'alert' : 'warn', clock.t)
    hud.pushLog(next < d ? 'ALERT POSTURE ESCALATED' : 'POSTURE RELAXED / STANDING DOWN', 'info', clock.t)
  }

  const channels: Channel[] = [
    {
      minMs: 380,
      maxMs: 1100,
      nextAt: 0,
      fire: fireStrike,
      scale: () => (hud.getSnapshot().defcon <= 2 ? 0.45 : 1),
    },
    {
      minMs: 600,
      maxMs: 2100,
      nextAt: 0,
      fire: c => {
        const line = makeLogLine(rng, hud.getSnapshot().defcon)
        hud.pushLog(line.text, line.level, c.t)
      },
    },
    {
      minMs: 45000,
      maxMs: 90000,
      nextAt: 0,
      fire: fireDefcon,
    },
  ]

  // The glitch flicker is pure spectacle — drop it under prefers-reduced-motion.
  if (!calm) {
    channels.push({
      minMs: 9000,
      maxMs: 24000,
      nextAt: 0,
      fire: c => {
        hud.frame.glitchUntil = c.t + 80 + rng() * 80
      },
    })
  }

  return clock => {
    for (const c of channels) {
      if (c.nextAt === 0) {
        // First fires staggered so the wall wakes up piecewise, not all at once.
        c.nextAt = clock.t + 400 + rng() * c.minMs
        continue
      }
      if (clock.t >= c.nextAt) {
        c.fire(clock)
        const scale = c.scale ? c.scale() : 1
        c.nextAt = clock.t + (c.minMs + rng() * (c.maxMs - c.minMs)) * scale
      }
    }
  }
}
