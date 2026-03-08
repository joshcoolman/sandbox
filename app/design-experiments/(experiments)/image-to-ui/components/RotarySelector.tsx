'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './RotarySelector.module.css'

interface RotarySelectorProps {
  items: string[]
  defaultIndex?: number
  onChange?: (index: number, label: string) => void
  className?: string
}

// Angles in degrees from 3-o'clock (0°), going clockwise
// Labels fan out on the right side of the dial
function getItemAngles(count: number): number[] {
  if (count === 2) return [-30, 30]
  if (count === 3) return [-40, 0, 40]
  if (count === 4) return [-50, -17, 17, 50]
  return [-40, 0, 40]
}

export default function RotarySelector({
  items,
  defaultIndex = 0,
  onChange,
  className,
}: RotarySelectorProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const [isAnimating, setIsAnimating] = useState(false)
  const dialRef = useRef<HTMLDivElement>(null)
  const angles = getItemAngles(items.length)

  const handleSelect = useCallback(
    (index: number) => {
      if (index === activeIndex || isAnimating) return
      setIsAnimating(true)
      setActiveIndex(index)
      onChange?.(index, items[index])
      setTimeout(() => setIsAnimating(false), 600)
    },
    [activeIndex, isAnimating, onChange, items]
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!dialRef.current?.closest(':hover')) return
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSelect((activeIndex - 1 + items.length) % items.length)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleSelect((activeIndex + 1) % items.length)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeIndex, items.length, handleSelect])

  const dialRotation = angles[activeIndex]

  // Layout constants
  const dialSize = 120
  const padding = 28
  const labelGap = 18 // space between dial edge and dot

  // Dial sits on the left, vertically centered
  const dialCenterX = padding + dialSize / 2
  const dialCenterY = padding + dialSize / 2

  // Compute label positions along the arc
  const labelPositions = angles.map((angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180
    const r = dialSize / 2 + labelGap
    return {
      x: dialCenterX + r * Math.cos(angleRad),
      y: dialCenterY + r * Math.sin(angleRad),
    }
  })

  // Card size: dial + padding on left/top/bottom, labels extend right
  const cardWidth = Math.ceil(
    Math.max(...labelPositions.map((p) => p.x)) + 120
  )
  const cardHeight = dialSize + padding * 2

  return (
    <div
      className={`${styles.wrapper} ${className ?? ''}`}
      ref={dialRef}
      style={{ width: cardWidth, height: cardHeight }}
    >
      {/* Dial assembly */}
      <div
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width: dialSize,
          height: dialSize,
        }}
      >
        <div className={styles.groove} />
        <div className={styles.dial} />
        <div
          className={styles.dialRotator}
          style={{ transform: `rotate(${dialRotation}deg)` }}
        >
          <div className={styles.indicator} />
        </div>
        <div className={styles.centerCap} />
      </div>

      {/* Labels positioned radially */}
      {items.map((label, i) => {
        const pos = labelPositions[i]
        return (
          <button
            key={label}
            className={`${styles.label} ${i === activeIndex ? styles.active : ''}`}
            onClick={() => handleSelect(i)}
            aria-pressed={i === activeIndex}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translateY(-50%)',
            }}
          >
            <span className={styles.dot} />
            <span className={styles.labelText}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
