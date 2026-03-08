'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface DurationSliderProps {
  values?: number[]
  defaultValue?: number
  unit?: string
  onChange?: (value: number) => void
}

export default function DurationSlider({
  values = [3, 6, 9, 12, 15],
  defaultValue = 6,
  unit = 's',
  onChange,
}: DurationSliderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, values.indexOf(defaultValue))
  )
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const currentValue = values[activeIndex]
  const fraction = activeIndex / (values.length - 1)

  const getIndexFromX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return activeIndex
      const rect = track.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const ratio = x / rect.width
      const idx = Math.round(ratio * (values.length - 1))
      return Math.max(0, Math.min(idx, values.length - 1))
    },
    [activeIndex, values.length]
  )

  const pointerDown = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      pointerDown.current = true
      // Click left of thumb = decrement, right = increment (one step)
      const track = trackRef.current
      if (track) {
        const rect = track.getBoundingClientRect()
        const thumbX = rect.left + fraction * rect.width
        const clickX = e.clientX
        let nextIndex = activeIndex
        if (clickX > thumbX + 4 && activeIndex < values.length - 1) {
          nextIndex = activeIndex + 1
        } else if (clickX < thumbX - 4 && activeIndex > 0) {
          nextIndex = activeIndex - 1
        }
        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex)
          onChange?.(values[nextIndex])
        }
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [fraction, activeIndex, onChange, values]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDown.current) return
      if (!isDragging) setIsDragging(true)
      const idx = getIndexFromX(e.clientX)
      if (idx !== activeIndex) {
        setActiveIndex(idx)
        onChange?.(values[idx])
      }
    },
    [isDragging, getIndexFromX, activeIndex, onChange, values]
  )

  const handlePointerUp = useCallback(() => {
    pointerDown.current = false
    setIsDragging(false)
  }, [])

  // Close popover on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    // Delay to avoid catching the opening click
    const id = setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handleClick)
    }
  }, [isOpen])

  return (
    <div className="duration-slider-wrapper">
      {/* Trigger button */}
      <button
        className="duration-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        >
          <circle cx="7" cy="7" r="5.5" />
          <path d="M7 4.5V7.5L9 9" />
        </svg>
        {currentValue}
        {unit}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="duration-popover component-card" ref={popoverRef}>
          <div className="duration-title">Choose duration</div>

          <div className="duration-track-container">
            {/* Current value label */}
            <div className="duration-value">
              {currentValue}
              {unit}
            </div>

            {/* Track */}
            <div
              className="duration-track"
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Filled portion */}
              <div
                className="duration-fill"
                style={{
                  width: `${fraction * 100}%`,
                  transition: isDragging ? 'none' : 'width var(--ui-transition-spring)',
                }}
              />

              {/* Snap tick marks */}
              <div className="duration-ticks">
                {values.map((_, i) => (
                  <div
                    key={i}
                    className={`duration-tick ${i <= activeIndex ? 'filled' : ''}`}
                    style={{
                      left: `${(i / (values.length - 1)) * 100}%`,
                    }}
                  />
                ))}
              </div>

              {/* Thumb */}
              <div
                className={`duration-thumb ${isDragging ? 'dragging' : ''}`}
                style={{
                  left: `${fraction * 100}%`,
                  transition: isDragging ? 'none' : 'left var(--ui-transition-spring)',
                }}
              />
            </div>
          </div>

          {/* Value labels below track */}
          <div className="duration-labels">
            {values.map((v, i) => (
              <button
                key={v}
                className={`duration-label ${i === activeIndex ? 'active' : ''}`}
                onClick={() => {
                  setActiveIndex(i)
                  onChange?.(v)
                }}
              >
                {v}
                {unit}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .duration-slider-wrapper {
          position: relative;
        }

        /* ---- Trigger ---- */
        .duration-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--ui-bg-surface);
          border: 1px solid var(--ui-border);
          border-radius: var(--ui-radius-md);
          padding: 8px 16px;
          font-family: var(--ui-font);
          font-size: 14px;
          color: var(--ui-text-primary);
          cursor: pointer;
          transition:
            background var(--ui-transition-snap),
            border-color var(--ui-transition-snap);
        }

        .duration-trigger:hover {
          background: var(--ui-bg-elevated);
          border-color: var(--ui-text-muted);
        }

        .duration-trigger svg {
          opacity: 0.6;
        }

        /* ---- Popover ---- */
        .duration-popover {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: 280px;
          padding: 16px 18px 14px;
          z-index: 100;
          animation: popoverIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popoverIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .duration-title {
          font-family: var(--ui-font);
          font-size: 14px;
          font-weight: 500;
          color: var(--ui-text-primary);
          margin-bottom: 14px;
        }

        /* ---- Track ---- */
        .duration-track-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .duration-value {
          font-family: var(--ui-font-mono);
          font-size: 14px;
          color: var(--ui-text-primary);
          min-width: 28px;
          text-align: right;
          flex-shrink: 0;
        }

        .duration-track {
          position: relative;
          flex: 1;
          height: 32px;
          background: var(--ui-bg-surface);
          border-radius: 6px;
          cursor: pointer;
          touch-action: none;
          overflow: hidden;
        }

        .duration-fill {
          position: absolute;
          inset: 0;
          right: auto;
          background: var(--ui-accent-tint);
          border-radius: 6px 0 0 6px;
        }

        .duration-ticks {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .duration-tick {
          position: absolute;
          top: 50%;
          width: 2px;
          height: 8px;
          margin-top: -4px;
          margin-left: -1px;
          background: var(--ui-border);
          border-radius: 1px;
          transition: background 0.2s;
        }

        .duration-tick.filled {
          background: var(--ui-text-muted);
        }

        .duration-thumb {
          position: absolute;
          top: 2px;
          bottom: 2px;
          width: 4px;
          margin-left: -2px;
          background: var(--ui-text-primary);
          border-radius: 2px;
          z-index: 2;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
          transition: transform var(--ui-transition-snap);
        }

        .duration-thumb.dragging {
          transform: scaleY(1.05);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
        }

        /* ---- Value labels ---- */
        .duration-labels {
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
        }

        .duration-label {
          background: none;
          border: none;
          font-family: var(--ui-font-mono);
          font-size: 10px;
          color: var(--ui-text-muted);
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition:
            color var(--ui-transition-snap),
            background var(--ui-transition-snap);
        }

        .duration-label:hover {
          color: var(--ui-text-secondary);
          background: var(--ui-bg-surface);
        }

        .duration-label.active {
          color: var(--ui-accent);
        }
      `}</style>
    </div>
  )
}
