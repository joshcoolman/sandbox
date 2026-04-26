'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AsciiImageCard } from './AsciiImageCard'

const IMAGES = [
  '/ascii-reveal/brutalist.jpg',
  '/ascii-reveal/city.jpg',
  '/ascii-reveal/dance.jpg',
  '/ascii-reveal/face.jpg',
  '/ascii-reveal/hand.jpg',
  '/ascii-reveal/skate.jpg',
]

const IDLE_MIN = 5000
const IDLE_MAX = 9000

function randomIdleDelay() {
  return IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN)
}

export function AsciiRevealGrid() {
  const [resetKeys, setResetKeys] = useState<number[]>(IMAGES.map(() => 0))
  const lastIndexRef = useRef<number>(-1)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetAll = useCallback(() => {
    setResetKeys((prev) => prev.map((k) => k + 1))
  }, [])

  const resetCard = useCallback((index: number) => {
    setResetKeys((prev) => {
      const next = [...prev]
      next[index] = next[index] + 1
      return next
    })
  }, [])

  const scheduleIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      // Pick a random card, avoiding the same one twice in a row
      let idx
      do { idx = Math.floor(Math.random() * IMAGES.length) }
      while (idx === lastIndexRef.current && IMAGES.length > 1)
      lastIndexRef.current = idx
      setResetKeys((prev) => {
        const next = [...prev]
        next[idx] = next[idx] + 1
        return next
      })
      scheduleIdle()
    }, randomIdleDelay())
  }, [])

  useEffect(() => {
    scheduleIdle()
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current) }
  }, [scheduleIdle])

  return (
    <div className="ascii-experiment">
      <div className="ascii-grid" onClick={() => { resetAll(); scheduleIdle() }}>
        {IMAGES.map((src, i) => (
          <AsciiImageCard
            key={`${i}-${resetKeys[i]}`}
            src={src}
            revealDelay={i * 250}
            resetKey={resetKeys[i]}
            onReplay={() => { resetCard(i); scheduleIdle() }}
          />
        ))}
      </div>
      <p className="replay-hint">click image to replay · click anywhere to replay all</p>
    </div>
  )
}
