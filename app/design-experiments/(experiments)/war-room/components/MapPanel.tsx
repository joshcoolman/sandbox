'use client'

// The DEFCON theater map. Static base layer (coastlines, graticule, bases,
// target dots) pre-rendered to an offscreen canvas and re-baked only on
// resize — including its 3-pass coastline glow, which is therefore free at
// runtime. Per frame: drawImage(base) + strikes + impacts + the engagement
// crosshair. Click anywhere on the map to launch a strike from the nearest
// base to that point.

import { useRef, useCallback } from 'react'
import { useHud } from '../lib/context'
import { useCanvasPanel, type PanelFonts } from '../hooks/useCanvasPanel'
import { decodeRings } from '../data/coastlines'
import { BASES } from '../data/bases'
import { TARGETS } from '../data/targets'
import { CIN } from '../lib/hud'
import { project, unproject, easeInOutSine, sectorCode, fmtLatLon } from '../lib/geo'

type MapRect = { x: number; y: number; w: number; h: number }
const IMPACT_LIFE = 3200 // solid blast bubble: grow fast, fade fast (the board runs much busier now)
const TRAIL_LIFE = 9500 // full-arc afterglow after arrival

function fitMapRect(w: number, h: number): MapRect {
  // Fit a 2:1 equirect frame with padding.
  const pad = 14
  const availW = w - pad * 2
  const availH = h - pad * 2
  const mw = Math.min(availW, availH * 2)
  const mh = mw / 2
  return { x: (w - mw) / 2, y: (h - mh) / 2, w: mw, h: mh }
}

function buildBase(w: number, h: number, dpr: number, rect: MapRect, fonts: PanelFonts): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.round(w * dpr))
  cv.height = Math.max(1, Math.round(h * dpr))
  const ctx = cv.getContext('2d')
  if (!ctx) return cv
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const { x: mx, y: my, w: mw, h: mh } = rect

  // graticule
  ctx.strokeStyle = 'rgba(57, 215, 224, 0.07)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = mx + ((lon + 180) / 360) * mw
    ctx.moveTo(x, my)
    ctx.lineTo(x, my + mh)
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = my + ((90 - lat) / 180) * mh
    ctx.moveTo(mx, y)
    ctx.lineTo(mx + mw, y)
  }
  ctx.stroke()

  // frame + corner ticks
  ctx.strokeStyle = 'rgba(57, 215, 224, 0.25)'
  ctx.strokeRect(mx, my, mw, mh)

  // coastlines — 3-pass glow, baked once
  const rings = decodeRings()
  for (const [style, width] of [
    ['rgba(57, 215, 224, 0.07)', 2.6],
    ['rgba(57, 215, 224, 0.18)', 1.4],
    ['rgba(57, 215, 224, 0.55)', 0.7],
  ] as const) {
    ctx.strokeStyle = style
    ctx.lineWidth = width
    ctx.beginPath()
    for (const ring of rings) {
      let prevU = -1
      for (let i = 0; i < ring.length / 2; i++) {
        const [u, v] = project(ring[i * 2], ring[i * 2 + 1])
        if (i === 0 || Math.abs(u - prevU) > 0.5) ctx.moveTo(mx + u * mw, my + v * mh)
        else ctx.lineTo(mx + u * mw, my + v * mh)
        prevU = u
      }
    }
    ctx.stroke()
  }

  // bases — amber diamonds + labels
  ctx.font = fonts.mono(7.5)
  for (const base of BASES) {
    const [u, v] = project(base.lon, base.lat)
    const x = mx + u * mw
    const y = my + v * mh
    ctx.fillStyle = 'rgba(240, 160, 48, 0.85)'
    ctx.beginPath()
    ctx.moveTo(x, y - 3.2)
    ctx.lineTo(x + 3.2, y)
    ctx.lineTo(x, y + 3.2)
    ctx.lineTo(x - 3.2, y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(240, 160, 48, 0.45)'
    ctx.fillText(base.name, x + 5, y + 2.5)
  }

  // known target positions — dim markers (lit by the engagement crosshair)
  ctx.fillStyle = 'rgba(240, 160, 48, 0.35)'
  for (const t of TARGETS) {
    const [u, v] = project(t.lon, t.lat)
    ctx.fillRect(mx + u * mw - 1.2, my + v * mh - 1.2, 2.4, 2.4)
  }

  return cv
}

type ClickPing = { u: number; v: number; at: number }
const CLICK_PING_LIFE = 550

