'use client'

// The dossier portrait as a biometric scan readout: high-contrast cyan
// scanline raster underneath, with a dense data overlay ON the image —
// resolving ASCII in bright yellow and red, churning hex columns, a moving
// scan cursor with percentage, corner brackets, and a blinking LOCK tag.
// Per-frame flicker + occasional horizontal tears keep it alive. Obscuring
// the image with data is the point.

import { useRef } from 'react'
import { useHud } from '../lib/context'
import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { getRaster, drawScanRaster } from '../lib/scanline'
import { mulberry32 } from '../lib/rng'
import { CIN } from '../lib/hud'
import { fmtLatLon } from '../lib/geo'
import type { Target } from '../data/targets'
import type { Dossier } from '../data/dossier'

const YELLOW = 'rgba(255, 224, 82,'
const RED = 'rgba(255, 64, 48,'
const GLYPHS = '#$%&@/\\<>0123456789ABCDEF·'

type FxState = {
  rng: () => number
  tear: { row0: number; row1: number; dx: number; until: number } | null
  flickUntil: number
  hex: string[]
  hexAt: number
}

/** Canvas-side scramble-to-resolve: chars lock left-to-right, the rest churn. */
function decodeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  elapsed: number,
  start: number,
  rng: () => number,
  colorPrefix: string,
  alpha: number,
) {
  if (elapsed < start) return
  const resolved = Math.floor((elapsed - start) / 26)
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += i < resolved || text[i] === ' ' ? text[i] : GLYPHS[Math.floor(rng() * GLYPHS.length)]
  }
  ctx.fillStyle = `${colorPrefix} ${alpha.toFixed(3)})`
  ctx.fillText(out, x, y)
}

export function ScanPortrait({ target, dossier }: { target: Target; dossier: Dossier }) {
  const { hud } = useHud()
  const fxRef = useRef<FxState>({
    rng: mulberry32(target.seed * 7919),
    tear: null,
    flickUntil: 0,
    hex: [],
    hexAt: 0,
  })

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    ctx.clearRect(0, 0, w, h)
    const raster = getRaster(target.image)
    const engagement = hud.frame.engagement
    if (!engagement) return
    const elapsed = clock.t - engagement.engagedAt
    const fx = fxRef.current
    const rng = fx.rng

    // --- flicker + tear bookkeeping --------------------------------------
    // Unstable only while the scan is resolving; once the image locks in,
    // it holds steady (overlay text keeps its own life).
    const progress = (elapsed - 380) / 1500
    const resolving = progress < 1
    let flick = 1
    if (resolving) {
      if (clock.t > fx.flickUntil && rng() < clock.dt * 0.0045) {
        fx.flickUntil = clock.t + 40 + rng() * 90
      }
      flick = clock.t < fx.flickUntil ? 0.45 + rng() * 0.25 : 0.92 + rng() * 0.08
      if (!fx.tear && raster && rng() < clock.dt * 0.0012) {
        const row0 = Math.floor(rng() * raster.rows * 0.85)
        fx.tear = { row0, row1: row0 + 4 + Math.floor(rng() * 9), dx: (rng() - 0.5) * 14, until: clock.t + 60 + rng() * 90 }
      }
      if (fx.tear && clock.t > fx.tear.until) fx.tear = null
    } else {
      fx.tear = null
    }

    // --- the raster image -------------------------------------------------
    if (raster) {
      drawScanRaster(ctx, raster, 0, 0, w, h, progress, {
        intensity: flick,
        tear: fx.tear,
      })
    }

    // --- data overlay ------------------------------------------------------
    ctx.font = fonts.mono(8.5)

    // churning hex column, left edge (red, dim) — refreshes in bursts
    if (clock.t > fx.hexAt) {
      fx.hexAt = clock.t + 90 + rng() * 240
      fx.hex = Array.from({ length: 7 }, () =>
        Math.floor(rng() * 0xffff).toString(16).toUpperCase().padStart(4, '0'),
      )
    }
    for (let i = 0; i < fx.hex.length; i++) {
      ctx.fillStyle = `${RED} ${(0.5 * flick).toFixed(3)})`
      ctx.fillText(fx.hex[i], 5, 30 + i * 11)
    }

    // tick ruler, right edge (yellow)
    ctx.fillStyle = `${YELLOW} ${(0.55 * flick).toFixed(3)})`
    for (let yy = 8; yy < h - 8; yy += 7) {
      const major = Math.round((yy - 8) / 7) % 4 === 0
      ctx.fillRect(w - (major ? 9 : 5), yy, major ? 7 : 3, 1)
    }

    // resolving fields — top and bottom, bright yellow over the face
    decodeText(ctx, `SCAN 0X${dossier.ref.slice(-6)}`, 5, 14, elapsed, 200, rng, YELLOW, 0.95 * flick)
    decodeText(ctx, `BIO-KEY ${(38.2 + target.seed * 0.7).toFixed(1)}:${target.seed}`, 5, h - 26, elapsed, CIN.DECODE, rng, YELLOW, 0.9 * flick)
    decodeText(ctx, `POS ${fmtLatLon(target.lat, target.lon)}`, 5, h - 14, elapsed, CIN.DECODE + 160, rng, YELLOW, 0.9 * flick)
    decodeText(ctx, `${dossier.fields[0].v}`, 5, h - 38, elapsed, CIN.DECODE + 320, rng, RED, 0.95 * flick)

    // moving scan cursor + percentage while the raster resolves
    if (progress > 0 && progress < 1) {
      const cy = progress * h
      ctx.fillStyle = `${YELLOW} ${(0.9 * flick).toFixed(3)})`
      ctx.fillText(`${Math.floor(progress * 100)}%`, w - 32, Math.min(h - 6, cy + 10))
    }

    // blinking LOCK tag after decode — bright red box
    if (elapsed > CIN.HOLD && Math.floor(clock.t / 420) % 3 !== 0) {
      ctx.font = fonts.mono(9)
      const tag = dossier.threat > 85 ? 'PRIORITY LOCK' : 'TRACK LOCK'
      const tw = ctx.measureText(tag).width
      ctx.fillStyle = `${RED} ${(0.9 * flick).toFixed(3)})`
      ctx.fillRect(w - tw - 16, 8, tw + 10, 14)
      ctx.fillStyle = `rgba(4, 7, 10, 0.95)`
      ctx.fillText(tag, w - tw - 11, 18)
    }

    // yellow corner brackets over everything
    ctx.strokeStyle = `${YELLOW} ${(0.8 * flick).toFixed(3)})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (const [cx, cyy, dx, dy] of [
      [1, 1, 10, 10],
      [w - 1, 1, -10, 10],
      [1, h - 1, 10, -10],
      [w - 1, h - 1, -10, -10],
    ] as const) {
      ctx.moveTo(cx + dx, cyy)
      ctx.lineTo(cx, cyy)
      ctx.lineTo(cx, cyy + dy)
    }
    ctx.stroke()
  })

  return (
    <div className="wr-portrait">
      <canvas ref={canvasRef} className="wr-canvas" aria-hidden />
    </div>
  )
}
