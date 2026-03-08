'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface RotarySelectorProps {
  items: string[]
  defaultIndex?: number
  onChange?: (index: number, label: string) => void
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
      className="rotary-selector component-card"
      ref={dialRef}
      style={{
        width: cardWidth,
        height: cardHeight,
        position: 'relative',
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      {/* Dial assembly */}
      <div
        className="rotary-dial-assembly"
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width: dialSize,
          height: dialSize,
        }}
      >
        <div className="rotary-groove" />
        <div
          className="rotary-dial"
          style={{ transform: `rotate(${dialRotation}deg)` }}
        >
          <div className="rotary-indicator" />
        </div>
        <div className="rotary-center-cap" />
      </div>

      {/* Labels positioned radially */}
      {items.map((label, i) => {
        const pos = labelPositions[i]
        return (
          <button
            key={label}
            className={`rotary-label ${i === activeIndex ? 'active' : ''}`}
            onClick={() => handleSelect(i)}
            aria-pressed={i === activeIndex}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translateY(-50%)',
            }}
          >
            <span className="rotary-dot" />
            <span className="rotary-label-text">{label}</span>
          </button>
        )
      })}

      <style jsx>{`
        .rotary-groove {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid var(--ui-border);
          background: radial-gradient(
            circle at 35% 35%,
            var(--ui-bg-surface) 0%,
            var(--ui-bg-card) 100%
          );
        }

        .rotary-dial {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            #2a2a30 0%,
            #38383f 25%,
            #2a2a30 50%,
            #1e1e24 75%,
            #2a2a30 100%
          );
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3);
          transition: transform var(--ui-transition-spring);
          z-index: 2;
        }

        .rotary-indicator {
          position: absolute;
          top: 50%;
          right: 8px;
          width: 22px;
          height: 3px;
          margin-top: -1.5px;
          background: var(--ui-accent);
          border-radius: 2px;
          box-shadow: 0 0 8px var(--ui-accent-glow);
        }

        .rotary-center-cap {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 28px;
          height: 28px;
          margin: -14px 0 0 -14px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 40% 38%,
            #3a3a42 0%,
            #222228 100%
          );
          box-shadow:
            0 1px 4px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          z-index: 3;
        }

        .rotary-label {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 4px 0;
          cursor: pointer;
          font-family: var(--ui-font);
          font-size: 14px;
          color: var(--ui-text-secondary);
          z-index: 4;
          transition:
            color var(--ui-transition-snap),
            transform var(--ui-transition-snap);
        }

        .rotary-label:hover {
          color: var(--ui-text-primary);
        }

        .rotary-label.active {
          color: var(--ui-text-primary);
        }

        .rotary-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ui-border);
          transition:
            background var(--ui-transition-smooth),
            box-shadow var(--ui-transition-smooth);
          flex-shrink: 0;
        }

        .rotary-label.active .rotary-dot {
          background: var(--ui-accent);
          box-shadow: 0 0 6px var(--ui-accent-glow);
        }

        .rotary-label-text {
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
