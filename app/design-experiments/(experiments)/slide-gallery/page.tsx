'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { OperativeReadout } from './components/OperativeReadout'
import './styles.css'

// Black-and-white photo set (the originals are shared with ripple-cycle /
// ascii-reveal; the rest were cropped to 600x800 just for this experiment).
// Cycled across the panels to keep the slatted density.
const IMAGES = [
  '/ascii-reveal/face.jpg',
  '/ascii-reveal/scarlet.jpg',
  '/ascii-reveal/hand.jpg',
  '/ascii-reveal/stark.jpg',
  '/ascii-reveal/dance.jpg',
  '/ascii-reveal/cuffs.jpg',
  '/ascii-reveal/skate.jpg',
  '/ascii-reveal/prince.jpg',
  '/ascii-reveal/city.jpg',
  '/ascii-reveal/bunny.jpg',
  '/ascii-reveal/brutalist.jpg',
  '/ascii-reveal/smoking.jpg',
]

const PANEL_WIDTH_COLLAPSED = 20
const PANEL_WIDTH_EXPANDED = 400
const PANEL_WIDTH_EXPANDED_MOBILE = 100
const PANEL_GAP = 5
const PANEL_COUNT_DESKTOP = 15
const PANEL_COUNT_MOBILE = 9
const BREAKPOINT_MOBILE = 1000

export default function Page() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [focusedPanel, setFocusedPanel] = useState(0)

  const panelCount = isMobile ? PANEL_COUNT_MOBILE : PANEL_COUNT_DESKTOP
  const expandedWidth = isMobile ? PANEL_WIDTH_EXPANDED_MOBILE : PANEL_WIDTH_EXPANDED

  // Track its own width so the strip can be re-centered as focus moves.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width)
      setIsMobile(window.innerWidth < BREAKPOINT_MOBILE)
    })
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [])

  // Reset focus when the panel count flips (desktop <-> mobile).
  useEffect(() => {
    setFocusedPanel(0)
  }, [panelCount])

  // Lay out one panel: sum the widths of everything before it (the focused
  // panel is wide, the rest are slivers), then center the whole strip.
  const getPanelPosition = useCallback(
    (panelIndex: number) => {
      const totalTrackWidth =
        (panelCount - 1) * (PANEL_WIDTH_COLLAPSED + PANEL_GAP) + expandedWidth
      const offsetToCenter = (trackWidth - totalTrackWidth) / 2

      let left = offsetToCenter
      for (let i = 0; i < panelIndex; i++) {
        const w = i === focusedPanel ? expandedWidth : PANEL_WIDTH_COLLAPSED
        left += w + PANEL_GAP
      }

      const width = panelIndex === focusedPanel ? expandedWidth : PANEL_WIDTH_COLLAPSED
      return { left, width }
    },
    [focusedPanel, panelCount, expandedWidth, trackWidth],
  )

  const focusPanel = useCallback((index: number) => {
    setFocusedPanel(index)
  }, [])

  // The spotlight frame tracks whichever panel is focused.
  const getFocusIndicatorPosition = useCallback(
    () => getPanelPosition(focusedPanel),
    [focusedPanel, getPanelPosition],
  )

  return (
    <section className="spotlight">
      <div className="spotlight-track" ref={trackRef}>
        <div className="spotlight-panels">
          <div
            className="spotlight-focus-indicator"
            style={getFocusIndicatorPosition()}
          />
          {Array.from({ length: panelCount }, (_, i) => (
            <div
              key={`${isMobile ? 'm' : 'd'}-${i}`}
              className="spotlight-panel"
              style={getPanelPosition(i)}
              onMouseEnter={!isMobile ? () => focusPanel(i) : undefined}
              onClick={isMobile ? () => focusPanel(i) : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMAGES[i % IMAGES.length]} alt="" />
              {!isMobile && i === focusedPanel && (
                <OperativeReadout src={IMAGES[i % IMAGES.length]} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
