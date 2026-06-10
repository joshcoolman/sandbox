// Plausible seismic telemetry derived from the click point. Coordinate-seeded
// so repeat clicks in the same area feel related, with a dash of random so the
// instrument stays alive. Client-only (runs on click) — Math.random here can
// never cause a hydration mismatch.

export type Readout = {
  title: string
  magnitude: string
  rows: { k: string; v: string }[]
  ref: string
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export function makeReadout(x: number, y: number, W: number, H: number): Readout {
  const u = clamp01(x / W)
  const v = clamp01(y / H)
  const seed = ((x * 73856093) ^ (y * 19349663)) >>> 0

  const mag = 4.6 + ((seed % 1000) / 1000) * 2.1 + Math.random() * 0.3
  const elevM = Math.round(900 + (1 - v) * 3200 + mag * 180 + Math.random() * 120)
  const lat = (32 + (1 - v) * 16 + Math.random() * 0.4).toFixed(2)
  const lon = (98 + u * 24 + Math.random() * 0.4).toFixed(2)
  const radius = (mag * 1.9 + Math.random() * 1.2).toFixed(1)
  const depth = (2.4 + (seed % 97) / 12 + Math.random()).toFixed(1)

  const refHex = ((seed ^ (Math.floor(Math.random() * 0xffff) << 8)) >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')

  return {
    title: 'SEISMIC EVENT',
    magnitude: `M ${mag.toFixed(1)}`,
    rows: [
      { k: 'ELEVATION', v: `+${elevM.toLocaleString('en-US')} M` },
      { k: 'EPICENTER', v: `${lat}N ${lon}W` },
      { k: 'RADIUS', v: `${radius} KM` },
      { k: 'DEPTH', v: `${depth} KM` },
      { k: 'STATUS', v: 'HOLDING' },
    ],
    ref: `REF 0x${refHex}`,
  }
}
