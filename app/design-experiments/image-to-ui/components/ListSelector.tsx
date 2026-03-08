'use client'

import { useState, useRef, useEffect } from 'react'

interface ListSelectorOption {
  label: string
  badge?: string
}

interface ListSelectorProps {
  options: (string | ListSelectorOption)[]
  defaultValue?: string
  icon?: React.ReactNode
  onChange?: (value: string) => void
}

function normalize(opt: string | ListSelectorOption): ListSelectorOption {
  return typeof opt === 'string' ? { label: opt } : opt
}

export default function ListSelector({
  options,
  defaultValue,
  icon,
  onChange,
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
    <div className="list-selector-wrapper">
      <button
        className="list-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {icon && <span className="list-trigger-icon">{icon}</span>}
        {selected}
      </button>

      {isOpen && (
        <div className="list-popover component-card" ref={popoverRef}>
          {items.map((item) => (
            <button
              key={item.label}
              className={`list-option ${item.label === selected ? 'active' : ''}`}
              onClick={() => handleSelect(item.label)}
            >
              <span className="list-option-label">{item.label}</span>
              {item.badge && (
                <span className="list-option-badge">{item.badge}</span>
              )}
              {item.label === selected && (
                <svg
                  className="list-check"
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

      <style jsx>{`
        .list-selector-wrapper {
          position: relative;
        }

        .list-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 80px;
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

        .list-trigger:hover {
          background: var(--ui-bg-elevated);
          border-color: var(--ui-text-muted);
        }

        .list-trigger-icon {
          display: flex;
          align-items: center;
          opacity: 0.6;
        }

        .list-popover {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 180px;
          padding: 6px;
          z-index: 100;
          animation: listPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes listPopIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .list-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: none;
          border: none;
          border-radius: var(--ui-radius-sm);
          padding: 10px 12px;
          font-family: var(--ui-font);
          font-size: 15px;
          color: var(--ui-text-secondary);
          cursor: pointer;
          transition:
            background var(--ui-transition-snap),
            color var(--ui-transition-snap);
        }

        .list-option:hover {
          background: var(--ui-bg-surface);
          color: var(--ui-text-primary);
        }

        .list-option.active {
          color: var(--ui-text-primary);
        }

        .list-option-label {
          flex: 1;
          text-align: left;
        }

        .list-option-badge {
          font-family: var(--ui-font-mono);
          font-size: 11px;
          color: var(--ui-text-muted);
          background: var(--ui-bg-surface);
          border: 1px solid var(--ui-border);
          border-radius: 4px;
          padding: 2px 6px;
        }

        .list-check {
          color: var(--ui-text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
