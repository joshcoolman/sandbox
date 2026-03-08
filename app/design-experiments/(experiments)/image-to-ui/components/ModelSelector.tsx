'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronRight,
  Search,
  Sparkles,
  Check,
  Image,
  Video,
  Music,
  Box,
  Mic,
  Volume2,
  Activity,
  Pen,
  Layers,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ModelTag, ModelItem, ModelSection } from '../types'
import styles from './ModelSelector.module.css'

export interface ModelSelectorProps {
  sections: ModelSection[]
  defaultValue?: string
  placeholder?: string
  onChange?: (model: ModelItem) => void
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  image: Image,
  video: Video,
  music: Music,
  box: Box,
  mic: Mic,
  volume2: Volume2,
  activity: Activity,
  pen: Pen,
  layers: Layers,
  zap: Zap,
}

const iconBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'var(--ui-bg-surface)',
  border: '1px solid var(--ui-border)',
  color: 'var(--ui-text-muted)',
  flexShrink: 0,
}

function ModelIcon({ item, size = 28 }: { item: ModelItem; size?: number }) {
  if (item.iconNode) return <span style={iconBoxStyle}>{item.iconNode}</span>
  if (item.icon && ICON_MAP[item.icon]) {
    const Icon = ICON_MAP[item.icon]
    return (
      <span style={iconBoxStyle}>
        <Icon size={size * 0.55} strokeWidth={1.5} />
      </span>
    )
  }
  return <span style={iconBoxStyle} />
}

/* ------------------------------------------------------------------ */
/*  Tag pill                                                           */
/* ------------------------------------------------------------------ */

function TagPill({ tag }: { tag: ModelTag }) {
  return (
    <span
      style={{
        fontFamily: 'var(--ui-font)',
        fontSize: 12,
        color: 'var(--ui-text-muted)',
        ...(tag.icon === 'resolution' ? { display: 'inline-block', minWidth: 38 } : {}),
      }}
    >
      {tag.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function findModel(sections: ModelSection[], id: string): ModelItem | undefined {
  for (const s of sections) {
    for (const m of s.items) {
      if (m.id === id) return m
      if (m.children) {
        const found = m.children.find((c) => c.id === id)
        if (found) return found
      }
    }
  }
  return undefined
}

function allLeafModels(sections: ModelSection[]): ModelItem[] {
  const out: ModelItem[] = []
  for (const s of sections) {
    for (const m of s.items) {
      if (m.children) out.push(...m.children)
      else out.push(m)
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ModelSelector({
  sections,
  defaultValue,
  placeholder = 'Select model',
  onChange,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<ModelItem | null>(
    defaultValue ? findModel(sections, defaultValue) ?? null : null
  )
  const [hoveredParent, setHoveredParent] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSelect = useCallback(
    (item: ModelItem) => {
      if (item.children) return
      setSelected(item)
      setIsOpen(false)
      setSearch('')
      setHoveredParent(null)
      onChange?.(item)
    },
    [onChange]
  )

  useEffect(() => {
    if (!isOpen) return
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
        setHoveredParent(null)
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

  // Viewport-aware submenu positioning
  useEffect(() => {
    if (!hoveredParent || !submenuRef.current) return
    const el = submenuRef.current
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
  }, [hoveredParent])

  const isSearching = search.length > 0
  const filtered = isSearching
    ? allLeafModels(sections).filter((m) =>
        m.label.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const handleParentHover = useCallback((id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => setHoveredParent(id), 80)
  }, [])

  const handleParentLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }, [])

  const hoveredParentItem = hoveredParent
    ? sections.flatMap((s) => s.items).find((m) => m.id === hoveredParent)
    : null

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`} ref={wrapperRef}>
      {/* Trigger */}
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.triggerLeft}>
          <span className={styles.triggerMeta}>Model</span>
          {selected ? (
            <span className={styles.triggerValue}>{selected.label}</span>
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.divider} />

          {isSearching ? (
            <div className={styles.list}>
              {filtered.length === 0 && (
                <div className={styles.empty}>No models found</div>
              )}
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.option} ${selected?.id === item.id ? styles.optionActive : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <ModelIcon item={item} />
                  <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>{item.label}</span>
                    {item.tags && (
                      <span className={styles.optionTags}>
                        {item.tags.map((t, i) => (
                          <TagPill key={i} tag={t} />
                        ))}
                      </span>
                    )}
                  </div>
                  {selected?.id === item.id && (
                    <Check size={16} strokeWidth={2} className={styles.check} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.menuContainer}>
              <div className={styles.list}>
                {sections.map((section, si) => (
                  <div key={si}>
                    <div className={styles.sectionHeader}>
                      {section.icon && ICON_MAP[section.icon] && (() => {
                        const SIcon = ICON_MAP[section.icon!]
                        return <SIcon size={12} strokeWidth={1.6} style={{ opacity: 0.5 }} />
                      })()}
                      {section.title}
                    </div>

                    {section.items.map((item, ii) => {
                      const hasChildren = !!item.children?.length
                      const isSelected = selected?.id === item.id ||
                        (hasChildren && item.children?.some((c) => c.id === selected?.id))
                      return (
                        <div key={item.id}>
                          {ii > 0 && <div className={styles.itemDivider} />}
                          <button
                            className={`${styles.option} ${isSelected ? styles.optionActive : ''} ${
                              hoveredParent === item.id ? styles.submenuOpen : ''
                            }`}
                            onClick={() => !hasChildren && handleSelect(item)}
                            onMouseEnter={() =>
                              hasChildren
                                ? handleParentHover(item.id)
                                : setHoveredParent(null)
                            }
                            onMouseLeave={handleParentLeave}
                          >
                            <ModelIcon item={item} />
                            <div className={styles.optionContent}>
                              <span className={styles.optionLabel}>
                                {item.label}
                                {item.badge && (
                                  <span className={styles.optionBadge}>{item.badge}</span>
                                )}
                              </span>
                              {item.tags && !hasChildren && (
                                <span className={styles.optionTags}>
                                  {item.tags.map((t, i) => (
                                    <TagPill key={i} tag={t} />
                                  ))}
                                </span>
                              )}
                              {item.description && (
                                <span className={styles.optionDesc}>{item.description}</span>
                              )}
                            </div>
                            {!hasChildren && isSelected && (
                              <Check size={16} strokeWidth={2} className={styles.check} />
                            )}
                            {hasChildren && (
                              <ChevronRight
                                size={14}
                                strokeWidth={1.6}
                                style={{ opacity: 0.3, flexShrink: 0 }}
                              />
                            )}
                          </button>
                        </div>
                      )
                    })}

                    {si < sections.length - 1 && <div className={styles.sectionDivider} />}
                  </div>
                ))}
              </div>

              {/* Submenu flyout */}
              {hoveredParentItem?.children && (
                <div
                  className={styles.submenu}
                  ref={submenuRef}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                  }}
                  onMouseLeave={() => setHoveredParent(null)}
                >
                  {hoveredParentItem.children.map((child) => (
                    <button
                      key={child.id}
                      className={`${styles.option} ${
                        selected?.id === child.id ? styles.optionActive : ''
                      }`}
                      onClick={() => handleSelect(child)}
                    >
                      <div className={styles.optionContent}>
                        <span className={styles.optionLabel}>{child.label}</span>
                        {child.tags && (
                          <span className={styles.optionTags}>
                            {child.tags.map((t, i) => (
                              <TagPill key={i} tag={t} />
                            ))}
                          </span>
                        )}
                      </div>
                      {selected?.id === child.id && (
                        <Check size={16} strokeWidth={2} className={styles.check} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
