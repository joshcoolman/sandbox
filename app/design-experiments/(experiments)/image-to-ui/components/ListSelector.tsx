'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './ListSelector.module.css'

interface ListSelectorOption {
  label: string
  badge?: string
}

interface ListSelectorProps {
  options: (string | ListSelectorOption)[]
  defaultValue?: string
  icon?: React.ReactNode
  onChange?: (value: string) => void
  className?: string
}

function normalize(opt: string | ListSelectorOption): ListSelectorOption {
  return typeof opt === 'string' ? { label: opt } : opt
}

export default function ListSelector({
  options,
  defaultValue,
  icon,
  onChange,
  className,
}: ListSelectorProps) {
  const items = options.map(normalize)
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(
    defaultValue ?? items[0]?.label ?? ''
  )
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

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {icon && <span className={styles.triggerIcon}>{icon}</span>}
        {selected}
      </button>

      {isOpen && (
        <div className={styles.popover} ref={popoverRef}>
          {items.map((item) => (
            <button
              key={item.label}
              className={`${styles.option} ${item.label === selected ? styles.optionActive : ''}`}
              onClick={() => handleSelect(item.label)}
            >
              <span className={styles.optionLabel}>{item.label}</span>
              {item.badge && (
                <span className={styles.optionBadge}>{item.badge}</span>
              )}
              {item.label === selected && (
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
