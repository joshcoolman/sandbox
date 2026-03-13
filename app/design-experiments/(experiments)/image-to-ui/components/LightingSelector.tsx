'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronRight, Search, Check, Copy } from 'lucide-react'
import styles from './LightingSelector.module.css'

export interface LightingPreset {
  title: string
  lighting: string
  color_grade: string
  palette?: [string, string, string]
  filmStock?: string
  lens?: string
  prompt?: string
  image?: string
}

interface LightingSelectorProps {
  presets: LightingPreset[]
  defaultValue?: string
  placeholder?: string
  onChange?: (preset: LightingPreset) => void
  onExpand?: (preset: LightingPreset) => void
  className?: string
}

function buildPromptText(preset: LightingPreset): string {
  if (preset.prompt) return preset.prompt
  const parts = [preset.lighting, preset.color_grade]
  if (preset.filmStock) parts.push(`shot on ${preset.filmStock}`)
  if (preset.lens) parts.push(preset.lens)
  return parts.join(', ')
}

export default function LightingSelector({
  presets,
  defaultValue,
  placeholder = 'Select look',
  onChange,
  onExpand,
  className,
}: LightingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<LightingPreset | null>(
    defaultValue ? presets.find((p) => p.title === defaultValue) ?? null : null
  )
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSelect = useCallback(
    (preset: LightingPreset) => {
      setSelected(preset)
      setIsOpen(false)
      setSearch('')
      setExpandedIndex(null)
      onChange?.(preset)
    },
    [onChange]
  )

  const handleCopy = useCallback(async (preset: LightingPreset, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = buildPromptText(preset)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
        setExpandedIndex(null)
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
    if (expandedIndex === null || !detailRef.current) return
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
  }, [expandedIndex])

  const getGradient = (preset: LightingPreset) => {
    if (!preset.palette) return 'linear-gradient(135deg, var(--ui-bg-surface), var(--ui-border))'
    const [a, b, c] = preset.palette
    return `linear-gradient(135deg, ${a}, ${b}, ${c})`
  }

  const isSearching = search.length > 0
  const filtered = isSearching
    ? presets.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : presets

  const handleItemHover = useCallback((index: number) => {
    const preset = filtered[index]
    if (expandedIndex !== index) {
      setExpandedIndex(index)
      setCopied(false)
      onExpand?.(preset)
    }
  }, [expandedIndex, filtered, onExpand])

  const handleItemClick = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const preset = filtered[index]
    setSelected(preset)
    onChange?.(preset)
  }, [filtered, onChange])

  const expandedPreset = expandedIndex !== null ? filtered[expandedIndex] : null

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`} ref={wrapperRef}>
      {/* Trigger */}
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.triggerLeft}>
          <span className={styles.triggerMeta}>Lighting</span>
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
                setExpandedIndex(null)
              }}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.menuContainer}>
            <div className={styles.list}>
              {filtered.length === 0 && (
                <div className={styles.empty}>No presets found</div>
              )}
              {filtered.map((preset, i) => (
                <button
                  key={preset.title}
                  className={`${styles.option} ${
                    selected?.title === preset.title ? styles.optionActive : ''
                  } ${expandedIndex === i ? styles.optionHovered : ''}`}
                  onMouseEnter={() => handleItemHover(i)}
                  onClick={(e) => handleItemClick(i, e)}
                  onDoubleClick={() => handleSelect(preset)}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: getGradient(preset) }}
                  />
                  <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>{preset.title}</span>
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

            {/* Detail panel -- click anywhere to copy */}
            {expandedPreset && (
              <div
                className={`${styles.detail} ${copied ? styles.detailCopied : ''}`}
                ref={detailRef}
                onClick={(e) => handleCopy(expandedPreset, e)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.detailImageWrap}>
                  {expandedPreset.image ? (
                    <img
                      src={expandedPreset.image}
                      alt={expandedPreset.title}
                      className={styles.detailImage}
                    />
                  ) : (
                    <div
                      className={styles.detailGradient}
                      style={{ background: getGradient(expandedPreset) }}
                    />
                  )}
                  {(expandedPreset.prompt || expandedPreset.lighting) && (
                    <button
                      className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ''}`}
                      onClick={(e) => handleCopy(expandedPreset, e)}
                      title="Copy prompt"
                    >
                      <Copy size={13} strokeWidth={1.8} />
                      <span className={styles.copyLabel}>
                        {copied ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  )}
                </div>
                <div className={styles.detailBody}>
                  <span className={styles.detailTitle}>
                    {expandedPreset.title}
                  </span>
                  <div className={styles.detailFields}>
                    <div className={styles.detailField}>
                      <span className={styles.detailLabel}>Lighting</span>
                      <span className={styles.detailValue}>
                        {expandedPreset.lighting}
                      </span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.detailLabel}>Color Grade</span>
                      <span className={styles.detailValue}>
                        {expandedPreset.color_grade}
                      </span>
                    </div>
                    {expandedPreset.filmStock && (
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Film Stock</span>
                        <span className={styles.detailValue}>
                          {expandedPreset.filmStock}
                        </span>
                      </div>
                    )}
                    {expandedPreset.lens && (
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Lens</span>
                        <span className={styles.detailValue}>
                          {expandedPreset.lens}
                        </span>
                      </div>
                    )}
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
