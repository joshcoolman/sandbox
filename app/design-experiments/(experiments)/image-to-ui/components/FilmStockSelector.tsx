'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronRight, Search, Check } from 'lucide-react'
import styles from './FilmStockSelector.module.css'

export interface FilmStockPreset {
  title: string
  type: string
  grain: string
  color: string
  palette?: [string, string, string]
  prompt?: string
}

interface FilmStockSelectorProps {
  presets: FilmStockPreset[]
  defaultValue?: string
  value?: string
  placeholder?: string
  onChange?: (preset: FilmStockPreset) => void
  className?: string
}

export default function FilmStockSelector({
  presets,
  defaultValue,
  value,
  placeholder = 'Select film',
  onChange,
  className,
}: FilmStockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<FilmStockPreset | null>(
    defaultValue ? presets.find((p) => p.title === defaultValue) ?? null : null
  )

  // Sync from controlled value prop
  useEffect(() => {
    if (value === undefined) return
    const match = presets.find((p) => p.title === value)
    if (match && match.title !== selected?.title) {
      setSelected(match)
    }
  }, [value, presets, selected?.title])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSelect = useCallback(
    (preset: FilmStockPreset) => {
      setSelected(preset)
      setIsOpen(false)
      setSearch('')
      setHoveredIndex(null)
      onChange?.(preset)
    },
    [onChange]
  )

  useEffect(() => {
    if (!isOpen) return
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
        setHoveredIndex(null)
      }
    }
    const id = setTimeout(() => document.addEventListener('click', handle), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handle)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [isOpen])

  // Scroll selected item into view when flyout opens
  useEffect(() => {
    if (!isOpen || !listRef.current || !selected) return
    requestAnimationFrame(() => {
      const idx = presets.findIndex((p) => p.title === selected.title)
      if (idx < 0 || !listRef.current) return
      const item = listRef.current.children[idx] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }, [isOpen, selected, presets])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  // Viewport-aware flyout positioning
  useEffect(() => {
    if (!isOpen || !flyoutRef.current) return
    const el = flyoutRef.current
    const pad = 12
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      if (rect.right > window.innerWidth - pad) {
        el.style.left = 'auto'
        el.style.right = 'calc(100% + 8px)'
      }
      if (rect.top < pad) {
        el.style.top = '0'
        el.style.transform = 'translateY(0)'
      } else if (rect.bottom > window.innerHeight - pad) {
        el.style.top = 'auto'
        el.style.bottom = '0'
        el.style.transform = 'translateY(0)'
      }
    })
  }, [isOpen])

  // Viewport-aware detail panel positioning
  useEffect(() => {
    if (hoveredIndex === null || !detailRef.current) return
    const el = detailRef.current
    const pad = 12
    el.style.left = 'calc(100% + 6px)'
    el.style.right = 'auto'
    el.style.top = '0'
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      if (rect.right > window.innerWidth - pad) {
        el.style.left = 'auto'
        el.style.right = 'calc(100% + 6px)'
      }
      if (rect.bottom > window.innerHeight - pad) {
        const overflow = rect.bottom - window.innerHeight + pad
        el.style.top = `${-overflow}px`
      }
    })
  }, [hoveredIndex])

  const getGradient = (preset: FilmStockPreset) => {
    if (!preset.palette) return 'linear-gradient(135deg, var(--ui-bg-surface), var(--ui-border))'
    const [a, b, c] = preset.palette
    return `linear-gradient(135deg, ${a}, ${b}, ${c})`
  }

  const isSearching = search.length > 0
  const filtered = isSearching
    ? presets.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase())
      )
    : presets

  const handleItemHover = useCallback((index: number) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => setHoveredIndex(index), 80)
  }, [])

  const handleItemLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }, [])

  const hoveredPreset = hoveredIndex !== null ? filtered[hoveredIndex] : null

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`} ref={wrapperRef}>
      {/* Trigger */}
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.triggerLeft}>
          <span className={styles.triggerMeta}>Film Stock</span>
          {selected ? (
            <span className={styles.triggerValue}>{selected.title}</span>
          ) : (
            <span className={styles.triggerPlaceholder}>{placeholder}</span>
          )}
        </span>
        <ChevronRight
          size={14}
          strokeWidth={1.6}
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform var(--ui-transition-snap)',
            opacity: 0.3,
          }}
        />
      </button>

      {/* Flyout */}
      {isOpen && (
        <div className={styles.flyout} ref={flyoutRef}>
          {/* Search */}
          <div className={styles.search}>
            <Search size={15} strokeWidth={1.6} style={{ opacity: 0.35, flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setHoveredIndex(null)
              }}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.menuContainer}>
            <div className={styles.list} ref={listRef}>
              {filtered.length === 0 && (
                <div className={styles.empty}>No film stocks found</div>
              )}
              {filtered.map((preset, i) => (
                <button
                  key={preset.title}
                  className={`${styles.option} ${
                    selected?.title === preset.title ? styles.optionActive : ''
                  } ${hoveredIndex === i ? styles.optionHovered : ''}`}
                  onClick={() => handleSelect(preset)}
                  onMouseEnter={() => handleItemHover(i)}
                  onMouseLeave={handleItemLeave}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: getGradient(preset) }}
                  />
                  <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>{preset.title}</span>
                    <span className={styles.optionType}>{preset.type}</span>
                  </div>
                  {selected?.title === preset.title && (
                    <Check size={16} strokeWidth={2} className={styles.check} />
                  )}
                  <ChevronRight
                    size={14}
                    strokeWidth={1.6}
                    style={{ opacity: 0.3, flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>

            {/* Detail submenu */}
            {hoveredPreset && (
              <div
                className={styles.detail}
                ref={detailRef}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={styles.detailGradient}
                  style={{ background: getGradient(hoveredPreset) }}
                />
                <div className={styles.detailBody}>
                  <span className={styles.detailTitle}>
                    {hoveredPreset.title}
                  </span>
                  <div className={styles.detailFields}>
                    <div className={styles.detailField}>
                      <span className={styles.detailLabel}>Type</span>
                      <span className={styles.detailValue}>
                        {hoveredPreset.type}
                      </span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.detailLabel}>Grain</span>
                      <span className={styles.detailValue}>
                        {hoveredPreset.grain}
                      </span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.detailLabel}>Color Character</span>
                      <span className={styles.detailValue}>
                        {hoveredPreset.color}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
