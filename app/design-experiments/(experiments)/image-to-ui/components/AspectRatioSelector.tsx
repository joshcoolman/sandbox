'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './AspectRatioSelector.module.css'

interface AspectOption {
  label: string
  w: number
  h: number
}

const ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Auto', w: 1, h: 1 },
  { label: '1:1', w: 1, h: 1 },
  { label: '3:4', w: 3, h: 4 },
  { label: '4:3', w: 4, h: 3 },
  { label: '2:3', w: 2, h: 3 },
  { label: '3:2', w: 3, h: 2 },
  { label: '9:16', w: 9, h: 16 },
  { label: '16:9', w: 16, h: 9 },
  { label: '5:4', w: 5, h: 4 },
  { label: '4:5', w: 4, h: 5 },
  { label: '21:9', w: 21, h: 9 },
]

const ICON_SIZE = 20

function RatioIcon({ w, h, isAuto }: { w: number; h: number; isAuto?: boolean }) {
  const ratio = w / h
  let iconW: number
  let iconH: number

  if (ratio >= 1) {
    iconW = ICON_SIZE
    iconH = ICON_SIZE / ratio
  } else {
    iconH = ICON_SIZE
    iconW = ICON_SIZE * ratio
  }

  // Ensure minimum dimensions
  iconW = Math.max(iconW, 8)
  iconH = Math.max(iconH, 8)

  const x = (ICON_SIZE - iconW) / 2
  const y = (ICON_SIZE - iconH) / 2

  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`} fill="none">
      <rect
        x={x + 0.75}
        y={y + 0.75}
        width={iconW - 1.5}
        height={iconH - 1.5}
        rx={2.5}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {isAuto && (
        <rect
          x={x + 0.75}
          y={y + 0.75}
          width={iconW - 1.5}
          height={iconH - 1.5}
          rx={2.5}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      )}
    </svg>
  )
}

interface AspectRatioSelectorProps {
  defaultValue?: string
  onChange?: (value: string) => void
}

export default function AspectRatioSelector({
  defaultValue = '3:4',
  onChange,
}: AspectRatioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(defaultValue)
  const popoverRef = useRef<HTMLDivElement>(null)

  const handleSelect = (label: string) => {
    setSelected(label)
    setIsOpen(false)
    onChange?.(label)
  }

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const id = setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handleClick)
    }
  }, [isOpen])

  const selectedOption = ASPECT_OPTIONS.find((o) => o.label === selected) ?? ASPECT_OPTIONS[0]

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.triggerIcon}>
          <RatioIcon w={selectedOption.w} h={selectedOption.h} isAuto={selectedOption.label === 'Auto'} />
        </span>
        {selected}
      </button>

      {isOpen && (
        <div className={styles.popover} ref={popoverRef}>
          <div className={styles.header}>Aspect ratio</div>
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className={`${styles.option} ${opt.label === selected ? styles.optionActive : ''}`}
              onClick={() => handleSelect(opt.label)}
            >
              <span className={styles.optionIcon}>
                <RatioIcon w={opt.w} h={opt.h} isAuto={opt.label === 'Auto'} />
              </span>
              <span className={styles.optionLabel}>{opt.label}</span>
              {opt.label === selected && (
                <svg
                  className={styles.check}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 8.5L6.5 11.5L12.5 5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
