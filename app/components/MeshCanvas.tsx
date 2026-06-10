'use client'

import { useEffect, useRef } from 'react'

// Home page backdrop v2 — structured hex mesh with a render-only traveling
// ripple, descended from the seismic-mesh experiment at backdrop amplitude.
// Sibling of NetworkCanvas (same prop interface); the home page swaps between
// the two with a one-line import change.

interface MeshCanvasProps {
  className?: string
}

const CELL_SIZE = 84              // sparser than the experiment's 30 — it's a backdrop
const ROW_SPACING = CELL_SIZE * (Math.sqrt(3) / 2)
const JITTER = CELL_SIZE * 0.22   // static per-node scatter so the grid reads organic
const TERRAIN_T = 1.4
const ALPHA_BUCKETS = 12

// Camera directly above — tiny renderZ amplitudes keep lensing under ~2%
const CAM_Z = 2200

// Whole-field rotation about screen center — one revolution per ~63s
const ROT_SPEED = 0.0001          // radians per ms

// Ambient swell — interfering low-frequency waves that morph rather than
// march: crests form where they stack and dissolve as phases drift apart.
// Render-only. Bigger amplitude than a single ripple but slower, so it reads
// as breathing, not busy.
const SWELL_AMP = 480
const SWELL_SPEED = 0.0007        // radians per ms

// Per-node XY sway — the field breathes at rest
const SWAY_AMP = 2.5              // px
const SWAY_SPEED = 0.00035        // radians per ms

// Click surge — render-only, no node physics. Not a rapid ripple: a broad,
// slow swell that pulls and pushes the field at the same tempo as the ambient
// flow, with barely one oscillation across its width.
const WAVE_AMP = 260
const WAVE_SIGMA = 170            // px — broad half-width of the moving swell
const WAVE_SPEED = 0.22           // px/ms — slow-motion expansion
const WAVE_K = 0.006              // rad/px — single gentle pull/push, no rings
const WAVE_ATTACK = 700           // ms — swell eases in from nothing, no jump on click
const WAVE_LIFETIME = 4800        // ms
const MAX_WAVES = 6

// Warm home palette (NetworkCanvas colors)
const EDGE_RGB = '182,164,143'    // #B6A48F
const NODE_RGB = '198,126,94'     // #C67E5E
const EDGE_ALPHA_BASE = 0.05
const EDGE_ALPHA_RANGE = 0.25
const NODE_ALPHA_BASE = 0.18
const NODE_ALPHA_RANGE = 0.5

// Three waves at different scales/directions/speeds; their interference makes
// broad crests wander and reshape instead of scrolling uniformly. Output ~[-1,1].
function swell(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 0.0035 + t * 0.6) * Math.cos(y * 0.0028 - t * 0.4) +
    Math.sin((x * 0.6 + y) * 0.0021 + t * 0.9) * 0.7 +
    Math.cos((x - y * 0.7) * 0.0052 - t * 0.5) * 0.4
  ) / 2.1
}

function terrain(nx: number, ny: number, t: number): number {
  const x = nx * 7
  const y = ny * 5
  const h1 = Math.sin(x * 0.8 + t * 0.9) * Math.cos(y * 0.6 + t * 0.7)
  const h2 = Math.sin(x * 1.5 - y * 1.1 + t * 0.5) * 0.5
  const h3 = Math.cos(x * 0.4 + y * 1.3 + t * 0.3) * 0.35
  const h4 = Math.sin(x * 2.2 + y * 0.7 + t * 0.8) * 0.15
  return (h1 + h2 + h3 + h4) / 2.0
}

interface MeshNode {
  x: number
  y: number
  swayPhase: number
  swayRate: number
}

interface Wave {
  x: number
  y: number
  startTime: number
}

