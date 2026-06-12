// Seeded target dossiers — the readout.ts pattern from seismic-mesh: an
// integer hash of the target's coordinates feeds mulberry32, so every field
// is plausible, stable per target, and never touches SSR.

import { mulberry32, hash2 } from '../lib/rng'
import { fmtLatLon, sectorCode } from '../lib/geo'
import type { Target } from './targets'

export type Dossier = {
  fields: { k: string; v: string }[]
  threat: number // 0-100
  status: string
  ref: string
}

const FIRST = ['ARDEN', 'VESPER', 'KOLAR', 'MIRELLE', 'SOKOL', 'THANE', 'IMRE', 'CALLAS'] as const
const LAST = ['MARSH', 'VAINE', 'OKONKWO', 'BERG', 'SALT', 'REYES', 'KOVAC', 'LINDQVIST'] as const
const AFFIL = ['HELIX SYNDICATE', 'BUREAU NINE', 'RED MERIDIAN', 'THE CONSORTIUM', 'UNAFFILIATED', 'SABLE COURT'] as const

export function makeDossier(t: Target): Dossier {
  const rng = mulberry32(hash2(t.lat * 100, t.lon * 100) ^ Math.imul(t.seed, 2654435761))
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]

  const threat = 35 + Math.floor(rng() * 62)
  const status = threat > 85 ? 'PRIORITY ALPHA' : threat > 65 ? 'ACTIVE TRACK' : 'PASSIVE WATCH'
  const seenLat = t.lat + (rng() - 0.5) * 1.4
  const seenLon = t.lon + (rng() - 0.5) * 1.4
  const freq = 1200 + Math.floor(rng() * 7000)
  const ref = `INTCP/${Math.floor(rng() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0')}`

  return {
    threat,
    status,
    ref,
    fields: [
      { k: 'ALIAS', v: `${pick(FIRST)} ${pick(LAST)}` },
      { k: 'AFFILIATION', v: pick(AFFIL) },
      { k: 'LAST SEEN', v: fmtLatLon(seenLat, seenLon) },
      { k: 'SECTOR', v: sectorCode(t.lat, t.lon) },
      { k: 'SIGNAL', v: `${freq}MHZ INTERMITTENT` },
      { k: 'STATUS', v: status },
    ],
  }
}
