'use client'

import { useEffect, useRef, useState } from 'react'

const CHARS = ' .:-=+*#%@0NOIA819<>!?'
const COLS = 52
const ROWS = 38
const TOTAL = COLS * ROWS
const TICK = 40
// Courier New character width/height ratio (~0.601), divided by line-height (1.1)
// gives the cell aspect ratio used to fill a 3:4 card: 55/40 * 0.546 ≈ 0.75
const CHAR_ASPECT = 0.601

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

function shuffle(arr: number[]): number[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

interface Props {
  src: string
  revealDelay: number
  resetKey: number
  onReplay: () => void
}

export function AsciiImageCard({ src, revealDelay, resetKey, onReplay }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [asciiText, setAsciiText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [fontSize, setFontSize] = useState(9)

  // Compute font size to fill the card width exactly
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const update = () => {
      const w = card.clientWidth
      if (w > 0) setFontSize(w / (COLS * CHAR_ASPECT))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(card)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = COLS
    canvas.height = ROWS

    let targetChars: string[] = []
    let currentChars: string[] = Array.from({ length: TOTAL }, randomChar)
    let resolvedSet = new Set<number>()
    let resolveQueue: number[] = []
    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeouts: ReturnType<typeof setTimeout>[] = []

    function sampleImage() {
      ctx!.drawImage(img!, 0, 0, COLS, ROWS)
      const data = ctx!.getImageData(0, 0, COLS, ROWS).data
      targetChars = Array.from({ length: TOTAL }, (_, i) => {
        const r = data[i * 4]
        const g = data[i * 4 + 1]
        const b = data[i * 4 + 2]
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
        const idx = Math.floor(brightness * (CHARS.length - 1))
        return CHARS[idx]
      })
    }

    function buildString(chars: string[]) {
      let s = ''
      for (let r = 0; r < ROWS; r++) {
        s += chars.slice(r * COLS, r * COLS + COLS).join('') + '\n'
      }
      return s
    }

    function startScramble() {
      setAsciiText(buildString(currentChars))
      intervalId = setInterval(() => {
        for (let i = 0; i < TOTAL; i++) {
          if (!resolvedSet.has(i)) {
            currentChars[i] = randomChar()
          }
        }
        setAsciiText(buildString(currentChars))
      }, TICK)
    }

    function startResolve() {
      resolveQueue = shuffle(Array.from({ length: TOTAL }, (_, i) => i))
      const resolvePerTick = Math.ceil(TOTAL / (1200 / TICK))
      const resolveId = setInterval(() => {
        const batch = resolveQueue.splice(0, resolvePerTick)
        for (const idx of batch) {
          currentChars[idx] = targetChars[idx]
          resolvedSet.add(idx)
        }
        if (resolveQueue.length === 0) {
          clearInterval(resolveId)
        }
      }, TICK)
    }

    function startReveal() {
      if (intervalId) clearInterval(intervalId)
      setRevealed(true)
    }

    function run() {
      if (img!.complete && img!.naturalWidth > 0) {
        sampleImage()
      } else {
        img!.onload = sampleImage
      }

      // Only stagger on initial load; replays start immediately
      const stagger = resetKey === 0 ? revealDelay : 0
      const t0 = setTimeout(startScramble, stagger)
      const t1 = setTimeout(startResolve, 700 + stagger)
      const t2 = setTimeout(() => setRevealed(true), 1300 + stagger)
      timeouts = [t0, t1, t2]
    }

    run()

    return () => {
      if (intervalId) clearInterval(intervalId)
      timeouts.forEach(clearTimeout)
    }
  }, [resetKey, revealDelay])

  return (
    <div
      ref={cardRef}
      className={`ascii-card${revealed ? ' revealed' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onReplay()
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        className="card-image"
        crossOrigin="anonymous"
      />
      <pre
        className="ascii-layer"
        aria-hidden="true"
        style={{ fontSize: `${fontSize}px` }}
      >
        {asciiText}
      </pre>
    </div>
  )
}
