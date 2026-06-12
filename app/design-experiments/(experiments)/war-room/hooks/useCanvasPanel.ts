'use client'

// The bridge between a panel component and the shared scheduler. Handles:
// DPR-correct sizing via ResizeObserver (setTransform, never cumulative
// scale), IntersectionObserver pause for offscreen/hidden panels, canvas
// font resolution (next/font emits hashed family names — read them from
// computed style once), and draw-callback registration with cleanup.

import { useEffect, useRef, type RefObject } from 'react'
import { useHud } from '../lib/context'
import type { Clock } from '../lib/scheduler'

export type PanelSize = { w: number; h: number; resized: boolean }
export type PanelFonts = {
  mono: (px: number) => string
  display: (px: number, weight?: number) => string
}
export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  size: PanelSize,
  clock: Clock,
  fonts: PanelFonts,
) => void

export function useCanvasPanel(draw: DrawFn): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const { scheduler } = useHud()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const host = canvas.parentElement ?? canvas

    // Resolve next/font hashed families from CSS custom properties so
    // ctx.font strings actually hit the loaded fonts.
    const styles = getComputedStyle(canvas)
    const monoFam = styles.getPropertyValue('--wr-mono-fam').trim() || 'monospace'
    const dispFam = styles.getPropertyValue('--wr-display-fam').trim() || 'sans-serif'
    const fonts: PanelFonts = {
      mono: px => `${px}px ${monoFam}, monospace`,
      display: (px, weight = 600) => `${weight} ${px}px ${dispFam}, sans-serif`,
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let pendingW = host.clientWidth
    let pendingH = host.clientHeight
    let visible = true

    const ro = new ResizeObserver(entries => {
      // Defer the actual canvas mutation to the next frame — no layout
      // thrash inside the observer callback.
      const rect = entries[entries.length - 1].contentRect
      pendingW = rect.width
      pendingH = rect.height
    })
    ro.observe(host)

    const io = new IntersectionObserver(entries => {
      visible = entries[entries.length - 1].isIntersecting
    })
    io.observe(canvas)

    const remove = scheduler.add(clock => {
      let resized = false
      if (pendingW !== w || pendingH !== h) {
        w = pendingW
        h = pendingH
        canvas.width = Math.max(1, Math.round(w * dpr))
        canvas.height = Math.max(1, Math.round(h * dpr))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        resized = true
      }
      if (!visible || w < 2 || h < 2) return
      drawRef.current(ctx, { w, h, resized }, clock, fonts)
    })

    return () => {
      remove()
      ro.disconnect()
      io.disconnect()
    }
  }, [scheduler])

  return canvasRef
}
