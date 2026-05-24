'use client'

import { useEffect, useState } from 'react'
import { getDossier } from '../data/operatives'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·.-<>'

function scrambleChar(target: string): string {
  if (target === ' ') return ' '
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

function scramble(text: string, resolved: number): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += i < resolved ? text[i] : scrambleChar(text[i])
  }
  return out
}

// Deterministic first frame — no Math.random, so the server-rendered markup
// matches the client's first paint (avoids a hydration mismatch). The random
// churn takes over in useEffect, client-side only.
function staticScramble(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += text[i] === ' ' ? ' ' : GLYPHS[(i * 31 + text.length * 7) % GLYPHS.length]
  }
  return out
}

// One line that churns through random glyphs, then locks in left-to-right
// once its `delay` elapses. Length-stable so the layout never reflows.
function DecodeLine({
  text,
  delay = 0,
  className,
}: {
  text: string
  delay?: number
  className?: string
}) {
  const [display, setDisplay] = useState(() => staticScramble(text))

  useEffect(() => {
    let resolved = 0
    let resolving = false
    const start = setTimeout(() => {
      resolving = true
    }, delay)
    const id = setInterval(() => {
      if (resolving && resolved < text.length) resolved += 2
      setDisplay(scramble(text, resolved))
      if (resolving && resolved >= text.length) clearInterval(id)
    }, 28)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [text, delay])

  return <span className={className}>{display}</span>
}

const ROW_BASE = 540
const ROW_STEP = 110

export function OperativeReadout({ src }: { src: string }) {
  const d = getDossier(src)
  if (!d) return null

  return (
    <div className="op-readout" aria-hidden="true">
      <div className="op-readout-inner">
        <div className="op-label">
          <DecodeLine text={d.label} delay={150} />
          <span className="op-cursor" />
        </div>
        <div className="op-codename">
          <DecodeLine text={d.codename} delay={300} />
        </div>
        <div className="op-class">
          <DecodeLine text={d.classification} delay={420} />
        </div>
        <div className="op-rows">
          {d.rows.map((r, i) => (
            <div className="op-row" key={r.k}>
              <span className="op-k">
                <DecodeLine text={r.k} delay={ROW_BASE + i * ROW_STEP} />
              </span>
              <span className="op-v">
                <DecodeLine text={r.v} delay={ROW_BASE + i * ROW_STEP + 40} />
              </span>
            </div>
          ))}
        </div>
        <div className="op-ref">
          <DecodeLine text={d.ref} delay={ROW_BASE + d.rows.length * ROW_STEP} />
        </div>
      </div>
    </div>
  )
}
