'use client'

// The monochrome LCD: lit khaki backlight, solid dark pixels (Nokia-style
// treatment — the third display technology on the wall). Always light
// screen / dark foreground. Layout: "DEFCON" label with the 5..1 scale
// inline on the right (active level highlighted Nokia-pill style), the big
// condition digit centered, and a ZULU clock along the bottom.

import { useHud } from '../lib/context'
import { useCanvasPanel } from '../hooks/useCanvasPanel'
import { drawPixelText, pixelTextWidth, GLYPH_H } from '../data/pixelFont'

// Tokens mirrored from styles.css (--wr-lcd-bg / --wr-lcd-ink).
const LCD_BG = '#a9b88e'
const LCD_BG_LIT = '#b6c49b'
const LCD_INK = '#1d2417'
const LCD_SHADOW = 'rgba(29, 36, 23, 0.22)'

function two(n: number): string {
  return String(n).padStart(2, '0')
}

export function LcdPanel() {
  const { hud } = useHud()

  const canvasRef = useCanvasPanel((ctx, { w, h }, clock) => {
    const defcon = hud.getSnapshot().defcon

    // Backlight — always lit, never inverted
    ctx.fillStyle = LCD_BG
    ctx.fillRect(0, 0, w, h)
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
    grad.addColorStop(0, LCD_BG_LIT)
    grad.addColorStop(1, LCD_BG)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    void clock // backlight is static; clock only drives the ZULU readout below

    const pad = Math.max(8, w * 0.05)
    const text = (s: string, x: number, y: number, px: number) => {
      // soft pixel shadow, then ink — the LCD relief look
      ctx.fillStyle = LCD_SHADOW
      drawPixelText(ctx, s, x + px * 0.32, y + px * 0.32, px)
      ctx.fillStyle = LCD_INK
      drawPixelText(ctx, s, x, y, px)
    }

    // --- top row: "DEFCON" label, 5..1 scale inline on the right ---------
    const sPx = Math.max(1.4, Math.min(h * 0.02, w * 0.011))
    const rowY = pad
    text('DEFCON', pad, rowY, sPx)

    const cell = sPx * 6 + 7 // glyph + tracking + pill spacing
    let x = w - pad - 5 * cell + 4
    for (let lvl = 5; lvl >= 1; lvl--) {
      if (lvl === defcon) {
        // Nokia-pill highlight: dark band, light digit
        ctx.fillStyle = LCD_INK
        ctx.fillRect(x - 3, rowY - 3, sPx * 5 + 6, sPx * GLYPH_H + 6)
        ctx.fillStyle = LCD_BG
        drawPixelText(ctx, String(lvl), x, rowY, sPx)
      } else {
        ctx.fillStyle = 'rgba(29, 36, 23, 0.38)'
        drawPixelText(ctx, String(lvl), x, rowY, sPx)
      }
      x += cell
    }

    // --- middle: big condition digit, centered ---------------------------
    const clockPx = Math.min(Math.max(1.6, (w - pad * 2) / (13 * 6)), h * 0.022)
    const clockTop = h - pad - clockPx * GLYPH_H
    const digitTop = rowY + sPx * GLYPH_H + 8
    const bigPx = Math.max(3, Math.min((clockTop - digitTop - 8) / GLYPH_H, w * 0.06))
    const digitW = pixelTextWidth(String(defcon), bigPx)
    text(String(defcon), (w - digitW) / 2, digitTop + (clockTop - digitTop - 8 - bigPx * GLYPH_H) / 2, bigPx)

    // --- bottom: ZULU clock (real wall-clock, drawn client-side only) ----
    const d = new Date()
    const zulu = `ZULU ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}`
    text(zulu, pad, clockTop, clockPx)
  })

  return <canvas ref={canvasRef} className="wr-canvas" />
}
