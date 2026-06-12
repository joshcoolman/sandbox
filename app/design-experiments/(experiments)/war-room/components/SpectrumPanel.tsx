'use client'

// Pseudo-audio spectrum with the teletype temperament: nothing glides.
// Each bar holds its level, then SNAPS to a new whole-segment value on its
// own jittered tick (70-220ms), and the amber peak markers step down one
// segment at a time instead of falling smoothly. Same sum-of-sines field
// underneath so the motion keeps a musical shape — it's just sampled
// discretely. Visual-only panel.

import { useRef } from 'react'
import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { mulberry32 } from '../lib/rng'

const BARS = 22
const SEG_H = 5

type SpectrumState = {
  levels: Int16Array // whole segments
  peaks: Int16Array // whole segments
  nextAt: Float64Array // per-bar resample time
  peakNextAt: Float64Array // per-bar peak step-down time
  rng: () => number
}

export function SpectrumPanel() {
  const stateRef = useRef<SpectrumState>({
    levels: new Int16Array(BARS),
    peaks: new Int16Array(BARS),
    nextAt: new Float64Array(BARS),
    peakNextAt: new Float64Array(BARS),
    rng: mulberry32(0x51614),
  })

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock) => {
    ctx.clearRect(0, 0, w, h)
    const st = stateRef.current
    const rng = st.rng
    const t = clock.t / 1000
    const bw = w / BARS
    const usable = h - 16
    const maxSegs = Math.max(1, Math.floor(usable / SEG_H))

    for (let i = 0; i < BARS; i++) {
      // resample on this bar's own jittered tick — snap, don't glide
      if (clock.t >= st.nextAt[i]) {
        st.nextAt[i] = clock.t + 70 + rng() * 150
        const v =
          0.34 +
          0.3 * Math.sin(t * 1.7 + i * 0.93) +
          0.22 * Math.sin(t * 3.1 + i * 2.31) +
          0.16 * Math.sin(t * 0.57 + i * 5.07) +
          (rng() - 0.5) * 0.22
        st.levels[i] = Math.round(Math.max(0.04, Math.min(1, v)) * maxSegs)
        if (st.levels[i] >= st.peaks[i]) {
          st.peaks[i] = st.levels[i]
          st.peakNextAt[i] = clock.t + 260 + rng() * 240 // hold before stepping down
        }
      }
      // peak steps down one segment per beat
      if (st.peaks[i] > st.levels[i] && clock.t >= st.peakNextAt[i]) {
        st.peaks[i]--
        st.peakNextAt[i] = clock.t + 90 + rng() * 110
      }

      for (let s = 0; s < st.levels[i]; s++) {
        const frac = s / maxSegs
        ctx.fillStyle =
          frac > 0.74
            ? 'rgba(240, 160, 48, 0.9)'
            : `rgba(57, 215, 224, ${(0.28 + frac * 0.55).toFixed(3)})`
        ctx.fillRect(i * bw + 2, h - 9 - (s + 1) * SEG_H, bw - 4, SEG_H - 1.6)
      }
      // peak marker sits on a segment boundary — on/off, never between
      ctx.fillStyle = 'rgba(240, 160, 48, 0.75)'
      ctx.fillRect(i * bw + 2, h - 9 - st.peaks[i] * SEG_H - 1.4, bw - 4, 1.4)
    }
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