function buildMesh(W: number, H: number) {
  // Cover the viewport diagonal — the field rotates, so corners must never
  // expose bare background at any angle
  const S = Math.hypot(W, H) + CELL_SIZE * 2
  const cols = Math.ceil(S / CELL_SIZE) + 1
  const rows = Math.ceil(S / ROW_SPACING) + 1
  const startX = (W - S) / 2
  const startY = (H - S) / 2

  const nodes: MeshNode[] = []
  const heights: number[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rx = startX + col * CELL_SIZE + (row % 2) * (CELL_SIZE / 2)
        + (Math.random() * 2 - 1) * JITTER
      const ry = startY + row * ROW_SPACING + (Math.random() * 2 - 1) * JITTER
      nodes.push({
        x: rx,
        y: ry,
        swayPhase: Math.random() * Math.PI * 2,
        swayRate: 0.7 + Math.random() * 0.6,
      })
      heights.push(terrain(rx / W, ry / H, TERRAIN_T))
    }
  }

  const edges: [number, number][] = []
  const idx = (r: number, c: number) => r * cols + c
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (col < cols - 1) edges.push([idx(row, col), idx(row, col + 1)])
      if (row < rows - 1) {
        if (row % 2 === 0) {
          if (col > 0) edges.push([idx(row, col), idx(row + 1, col - 1)])
          edges.push([idx(row, col), idx(row + 1, col)])
        } else {
          edges.push([idx(row, col), idx(row + 1, col)])
          if (col < cols - 1) edges.push([idx(row, col), idx(row + 1, col + 1)])
        }
      }
    }
  }

  return { nodes, edges, heights }
}

