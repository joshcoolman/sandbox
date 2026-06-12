// Procedural system chatter for the ticker. Alert probability scales with
// DEFCON — the room gets louder as the condition worsens.

import type { LogLevel } from '../lib/hud'

const INFO = [
  'SAT {n} HANDSHAKE OK',
  'KEYSET ROTATION COMPLETE',
  'PERIMETER SWEEP {sec} CLEAR',
  'UPLINK LATENCY {ms}MS',
  'TELEMETRY FRAME {hex} SYNCED',
  'BALLISTIC TABLES RECOMPUTED',
  'ARRAY {ab} GAIN NOMINAL',
  'CARRIER LOCK {freq}MHZ',
  'DEEP FIELD SCAN {pct}% COMPLETE',
  'CHECKSUM PASS / CORE {n}',
  'RELAY {ab}{n} COLD STANDBY',
  'ORBITAL EPHEMERIS UPDATED',
] as const

const WARN = [
  'PACKET LOSS SECTOR {sec}',
  'THERMAL DRIFT ARRAY {ab}',
  'SIGNAL DEGRADED / RETUNING',
  'TRACK {hex} INTERMITTENT',
  'BUFFER SATURATION {pct}%',
] as const

const ALERT = [
  'UNIDENTIFIED CONTACT {sec}',
  'INTERCEPT SOLUTION COMPUTED',
  'EW INTERFERENCE SPIKE {sec}',
  'TRACK {hex} ACCELERATING',
  'CRYPTO CHALLENGE FAILED x{d}',
] as const

function fill(template: string, rng: () => number): string {
  return template
    .replace('{n}', String(1 + Math.floor(rng() * 9)))
    .replace('{d}', String(2 + Math.floor(rng() * 4)))
    .replace('{ms}', String(40 + Math.floor(rng() * 400)))
    .replace('{pct}', String(10 + Math.floor(rng() * 89)))
    .replace('{freq}', String(1200 + Math.floor(rng() * 7000)))
    .replace('{hex}', Math.floor(rng() * 0xffff).toString(16).toUpperCase().padStart(4, '0'))
    .replace('{ab}', 'AB'[Math.floor(rng() * 2)])
    .replace('{sec}', `${String.fromCharCode(65 + Math.floor(rng() * 12))}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}`)
}

export function makeLogLine(rng: () => number, defcon: number): { text: string; level: LogLevel } {
  const alertP = defcon <= 2 ? 0.3 : defcon === 3 ? 0.15 : 0.05
  const r = rng()
  const pool = r < alertP ? ALERT : r < alertP + 0.16 ? WARN : INFO
  const level: LogLevel = pool === ALERT ? 'alert' : pool === WARN ? 'warn' : 'info'
  return { text: fill(pool[Math.floor(rng() * pool.length)], rng), level }
}
