'use client'

// Panel chrome: title bar with status LED + DecodeText title + deterministic
// hex id, corner brackets via CSS. Content-agnostic — wrap any panel body.
// Part of the composable contract: chrome is separate from content.

import type { ReactNode } from 'react'
import { DecodeText } from '@/app/components/DecodeText'
import { hash2 } from '../lib/rng'

type PanelProps = {
  title: string
  /** Visual family: cyan vector glass (default), green phosphor, mono LCD. */
  accent?: 'cyan' | 'green' | 'lcd'
  className?: string
  children: ReactNode
}

export function Panel({ title, accent = 'cyan', className = '', children }: PanelProps) {
  // Deterministic per-title id + LED phase — hydration-safe flavor.
  const seed = hash2(title.length * 131, (title.charCodeAt(0) || 65) * 17 + title.charCodeAt(title.length - 1))
  const id = (seed % 0xfff).toString(16).toUpperCase().padStart(3, '0')
  const ledDelay = `${(seed % 24) * -100}ms`

  return (
    <section className={`wr-panel wr-accent-${accent} ${className}`}>
      <header className="wr-panel-head">
        <span className="wr-led" style={{ animationDelay: ledDelay }} aria-hidden />
        <DecodeText className="wr-panel-title" text={title} speed={34} step={1} aria-label={title} />
        <span className="wr-panel-id">{id}</span>
      </header>
      <div className="wr-panel-body">{children}</div>
    </section>
  )
}
