'use client'

// Event log as a teletype — the same ASCII print mechanic as the BUS
// DIAGNOSTIC schematic, minus the glitch effects (no per-char blink, no
// horizontal scatter). The whole row (timestamp + message) hammers out from
// the LEFT edge: the print head starts on a blank line and sweeps all the way
// across, then the page steps up one full line (no smooth scroll) and the next
// arrival prints. Coloring is the only departure from the schematic — the
// timestamp stays cyan, the message keeps its per-level color.

import { useRef } from 'react'
import { useHud } from '../lib/context'
import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { mulberry32 } from '../lib/rng'
import type { LogLine, LogLevel } from '../lib/hud'

const LINE_H = 15
const TS_COL = 13 // column where the message begins (keeps the old timestamp gutter)

const COLORS = {
  info: '57, 215, 224',
  warn: '240, 160, 48',
  alert: '232, 68, 46',
} as const

type PrintLine = { seq: number; level: LogLevel; ts: string; text: string }

function compose(log: LogLine): PrintLine {
  return {
    seq: log.seq,
    level: log.level,
    ts: `T+${(log.at / 1000).toFixed(1).padStart(7, '0')}`,
    text: log.text,
  }
}

type TeletypeState = {
  history: PrintLine[] // committed lines, newest last
  current: PrintLine | null // line being hammered out
  chars: number // chars of `current` printed so far
  nextCharAt: number
  lastSeq: number // highest seq committed
  init: boolean
  rng: () => number
}

export function TickerPanel() {
  const { hud } = useHud()
  const stateRef = useRef<TeletypeState>({
    history: [],
    current: null,
    chars: 0,
    nextCharAt: 0,
    lastSeq: -1,
    init: false,
    rng: mulberry32(0x7e1e),
  })

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    ctx.clearRect(0, 0, w, h)
    const logs = hud.logs
    if (logs.length === 0) return
    const st = stateRef.current
    const keep = Math.ceil(h / LINE_H) + 2

    // First frame: the page is already full — show the existing buffer as
    // already-printed history so we only type out lines that arrive from here.
    if (!st.init) {
      st.history = logs.slice(-keep).map(compose)
      st.lastSeq = logs[logs.length - 1].seq
      st.current = null
      st.nextCharAt = clock.t
      st.init = true
    }

    // --- advance the printer ------------------------------------------
    // Pick up the next waiting line if the head is idle.
    if (!st.current) {
      const nextLog = logs.find(l => l.seq > st.lastSeq)
      if (nextLog) {
        st.current = compose(nextLog)
        st.chars = 0
        st.nextCharAt = clock.t
      }
    }
    while (st.current && clock.t >= st.nextCharAt) {
      const fullLen = TS_COL + st.current.text.length
      if (st.chars >= fullLen) {
        // carriage return: commit the line, page steps up one row
        st.history.push(st.current)
        st.lastSeq = st.current.seq
        if (st.history.length > keep) st.history.splice(0, st.history.length - keep)
        // chain straight into the next line if one is waiting (continuous
        // print like the schematic); otherwise the head goes idle
        const nextLog = logs.find(l => l.seq > st.lastSeq)
        if (nextLog) {
          st.current = compose(nextLog)
          st.chars = 0
          st.nextCharAt += 36 + st.rng() * 70 // jittery return beat
        } else {
          st.current = null
        }
      } else {
        // hammer 1-2 chars with teletype jitter (same cadence as the schematic)
        st.chars += st.rng() < 0.35 ? 2 : 1
        st.nextCharAt += 3 + st.rng() * 14
      }
    }
    // Park the clock at "now" while idle so the next arrival types out from
    // scratch instead of being caught up in a single frame.
    if (!st.current) st.nextCharAt = clock.t

    // --- draw ------------------------------------------------------------
    ctx.font = fonts.mono(10)
    const charW = ctx.measureText('M').width
    const baseY = h - 9 // baseline of the line being printed

    const drawLine = (ln: PrintLine, reveal: number, y: number, current: boolean) => {
      ctx.fillStyle = `rgba(57, 215, 224, ${current ? 0.6 : 0.45})`
      ctx.fillText(ln.ts.slice(0, Math.min(reveal, ln.ts.length)), 8, y)
      if (reveal > TS_COL) {
        const a = (ln.level === 'info' ? 0.62 : 0.82) * (current ? 1 : 0.85)
        ctx.fillStyle = `rgba(${COLORS[ln.level]}, ${a.toFixed(3)})`
        ctx.fillText(ln.text.slice(0, reveal - TS_COL), 8 + TS_COL * charW, y)
      }
    }

    // committed page above (newest at bottom, stepping up in whole lines)
    for (let i = 0; i < st.history.length; i++) {
      const ln = st.history[i]
      const y = baseY - (st.history.length - i) * LINE_H
      if (y < 4) continue
      drawLine(ln, TS_COL + ln.text.length, y, false)
    }

    // the line being hammered out + print-head cursor block
    if (st.current) {
      drawLine(st.current, st.chars, baseY, true)
      ctx.fillStyle = 'rgba(200, 240, 245, 0.9)'
      ctx.fillRect(8 + st.chars * charW, baseY - 9, charW, 11)
    } else if (Math.floor(clock.t / 400) % 2 === 0) {
      // idle: blinking head waiting at the start of the next blank line
      ctx.fillStyle = 'rgba(200, 240, 245, 0.55)'
      ctx.fillRect(8, baseY - 9, charW, 11)
    }
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
