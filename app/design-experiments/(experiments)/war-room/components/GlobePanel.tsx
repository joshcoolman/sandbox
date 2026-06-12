'use client'

// The Ambrosia DEFCON homage: a rotating dot-matrix globe built from the
// SAME coastline module as the flat map (the one-data-spine detail). Slow
// ambient spin; when a target is engaged the rotation eases to face their
// longitude with a framerate-independent exponential approach, holds, then
// drifts back.

import { useRef } from 'react'
import { useHud } from '../lib/context'
import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { sampleDots } from '../data/coastlines'
import { latLonToVec3, toRad, toDeg, shortestAngleDiff } from '../lib/geo'
import { CIN } from '../lib/hud'

const AMBIENT = 0.00021 // rad/ms (~30s per revolution)
const TILT = 0.34
const COS_T = Math.cos(TILT)
const SIN_T = Math.sin(TILT)

type GlobeGeom = {
  dots: Float32Array // xyz triples
  grat: Float32Array[] // polylines, xyz triples
  sx: Float32Array
  sy: Float32Array
  depth: Float32Array
}

function buildGeom(): GlobeGeom {
  const ll = sampleDots(1)
  const n = ll.length / 2
  const dots = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const v = latLonToVec3(ll[i * 2 + 1], ll[i * 2])
    dots[i * 3] = v[0]
    dots[i * 3 + 1] = v[1]
    dots[i * 3 + 2] = v[2]
  }
  const grat: Float32Array[] = []
  for (let m = 0; m < 12; m++) {
    const lon = m * 30 - 180
    const line = new Float32Array(41 * 3)
    for (let i = 0; i <= 40; i++) {
      const v = latLonToVec3(-90 + (i / 40) * 180, lon)
      line.set(v, i * 3)
    }
    grat.push(line)
  }
  for (const lat of [-60, -30, 0, 30, 60]) {
    const line = new Float32Array(61 * 3)
    for (let i = 0; i <= 60; i++) {
      const v = latLonToVec3(lat, -180 + (i / 60) * 360)
      line.set(v, i * 3)
    }
    grat.push(line)
  }
  return { dots, grat, sx: new Float32Array(n), sy: new Float32Array(n), depth: new Float32Array(n) }
}

export function GlobePanel() {
  const { hud } = useHud()
  const geomRef = useRef<GlobeGeom | null>(null)
  const rotRef = useRef({ rotY: 0.6, vel: AMBIENT })

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    if (!geomRef.current) geomRef.current = buildGeom()
    const g = geomRef.current
    const rot = rotRef.current

    // --- rotation: engaged ease vs ambient drift
    const engagement = hud.frame.engagement
    if (engagement) {
      const want = -toRad(engagement.target.lon)
      rot.rotY += shortestAngleDiff(want, rot.rotY) * (1 - Math.exp(-clock.dt / 450))
      rot.vel = 0
    } else {
      rot.vel += (AMBIENT - rot.vel) * (1 - Math.exp(-clock.dt / 1200))
      rot.rotY += rot.vel * clock.dt
    }

    const cosA = Math.cos(rot.rotY)
    const sinA = Math.sin(rot.rotY)
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) / 2 - 16

    const tx = (x: number, y: number, z: number): [number, number, number] => {
      const x1 = x * cosA - y * sinA
      const y1 = x * sinA + y * cosA
      // tilt about the screen-x axis
      const depth = x1 * COS_T + z * SIN_T
      const sz = -x1 * SIN_T + z * COS_T
      return [cx + y1 * R, cy - sz * R, depth]
    }

    ctx.clearRect(0, 0, w, h)

    // sphere limb
    ctx.strokeStyle = 'rgba(57, 215, 224, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.stroke()

    // graticule — one batched path, front segments only
    ctx.strokeStyle = 'rgba(57, 215, 224, 0.1)'
    ctx.beginPath()
    for (const line of g.grat) {
      let prevFront = false
      for (let i = 0; i < line.length / 3; i++) {
        const [px, py, d] = tx(line[i * 3], line[i * 3 + 1], line[i * 3 + 2])
        const front = d > 0.01
        if (front && prevFront) ctx.lineTo(px, py)
        else ctx.moveTo(px, py)
        prevFront = front
      }
    }
    ctx.stroke()

    // coastline dots — transform once, then 3 brightness buckets (3 fills)
    const n = g.dots.length / 3
    for (let i = 0; i < n; i++) {
      const [px, py, d] = tx(g.dots[i * 3], g.dots[i * 3 + 1], g.dots[i * 3 + 2])
      g.sx[i] = px
      g.sy[i] = py
      g.depth[i] = d
    }
    const alphas = [0.22, 0.5, 0.88]
    for (let b = 0; b < 3; b++) {
      ctx.fillStyle = `rgba(57, 215, 224, ${alphas[b]})`
      const lo = b / 3
      const hi = (b + 1) / 3
      for (let i = 0; i < n; i++) {
        const d = g.depth[i]
        if (d <= 0.02) continue
        if (d > lo && d <= hi + (b === 2 ? 1 : 0)) ctx.fillRect(g.sx[i] - 0.8, g.sy[i] - 0.8, 1.6, 1.6)
      }
    }

    // engaged target marker
    if (engagement) {
      const t = engagement.target
      const v = latLonToVec3(t.lat, t.lon)
      const [px, py, d] = tx(v[0], v[1], v[2])
      if (d > 0.02) {
        const elapsed = clock.t - engagement.engagedAt
        const pulse = 0.6 + 0.4 * Math.sin(elapsed * 0.005)
        ctx.fillStyle = `rgba(240, 160, 48, ${pulse.toFixed(3)})`
        ctx.fillRect(px - 1.6, py - 1.6, 3.2, 3.2)
        const ringAge = (elapsed % 1400) / 1400
        ctx.strokeStyle = `rgba(240, 160, 48, ${(0.6 * (1 - ringAge)).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(px, py, 3 + ringAge * 14, 0, Math.PI * 2)
        ctx.stroke()
        if (elapsed > CIN.DECODE) {
          ctx.font = fonts.mono(8.5)
          ctx.fillStyle = 'rgba(240, 160, 48, 0.8)'
          ctx.fillText(t.codename, px + 8, py - 6)
        }
      }
    }

    // readout
    ctx.font = fonts.mono(8.5)
    ctx.fillStyle = 'rgba(57, 215, 224, 0.45)'
    const deg = ((toDeg(rot.rotY) % 360) + 360) % 360
    ctx.fillText(`ROT ${deg.toFixed(0).padStart(3, '0')}`, 8, h - 8)
    ctx.fillText(engagement ? `TRK ${engagement.target.codename}` : 'TRK AMBIENT', 8, h - 20)
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
