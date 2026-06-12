'use client'

// Iron Man-style equipment readout: a hand-built vertex/edge wireframe
// satellite tumbling slowly in perspective, with status callouts pinned to
// projected vertices. Visual-only panel.

import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { easeInOutSine } from '../lib/geo'

// --- model ------------------------------------------------------------
// Axes: z up, x toward the dish, y along the solar arrays.

const V: number[][] = []
const E: Array<[number, number]> = []

function vert(x: number, y: number, z: number): number {
  V.push([x, y, z])
  return V.length - 1
}

function edge(a: number, b: number) {
  E.push([a, b])
}

// body box
{
  const xs = [-0.55, 0.55]
  const ys = [-0.4, 0.4]
  const zs = [-0.4, 0.4]
  const idx: number[] = []
  for (const x of xs) for (const y of ys) for (const z of zs) idx.push(vert(x, y, z))
  // idx order: (x,y,z) nested loops -> 8 corners
  const [a, b, c, d, e, f, g, h] = idx
  edge(a, b); edge(c, d); edge(e, f); edge(g, h) // z edges
  edge(a, c); edge(b, d); edge(e, g); edge(f, h) // y edges
  edge(a, e); edge(b, f); edge(c, g); edge(d, h) // x edges
}

// mast + antenna tip
{
  const m0 = vert(0, 0, 0.4)
  const m1 = vert(0, 0, 1.05)
  edge(m0, m1)
  const t1 = vert(-0.18, 0, 0.88)
  const t2 = vert(0.18, 0, 0.88)
  edge(m1, t1); edge(m1, t2)
}

// dish: neck, ring, spokes, apex
{
  const neck0 = vert(0.55, 0, 0)
  const center = vert(0.95, 0, 0)
  edge(neck0, center)
  const ring: number[] = []
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2
    ring.push(vert(0.95, Math.cos(th) * 0.45, Math.sin(th) * 0.45))
  }
  for (let i = 0; i < 8; i++) edge(ring[i], ring[(i + 1) % 8])
  const apex = vert(1.32, 0, 0)
  for (let i = 0; i < 8; i += 2) edge(ring[i], apex)
  for (let i = 1; i < 8; i += 2) edge(ring[i], center)
}

// solar arrays (both sides): rect + cross ribs
for (const side of [-1, 1]) {
  const yIn = 0.4 * side
  const yOut = 2.1 * side
  const a = vert(-0.3, yIn, 0)
  const b = vert(0.3, yIn, 0)
  const c = vert(0.3, yOut, 0)
  const d = vert(-0.3, yOut, 0)
  edge(a, b); edge(b, c); edge(c, d); edge(d, a)
  for (const f of [0.33, 0.66]) {
    const y = (yIn + (yOut - yIn) * f)
    edge(vert(-0.3, y, 0), vert(0.3, y, 0))
  }
}

const APEX_IDX = V.findIndex(v => v[0] === 1.32)
const MAST_IDX = V.findIndex(v => v[2] === 1.05)
const PANEL_IDX = V.findIndex(v => v[1] === 2.1)

const PERSP = 5

// Movie inspection cycle: hold -> quick 180 yaw -> hold -> vertical flip ->
// hold -> flip back to horizontal. Eased maneuvers between dead stops.
const MANEUVERS: ReadonlyArray<{ ms: number; yaw?: number; pitch?: number }> = [
  { ms: 1600 },
  { ms: 1100, yaw: Math.PI },
  { ms: 1300 },
  { ms: 1100, pitch: Math.PI },
  { ms: 1300 },
  { ms: 1100, pitch: -Math.PI },
]
const CYCLE_MS = MANEUVERS.reduce((s, m) => s + m.ms, 0)

/** Walk the maneuver table for a virtual time -> {yaw, pitch}. Stateless. */
function attitude(t: number): { yaw: number; pitch: number } {
  const cycles = Math.floor(t / CYCLE_MS)
  let yaw = Math.PI * cycles // each cycle ends 180 further around
  let pitch = 0
  let tt = t - cycles * CYCLE_MS
  for (const m of MANEUVERS) {
    if (tt >= m.ms) {
      yaw += m.yaw ?? 0
      pitch += m.pitch ?? 0
      tt -= m.ms
      continue
    }
    const f = easeInOutSine(tt / m.ms)
    yaw += (m.yaw ?? 0) * f
    pitch += (m.pitch ?? 0) * f
    break
  }
  return { yaw, pitch }
}

export function SatellitePanel() {
  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    ctx.clearRect(0, 0, w, h)
    const t = clock.t
    const att = attitude(t)
    const yaw = att.yaw
    // constant 3/4 viewing tilt + the maneuver pitch + a whisper of drift
    const pitch = 0.32 + att.pitch + Math.sin(t * 0.00019) * 0.05
    const cosA = Math.cos(yaw)
    const sinA = Math.sin(yaw)
    const cosT = Math.cos(pitch)
    const sinT = Math.sin(pitch)
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.27

    const px = new Float32Array(V.length)
    const py = new Float32Array(V.length)
    for (let i = 0; i < V.length; i++) {
      const [x, y, z] = V[i]
      const x1 = x * cosA - y * sinA
      const y1 = x * sinA + y * cosA
      const depth = x1 * cosT + z * sinT
      const sz = -x1 * sinT + z * cosT
      const f = PERSP / (PERSP - depth)
      px[i] = cx + y1 * R * f
      py[i] = cy - sz * R * f
    }

    // halo pass then crisp pass — layered-stroke glow, no shadowBlur
    for (const [style, width] of [
      ['rgba(57, 215, 224, 0.1)', 2.6],
      ['rgba(57, 215, 224, 0.6)', 1],
    ] as const) {
      ctx.strokeStyle = style
      ctx.lineWidth = width
      ctx.beginPath()
      for (const [a, b] of E) {
        ctx.moveTo(px[a], py[a])
        ctx.lineTo(px[b], py[b])
      }
      ctx.stroke()
    }

    // status callouts pinned to projected vertices
    ctx.font = fonts.mono(8.5)
    const callouts: Array<[number, string, number, number]> = [
      [APEX_IDX, `GAIN ${(31.2 + Math.sin(t * 0.0004) * 0.6).toFixed(1)}DB`, w - 8, 18],
      [PANEL_IDX, `ARRAY-A ${(97.3 + Math.sin(t * 0.00027) * 1.4).toFixed(1)}%`, 8, h - 14],
      [MAST_IDX, `BUS ${(27.4 + Math.sin(t * 0.00033) * 0.3).toFixed(1)}V`, 8, 18],
    ]
    for (const [idx, label, lx, ly] of callouts) {
      const rightAlign = lx > w / 2
      const ax = rightAlign ? lx - ctx.measureText(label).width - 6 : lx + ctx.measureText(label).width + 6
      ctx.strokeStyle = 'rgba(240, 160, 48, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px[idx], py[idx])
      ctx.lineTo(ax, ly - 3)
      ctx.stroke()
      ctx.fillStyle = 'rgba(240, 160, 48, 0.8)'
      if (rightAlign) {
        ctx.textAlign = 'right'
        ctx.fillText(label, lx, ly)
        ctx.textAlign = 'left'
      } else {
        ctx.fillText(label, lx, ly)
      }
      ctx.fillStyle = 'rgba(240, 160, 48, 0.9)'
      ctx.fillRect(px[idx] - 1.2, py[idx] - 1.2, 2.4, 2.4)
    }
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
