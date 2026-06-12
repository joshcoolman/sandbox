'use client'

// Event log ticker. Lines come from the hud log ring buffer (fed by the
// ambient channels); new lines slide in from below with a smooth seq-based
// scroll, color-coded by level, with a brief arrival flash.

import { useRef } from 'react'
import { useHud } from '../lib/context'
import { useCanvasPanel } from '../hooks/useCanvasPanel'

const LINE_H = 15

const COLORS = {
  info: '57, 215, 224',
  warn: '240, 160, 48',
  alert: '232, 68, 46',
} as const

export function TickerPanel() {
  const { hud } = useHud()
  const scrollRef = useRef({ pos: 0 })

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    ctx.clearRect(0, 0, w, h)
    const logs = hud.logs
    if (logs.length === 0) return

    const lastSeq = logs[logs.length - 1].seq
    const target = lastSeq * LINE_H
    const s = scrollRef.current
    // Framerate-independent ease toward the latest line.
    s.pos += (target - s.pos) * (1 - Math.exp(-clock.dt / 160))
    const offset = target - s.pos

    ctx.font = fonts.mono(10)
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i]
      const y = h - 9 - (lastSeq - log.seq) * LINE_H + offset
      if (y < 12) break
      if (y > h + LINE_H) continue

      const age = clock.t - log.at
      const flash = age < 420 ? 1 - age / 420 : 0
      const rgb = COLORS[log.level]
      const base = log.level === 'info' ? 0.5 : 0.72

      ctx.fillStyle = `rgba(57, 215, 224, ${(0.3 + flash * 0.3).toFixed(3)})`
      ctx.fillText(`T+${(log.at / 1000).toFixed(1).padStart(7, '0')}`, 8, y)
      ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, base + flash * 0.4).toFixed(3)})`
      ctx.fillText(log.text, 86, y)
    }
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
