'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
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

/* ------------------------------------------------------------------ */
/*  JSON spec types                                                    */
/* ------------------------------------------------------------------ */

export interface ModelTag {
  label: string
  icon?: 'resolution' | 'duration'
}

export interface ModelItem {
  id: string
  label: string
  icon?: string
  iconNode?: ReactNode
  tags?: ModelTag[]
  badge?: string
  description?: string
  children?: ModelItem[]
}

export interface ModelSection {
  title: string
  icon?: string
  items: ModelItem[]
}

export interface ModelSelectorProps {
  sections: ModelSection[]
  defaultValue?: string
  placeholder?: string
  onChange?: (model: ModelItem) => void
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
      // Horizontal: if overflows right, flip to left of trigger
      if (rect.right > window.innerWidth - pad) {
        el.style.left = 'auto'
        el.style.right = 'calc(100% + 8px)'
      }
      // Vertical: clamp within viewport while keeping centered feel
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
    // Reset before measuring
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

  // Find the hovered parent across all sections
  const hoveredParentItem = hoveredParent
    ? sections.flatMap((s) => s.items).find((m) => m.id === hoveredParent)
    : null

  return (
    <div className="model-selector-wrapper" ref={wrapperRef}>
      {/* Trigger */}
      <button
        className="model-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="model-trigger-left">
          <span className="model-trigger-meta">Model</span>
          {selected ? (
            <span className="model-trigger-value">{selected.label}</span>
          ) : (
            <span className="model-trigger-placeholder">{placeholder}</span>
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
        <div className="model-flyout component-card" ref={flyoutRef}>
          {/* Search */}
          <div className="model-search">
            <Search size={15} strokeWidth={1.6} style={{ opacity: 0.35, flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              className="model-search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="model-divider" />

          {isSearching ? (
            <div className="model-list">
              {filtered.length === 0 && (
                <div className="model-empty">No models found</div>
              )}
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className={`model-option ${selected?.id === item.id ? 'active' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <ModelIcon item={item} />
                  <div className="model-option-content">
                    <span className="model-option-label">{item.label}</span>
                    {item.tags && (
                      <span className="model-option-tags">
                        {item.tags.map((t, i) => (
                          <TagPill key={i} tag={t} />
                        ))}
                      </span>
                    )}
                  </div>
                  {selected?.id === item.id && (
                    <Check size={16} strokeWidth={2} className="model-check" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="model-menu-container">
              <div className="model-list">
                {sections.map((section, si) => (
                  <div key={si} className="model-section">
                    <div className="model-section-header">
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
                          {ii > 0 && <div className="model-item-divider" />}
                          <button
                            className={`model-option ${isSelected ? 'active' : ''} ${
                              hoveredParent === item.id ? 'submenu-open' : ''
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
                            <div className="model-option-content">
                              <span className="model-option-label">
                                {item.label}
                                {item.badge && (
                                  <span className="model-option-badge">{item.badge}</span>
                                )}
                              </span>
                              {item.tags && !hasChildren && (
                                <span className="model-option-tags">
                                  {item.tags.map((t, i) => (
                                    <TagPill key={i} tag={t} />
                                  ))}
                                </span>
                              )}
                              {item.description && (
                                <span className="model-option-desc">{item.description}</span>
                              )}
                            </div>
                            {!hasChildren && isSelected && (
                              <Check size={16} strokeWidth={2} className="model-check" />
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

                    {si < sections.length - 1 && <div className="model-section-divider" />}
                  </div>
                ))}
              </div>

              {/* Submenu flyout */}
              {hoveredParentItem?.children && (
                <div
                  className="model-submenu component-card"
                  ref={submenuRef}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                  }}
                  onMouseLeave={() => setHoveredParent(null)}
                >
                  {hoveredParentItem.children.map((child) => (
                    <button
                      key={child.id}
                      className={`model-option ${
                        selected?.id === child.id ? 'active' : ''
                      }`}
                      onClick={() => handleSelect(child)}
                    >
                      <div className="model-option-content">
                        <span className="model-option-label">{child.label}</span>
                        {child.tags && (
                          <span className="model-option-tags">
                            {child.tags.map((t, i) => (
                              <TagPill key={i} tag={t} />
                            ))}
                          </span>
                        )}
                      </div>
                      {selected?.id === child.id && (
                        <Check size={16} strokeWidth={2} className="model-check" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .model-selector-wrapper {
          position: relative;
        }

        /* ---- Trigger ---- */
        .model-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 286px;
          background: var(--ui-bg-card);
          border: 1px solid var(--ui-border-subtle);
          border-radius: var(--ui-radius-md);
          padding: 12px 14px;
          font-family: var(--ui-font);
          color: var(--ui-text-primary);
          cursor: pointer;
          transition:
            background var(--ui-transition-snap),
            border-color var(--ui-transition-snap);
        }

        .model-trigger:hover {
          background: var(--ui-bg-card-hover);
          border-color: var(--ui-border);
        }

        .model-trigger-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .model-trigger-meta {
          font-size: 11px;
          color: var(--ui-text-muted);
          font-weight: 500;
        }

        .model-trigger-value {
          font-size: 15px;
          font-weight: 500;
        }

        .model-trigger-placeholder {
          font-size: 15px;
          color: var(--ui-text-muted);
        }

        /* ---- Flyout ---- */
        .model-flyout {
          position: absolute;
          top: 50%;
          left: calc(100% + 8px);
          transform: translateY(-50%);
          width: 320px;
          padding: 6px;
          z-index: 200;
          animation: modelFlyIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: visible;
        }

        @keyframes modelFlyIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-6px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0) scale(1);
          }
        }

        /* ---- Search ---- */
        .model-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
        }

        .model-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--ui-font);
          font-size: 14px;
          color: var(--ui-text-primary);
        }

        .model-search-input::placeholder {
          color: var(--ui-text-muted);
        }

        .model-divider {
          height: 1px;
          background: var(--ui-border);
          margin: 4px 6px;
        }

        /* ---- Sections ---- */
        .model-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px 4px;
          font-family: var(--ui-font);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: var(--ui-text-muted);
        }

        /* ---- Menu container ---- */
        .model-menu-container {
          position: relative;
        }

        .model-list {
          display: flex;
          flex-direction: column;
          max-height: 400px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .model-list::-webkit-scrollbar {
          display: none;
        }

        .model-empty {
          padding: 16px 12px;
          font-family: var(--ui-font);
          font-size: 13px;
          color: var(--ui-text-muted);
          text-align: center;
        }

        /* ---- Option row ---- */
        .model-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: none;
          border: none;
          border-radius: var(--ui-radius-sm);
          padding: 8px 10px;
          font-family: var(--ui-font);
          color: var(--ui-text-secondary);
          cursor: pointer;
          transition:
            background var(--ui-transition-snap),
            color var(--ui-transition-snap);
        }

        .model-option:hover,
        .model-option.submenu-open {
          background: var(--ui-bg-surface);
          color: var(--ui-text-primary);
        }

        .model-option.active {
          color: var(--ui-text-primary);
        }

        .model-option-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          text-align: left;
          min-width: 0;
        }

        .model-option-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        .model-option-desc {
          font-size: 12px;
          color: var(--ui-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .model-option-tags {
          display: flex;
          gap: 8px;
        }

        .model-option-badge {
          font-family: var(--ui-font-mono);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--ui-accent);
          background: var(--ui-accent-dim);
          border-radius: 3px;
          padding: 1px 5px;
          text-transform: uppercase;
        }

        /* Icon and tag styles are inline (sub-component scoping) */

        /* ---- Dividers ---- */
        .model-item-divider {
          height: 0;
          border: none;
          border-top: 1px dotted var(--ui-border);
          margin: 1px 10px;
        }

        .model-section-divider {
          height: 1px;
          background: var(--ui-border);
          margin: 6px 10px;
        }

        .model-check {
          color: var(--ui-accent);
          flex-shrink: 0;
        }

        /* ---- Submenu ---- */
        .model-submenu {
          position: absolute;
          left: calc(100% + 6px);
          top: 0;
          min-width: 240px;
          padding: 6px;
          z-index: 210;
          display: flex;
          flex-direction: column;
          overflow: visible;
          animation: subFlyIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes subFlyIn {
          from {
            opacity: 0;
            transform: translateX(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
