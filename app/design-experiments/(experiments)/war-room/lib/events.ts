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

  function fireStrike(clock: Clock) {
    // WarGames climax cadence: every fire is 1 bird with a good chance of a
    // salvo behind it. The ticker only hears about a fraction — at this rate
    // logging every launch would drown the channel.
    let count = 0
    do {
      const from = pick(BASES)
      const others = BASES.filter(b => b !== from)
      const to = rng() < 0.4 ? pick(others) : pick(HOTSPOTS)
      const strike = hud.launchStrike(from, to, clock.t + count * (60 + rng() * 140), 2600 + rng() * 1400)
      if (rng() < 0.3) {
        hud.pushLog(`LAUNCH ${strike.id} ${from.name} > ${sectorCode(to.lat, to.lon)}`, 'warn', clock.t)
      }
      count++
    } while (rng() < 0.35 && count < 4)
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
