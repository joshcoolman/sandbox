'use client'

// The green-phosphor terminal as a teletype: the schematic prints line by
// line at the BOTTOM of the panel — characters hammer out left to right
// with jittery per-char timing, then the page steps up one full line (no
// smooth scroll) and the next line starts. Fast and visceral, still
// readable. Per-character blink + occasional horizontal scatter on the
// printed page above.

import { useRef } from 'react'
import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { createSchematicStream, type SchemLine } from '../data/schematic'
import { mulberry32 } from '../lib/rng'

const LINE_H = 13

type TeletypeState = {
  history: SchemLine[] // printed page, newest last
  current: SchemLine | null // line being hammered out
  chars: number // chars of `current` printed so far
  nextCharAt: number
  next: (() => SchemLine) | null
  scatter: { row: number; until: number; dx: number } | null
  rng: () => number
}

export function SchematicPanel() {
  const stateRef = useRef<TeletypeState>({
    history: [],
    current: null,
    chars: 0,
    nextCharAt: 0,
    next: null,
    scatter: null,
    rng: mulberry32(0x5cad), // fixed seed: deterministic stream, draw is client-only
  })

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock, fonts) => {
    const st = stateRef.current
    if (!st.next) {
      st.next = createSchematicStream(st.rng)
      // start mid-document: the page is already full, the printer just keeps going
      const keep = Math.ceil(h / LINE_H) + 2
      for (let i = 0; i < keep; i++) st.history.push(st.next())
    }

    // --- advance the printer ------------------------------------------
    if (!st.current) {
      st.current = st.next()
      st.chars = 0
      st.nextCharAt = clock.t
    }
    while (clock.t >= st.nextCharAt && st.current) {
      const len = st.current.text.trimEnd().length
      if (st.chars >= len) {
        // carriage return: commit the line, page steps up one row
        st.history.push(st.current)
        const keep = Math.ceil(h / LINE_H) + 2
        if (st.history.length > keep) st.history.splice(0, st.history.length - keep)
        st.current = st.next()
        st.chars = 0
        // blank lines feed through almost instantly; real lines get a
        // jittery return beat, occasionally a longer mechanical pause
        st.nextCharAt = clock.t + (len === 0 ? 14 : 36 + st.rng() * 70 + (st.rng() < 0.1 ? 220 : 0))
      } else {
        // hammer 1-2 chars with teletype jitter
        st.chars += st.rng() < 0.35 ? 2 : 1
        st.nextCharAt += 3 + st.rng() * 14
      }
    }

    // --- draw ------------------------------------------------------------
    ctx.clearRect(0, 0, w, h)
    ctx.font = fonts.mono(10.5)
    const charW = ctx.measureText('M').width
    const baseY = h - 8 // baseline of the line being printed

    if (!st.scatter && st.rng() < clock.dt * 0.0006) {
      st.scatter = {
        row: Math.floor(st.rng() * st.history.length),
        until: clock.t + 70 + st.rng() * 60,
        dx: (st.rng() - 0.5) * 9,
      }
    }
    if (st.scatter && clock.t > st.scatter.until) st.scatter = null

    const drawLine = (ln: SchemLine, upTo: number, y: number, dx: number, alpha: number) => {
      const text = ln.text.slice(0, upTo)
      ctx.fillStyle = `rgba(159, 232, 112, ${alpha.toFixed(3)})`
      ctx.fillText(text, 8 + dx, y)
      for (const [a, b] of ln.accents) {
        if (a >= upTo) continue
        ctx.fillStyle = `rgba(240, 160, 48, ${(alpha + 0.18).toFixed(3)})`
        ctx.fillText(ln.text.slice(a, Math.min(b, upTo)), 8 + dx + a * charW, y)
      }
    }

    // printed page above (newest at bottom, stepping up in whole lines)
    for (let i = 0; i < st.history.length; i++) {
      const y = baseY - (st.history.length - i) * LINE_H
      if (y < 4) continue
      const dx = st.scatter?.row === i ? st.scatter.dx : 0
      drawLine(st.history[i], st.history[i].text.length, y, dx, 0.6)
    }

    // the line being hammered out + print-head cursor block
    if (st.current) {
      drawLine(st.current, st.chars, baseY, 0, 0.85)
      ctx.fillStyle = 'rgba(224, 255, 196, 0.9)'
      ctx.fillRect(8 + st.chars * charW, baseY - 9, charW, 11)
    }

    // per-character blink: a few random glyphs on the page flare each frame
    for (let k = 0; k < 4 && st.history.length > 0; k++) {
      const row = Math.floor(st.rng() * st.history.length)
      const col = Math.floor(st.rng() * st.history[row].text.length)
      const ch = st.history[row].text[col]
      if (ch && ch !== ' ') {
        const y = baseY - (st.history.length - row) * LINE_H
        if (y < 4) continue
        ctx.fillStyle = 'rgba(224, 255, 196, 0.9)'
        ctx.fillText(ch, 8 + col * charW, y)
      }
    }
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