export default function MeshCanvas({ className }: MeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const wavesRef = useRef<Wave[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let mesh = buildMesh(window.innerWidth, window.innerHeight)

    function resize() {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth * devicePixelRatio
      canvas.height = window.innerHeight * devicePixelRatio
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(devicePixelRatio, devicePixelRatio)
      mesh = buildMesh(window.innerWidth, window.innerHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    // Document-level so content cards stay fully clickable — the ripple fires
    // alongside whatever the click actually did
    function handleClick(e: MouseEvent) {
      const waves = wavesRef.current
      waves.push({ x: e.clientX, y: e.clientY, startTime: performance.now() })
      if (waves.length > MAX_WAVES) waves.splice(0, waves.length - MAX_WAVES)
    }
    document.addEventListener('click', handleClick)

    const edgeBuckets: number[][] = Array.from({ length: ALPHA_BUCKETS }, () => [])
    const nodeBuckets: number[][] = Array.from({ length: ALPHA_BUCKETS }, () => [])
    const EDGE_STYLES: string[] = []
    const NODE_STYLES: string[] = []
    const NODE_RADII: number[] = []
    for (let b = 0; b < ALPHA_BUCKETS; b++) {
      const f = (b + 0.5) / ALPHA_BUCKETS
      EDGE_STYLES.push(`rgba(${EDGE_RGB},${(EDGE_ALPHA_BASE + f * EDGE_ALPHA_RANGE).toFixed(3)})`)
      NODE_STYLES.push(`rgba(${NODE_RGB},${(NODE_ALPHA_BASE + f * NODE_ALPHA_RANGE).toFixed(3)})`)
      NODE_RADII.push(1.1 + f * 1.5)
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return
      const W = window.innerWidth
      const H = window.innerHeight
      const { nodes, edges, heights } = mesh

      ctx.clearRect(0, 0, W, H)

      // Cull dead waves once per frame
      if (wavesRef.current.length) {
        wavesRef.current = wavesRef.current.filter(
          w => timestamp - w.startTime < WAVE_LIFETIME,
        )
      }
      const waves = wavesRef.current

      // Project: rotate the field about screen center, then renderZ = ambient
      // swell + click waves; brightness rides renderZ. Rotated (screen-space)
      // coords feed the swell and wave math so clicks land where the cursor is
      // and the swell pattern stays screen-anchored while the mesh turns under it.
      const rot = timestamp * ROT_SPEED
      const cosA = Math.cos(rot)
      const sinA = Math.sin(rot)
      const tAmb = timestamp * SWELL_SPEED
      const tSway = timestamp * SWAY_SPEED
      const sigma2 = 2 * WAVE_SIGMA * WAVE_SIGMA
      const px = new Float32Array(nodes.length)
      const py = new Float32Array(nodes.length)
      const glow = new Float32Array(nodes.length) // 0..1 — base terrain + crest lift
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const ox = node.x - W / 2
        const oy = node.y - H / 2
        const rx = W / 2 + ox * cosA - oy * sinA
        const ry = H / 2 + ox * sinA + oy * cosA
        const ambient = SWELL_AMP * swell(rx, ry, tAmb)
        let waveZ = 0
        for (const w of waves) {
          const age = timestamp - w.startTime
          const front = age * WAVE_SPEED
          const dx = rx - w.x
          const dy = ry - w.y
          const phase = Math.hypot(dx, dy) - front
          const ring = Math.exp(-(phase * phase) / sigma2)
          const a = Math.min(1, age / WAVE_ATTACK)
          const attack = a * a * (3 - 2 * a) // smoothstep ease-in
          const env = attack * Math.max(0, 1 - age / WAVE_LIFETIME)
          waveZ += WAVE_AMP * ring * Math.cos(phase * WAVE_K) * env
        }
        // Negative = toward camera. Ambient swells toward; the click wave is
        // always a depression — it presses the field away (and dims it).
        const renderZ = -ambient + waveZ
        const scale = CAM_Z / (CAM_Z + renderZ)
        const sway = Math.sin(tSway * node.swayRate + node.swayPhase) * SWAY_AMP
        px[i] = W / 2 + (rx - W / 2) * scale + sway
        py[i] = H / 2 + (ry - H / 2) * scale + sway * 0.6
        const g = 0.5 + heights[i] * 0.4 + (-renderZ / (SWELL_AMP + WAVE_AMP)) * 0.45
        glow[i] = g < 0 ? 0 : g > 1 ? 1 : g
      }

      // Edges batched by glow bucket — one stroke per bucket
      for (let b = 0; b < ALPHA_BUCKETS; b++) edgeBuckets[b].length = 0
      for (const [a, b] of edges) {
        const g = (glow[a] + glow[b]) / 2
        const bucket = Math.min(ALPHA_BUCKETS - 1, (g * ALPHA_BUCKETS) | 0)
        edgeBuckets[bucket].push(a, b)
      }
      ctx.lineWidth = 0.75
      for (let b = 0; b < ALPHA_BUCKETS; b++) {
        const bucket = edgeBuckets[b]
        if (bucket.length === 0) continue
        ctx.strokeStyle = EDGE_STYLES[b]
        ctx.beginPath()
        for (let k = 0; k < bucket.length; k += 2) {
          ctx.moveTo(px[bucket[k]], py[bucket[k]])
          ctx.lineTo(px[bucket[k + 1]], py[bucket[k + 1]])
        }
        ctx.stroke()
      }

      // Nodes batched by glow bucket — radius swells slightly with the crest
      for (let b = 0; b < ALPHA_BUCKETS; b++) nodeBuckets[b].length = 0
      for (let i = 0; i < nodes.length; i++) {
        const bucket = Math.min(ALPHA_BUCKETS - 1, (glow[i] * ALPHA_BUCKETS) | 0)
        nodeBuckets[bucket].push(i)
      }
      for (let b = 0; b < ALPHA_BUCKETS; b++) {
        const bucket = nodeBuckets[b]
        if (bucket.length === 0) continue
        const r = NODE_RADII[b]
        ctx.fillStyle = NODE_STYLES[b]
        ctx.beginPath()
        for (const i of bucket) {
          ctx.moveTo(px[i] + r, py[i])
          ctx.arc(px[i], py[i], r, 0, Math.PI * 2)
        }
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