export function MapPanel() {
  const { hud, scheduler } = useHud()
  const baseRef = useRef<{ cv: HTMLCanvasElement; w: number; h: number } | null>(null)
  const rectRef = useRef<MapRect>({ x: 0, y: 0, w: 1, h: 1 })
  const clicksRef = useRef<ClickPing[]>([])

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    // re-bake static base when panel size changes
    if (!baseRef.current || baseRef.current.w !== w || baseRef.current.h !== h) {
      const rect = fitMapRect(w, h)
      rectRef.current = rect
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      baseRef.current = { cv: buildBase(w, h, dpr, rect, fonts), w, h }
    }
    const { x: mx, y: my, w: mw, h: mh } = rectRef.current

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(baseRef.current.cv, 0, 0, w, h)

    // Mask every live layer to the map frame: the high arcs sail off the top
    // and vanish AT the border, instead of bleeding into the panel margin.
    ctx.save()
    ctx.beginPath()
    ctx.rect(mx, my, mw, mh)
    ctx.clip()

    // --- strikes (WarGames climax style) ---------------------------------
    // In flight: the FULL traversed arc stays lit behind the head. After
    // arrival the whole arc persists as afterglow, fading over TRAIL_LIFE.
    const tracePath = (strike: (typeof hud.strikes)[number], last: number) => {
      ctx.beginPath()
      for (let i = 0; i <= last; i++) {
        const x = mx + strike.pts[i * 2] * mw
        const y = my + strike.pts[i * 2 + 1] * mh
        if (i === 0 || strike.breaks.includes(i)) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }

    const strikes = hud.strikes
    for (let si = strikes.length - 1; si >= 0; si--) {
      const strike = strikes[si]
      const n = strike.pts.length / 2

      if (strike.arrivedAt !== null) {
        // afterglow: full arc, slow fade
        const age = clock.t - strike.arrivedAt
        if (age > TRAIL_LIFE) {
          strikes.splice(si, 1)
          continue
        }
        const fade = Math.pow(1 - age / TRAIL_LIFE, 1.3)
        ctx.strokeStyle = `rgba(57, 215, 224, ${(fade * 0.3).toFixed(3)})`
        ctx.lineWidth = 1
        tracePath(strike, n - 1)
        ctx.stroke()
        continue
      }

      if (clock.t < strike.launchedAt) continue // salvo birds awaiting launch
      const prog = (clock.t - strike.launchedAt) / strike.flightMs
      if (prog >= 1) {
        strike.arrivedAt = clock.t
        const [u, v] = project(strike.to.lon, strike.to.lat)
        // scatter salvo birds a few px so their blast bubbles overlap instead
        // of stacking exactly (offset is in screen px -> normalize by map size)
        const off = strike.impactOffsetPx
        hud.impacts.push({
          u: off ? u + off.x / mw : u,
          v: off ? v + off.y / mh : v,
          at: clock.t,
          // each blast gets its own fade clock so a salvo doesn't wink out as a group
          life: IMPACT_LIFE * (0.7 + Math.random() * 1.0),
        })
        if (Math.random() < 0.25) {
          hud.pushLog(`IMPACT CONFIRMED ${sectorCode(strike.to.lat, strike.to.lon)}`, 'alert', clock.t)
        }
        continue
      }

      const headF = easeInOutSine(prog) * (n - 1)
      const head = Math.floor(headF)

      // full traversed arc
      ctx.strokeStyle = 'rgba(57, 215, 224, 0.32)'
      ctx.lineWidth = 1
      tracePath(strike, head)
      ctx.stroke()

      // hot segment just behind the head
      const hot = Math.max(0, head - 8)
      ctx.strokeStyle = 'rgba(130, 235, 242, 0.8)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = hot; i <= head; i++) {
        const x = mx + strike.pts[i * 2] * mw
        const y = my + strike.pts[i * 2 + 1] * mh
        if (i === hot || strike.breaks.includes(i)) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // head — layered glow, no shadowBlur (too many concurrent birds now)
      const fr = headF - head
      let hu = strike.pts[head * 2]
      let hv = strike.pts[head * 2 + 1]
      if (head < n - 1 && !strike.breaks.includes(head + 1)) {
        hu += (strike.pts[(head + 1) * 2] - hu) * fr
        hv += (strike.pts[(head + 1) * 2 + 1] - hv) * fr
      }
      const hx = mx + hu * mw
      const hy = my + hv * mh
      ctx.fillStyle = 'rgba(57, 215, 224, 0.28)'
      ctx.beginPath()
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(228, 251, 253, 0.95)'
      ctx.beginPath()
      ctx.arc(hx, hy, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // --- impacts: solid blast bubbles -------------------------------------
    const impacts = hud.impacts
    for (let i = impacts.length - 1; i >= 0; i--) {
      const imp = impacts[i]
      const age = clock.t - imp.at
      if (age > imp.life) {
        impacts.splice(i, 1)
        continue
      }
      const x = mx + imp.u * mw
      const y = my + imp.v * mh
      const fade = Math.pow(1 - age / imp.life, 1.2)
      const grow = 1 - Math.pow(1 - Math.min(1, age / 500), 3) // easeOutCubic
      const r = Math.max(1, mw * 0.042 * grow)

      // the bubble: solid fill + hot rim
      ctx.fillStyle = `rgba(232, 68, 46, ${(fade * 0.34).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(255, 132, 96, ${(fade * 0.85).toFixed(3)})`
      ctx.lineWidth = 1.2
      ctx.stroke()

      // white-hot core flash in the first beat
      if (age < 260) {
        const core = 1 - age / 260
        ctx.fillStyle = `rgba(255, 236, 220, ${(core * 0.85).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, r * 0.45 * core + 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // outgoing shock ring
      if (age < 1300) {
        const f = age / 1300
        ctx.strokeStyle = `rgba(232, 68, 46, ${((1 - f) * 0.5).toFixed(3)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, r * (1 + f * 0.9), 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // --- click reticles: instant feedback on every map click --------------
    const clicks = clicksRef.current
    for (let i = clicks.length - 1; i >= 0; i--) {
      const ping = clicks[i]
      const age = clock.t - ping.at
      if (age > CLICK_PING_LIFE) {
        clicks.splice(i, 1)
        continue
      }
      const x = mx + ping.u * mw
      const y = my + ping.v * mh
      const f = age / CLICK_PING_LIFE
      const a = 1 - f
      // designation cross
      ctx.strokeStyle = `rgba(225, 250, 252, ${(a * 0.9).toFixed(3)})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x - 7, y)
      ctx.lineTo(x + 7, y)
      ctx.moveTo(x, y - 7)
      ctx.lineTo(x, y + 7)
      ctx.stroke()
      // collapsing acquisition ring
      ctx.strokeStyle = `rgba(57, 215, 224, ${(a * 0.7).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(x, y, 14 * (1 - f) + 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    // --- engagement crosshair -------------------------------------------
    const engagement = hud.frame.engagement
    if (engagement) {
      const t = engagement.target
      const elapsed = clock.t - engagement.engagedAt
      const [u, v] = project(t.lon, t.lat)
      const x = mx + u * mw
      const y = my + v * mh

      let alpha = Math.min(1, elapsed / 280)
      if (elapsed > CIN.RELEASE) alpha = Math.max(0, 1 - (elapsed - CIN.RELEASE) / CIN.FADE)
      const pulse = elapsed > CIN.HOLD ? 0.75 + 0.25 * Math.sin(elapsed * 0.004) : 1

      ctx.strokeStyle = `rgba(240, 160, 48, ${(alpha * pulse).toFixed(3)})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const [dx1, dy1, dx2, dy2] of [
        [-18, 0, -6, 0],
        [18, 0, 6, 0],
        [0, -18, 0, -6],
        [0, 18, 0, 6],
      ] as const) {
        ctx.moveTo(x + dx1, y + dy1)
        ctx.lineTo(x + dx2, y + dy2)
      }
      ctx.stroke()
      ctx.save()
      ctx.shadowColor = 'rgba(240, 160, 48, 0.8)'
      ctx.shadowBlur = 6
      ctx.fillStyle = `rgba(240, 160, 48, ${alpha.toFixed(3)})`
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
      ctx.restore()

      // staggered ping rings during LOCK->DECODE
      for (let k = 0; k < 3; k++) {
        const rAge = elapsed - CIN.LOCK - k * 150
        if (rAge < 0 || rAge > 1100) continue
        const f = rAge / 1100
        ctx.strokeStyle = `rgba(240, 160, 48, ${((1 - f) * 0.5 * alpha).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, 4 + f * mw * 0.035, 0, Math.PI * 2)
        ctx.stroke()
      }

      // tracking label types itself in during DECODE
      if (elapsed > CIN.DECODE) {
        const full = `${t.codename} ${fmtLatLon(t.lat, t.lon)}`
        const chars = Math.max(0, Math.floor((elapsed - CIN.DECODE) / 26))
        ctx.font = fonts.mono(8.5)
        ctx.fillStyle = `rgba(240, 160, 48, ${(alpha * 0.9).toFixed(3)})`
        ctx.fillText(full.slice(0, chars), x + 22, y - 10)
      }
    }

    ctx.restore() // end map-frame clip
  })

  // Click anywhere on the map: a bird launches from a RANDOM base toward
  // exactly where you clicked. Fast flight + an instant reticle at the
  // click point, so rapid-fire clicking reads immediately and you can
  // saturate the board with impacts.
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget
      const bounds = canvas.getBoundingClientRect()
      const { x: mx, y: my, w: mw, h: mh } = rectRef.current
      const u = (e.clientX - bounds.left - mx) / mw
      const v = (e.clientY - bounds.top - my) / mh
      if (u < 0 || u > 1 || v < 0 || v > 1) return
      const to = unproject(u, v)
      const from = BASES[Math.floor(Math.random() * BASES.length)]
      const now = scheduler.now()
      clicksRef.current.push({ u, v, at: now })
      const strike = hud.launchStrike(from, to, now, 1200 + Math.random() * 700)
      hud.pushLog(`MANUAL LAUNCH ${strike.id} ${from.name} > ${sectorCode(to.lat, to.lon)}`, 'warn', now)
    },
    [hud, scheduler],
  )

  return <canvas ref={canvasRef} className="wr-canvas wr-canvas-click" onClick={onClick} />
}
