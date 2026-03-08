'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './DurationSlider.module.css'

interface DurationSliderProps {
  values?: number[]
  defaultValue?: number
  unit?: string
  onChange?: (value: number) => void
  className?: string
}

export default function DurationSlider({
  values = [3, 6, 9, 12, 15],
  defaultValue = 6,
  unit = 's',
  onChange,
  className,
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
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {/* Trigger button */}
      <button
        className={styles.trigger}
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
        <div className={styles.popover} ref={popoverRef}>
          <div className={styles.title}>Choose duration</div>

          <div className={styles.trackContainer}>
            {/* Current value label */}
            <div className={styles.value}>
              {currentValue}
              {unit}
            </div>

            {/* Track */}
            <div
              className={styles.track}
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Filled portion */}
              <div
                className={styles.fill}
                style={{
                  width: `${fraction * 100}%`,
                  transition: isDragging ? 'none' : 'width var(--ui-transition-spring)',
                }}
              />

              {/* Snap tick marks */}
              <div className={styles.ticks}>
                {values.map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.tick} ${i <= activeIndex ? styles.tickFilled : ''}`}
                    style={{
                      left: `${(i / (values.length - 1)) * 100}%`,
                    }}
                  />
                ))}
              </div>

              {/* Thumb */}
              <div
                className={`${styles.thumb} ${isDragging ? styles.thumbDragging : ''}`}
                style={{
                  left: `${fraction * 100}%`,
                  transition: isDragging ? 'none' : 'left var(--ui-transition-spring)',
                }}
              />
            </div>
          </div>

          {/* Value labels below track */}
          <div className={styles.labels}>
            {values.map((v, i) => (
              <button
                key={v}
                className={`${styles.label} ${i === activeIndex ? styles.labelActive : ''}`}
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
    </div>
  )
}
