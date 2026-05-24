'use client'

import { useEffect, useState } from 'react'

const DEFAULT_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·.-<>'

type DecodeTextProps = {
  /** Final text the effect resolves to. */
  text: string
  /** Delay (ms) before characters begin locking in. Useful for staggering. */
  delay?: number
  /** Tick interval (ms). Lower is faster churn. */
  speed?: number
  /** Characters locked per tick. Higher resolves the line sooner. */
  step?: number
  /** Glyph pool used while scrambling. */
  glyphs?: string
} & Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>

function randomChar(glyphs: string, target: string): string {
  if (target === ' ') return ' '
  return glyphs[Math.floor(Math.random() * glyphs.length)]
}

function randomScramble(text: string, resolved: number, glyphs: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += i < resolved ? text[i] : randomChar(glyphs, text[i])
  }
  return out
}

// Deterministic first frame — no Math.random, so the server-rendered markup
// matches the client's first paint (avoids a hydration mismatch). The random
// churn takes over in useEffect, client-side only.
function staticScramble(text: string, glyphs: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += text[i] === ' ' ? ' ' : glyphs[(i * 31 + text.length * 7) % glyphs.length]
  }
  return out
}

/**
 * Terminal-style scramble-to-resolve text. Each character churns through random
 * glyphs and locks in left-to-right once `delay` elapses. Length-stable, so the
 * layout never reflows while animating.
 *
 * Decorative by default — if the resolved text is meaningful content, pass an
 * `aria-label` with the final string and/or `aria-hidden` as appropriate.
 */
export function DecodeText({
  text,
  delay = 0,
  speed = 28,
  step = 2,
  glyphs = DEFAULT_GLYPHS,
  ...rest
}: DecodeTextProps) {
  const [display, setDisplay] = useState(() => staticScramble(text, glyphs))

  useEffect(() => {
    let resolved = 0
    let resolving = false
    const start = setTimeout(() => {
      resolving = true
    }, delay)
    const id = setInterval(() => {
      if (resolving && resolved < text.length) resolved += step
      setDisplay(randomScramble(text, resolved, glyphs))
      if (resolving && resolved >= text.length) clearInterval(id)
    }, speed)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [text, delay, speed, step, glyphs])

  return <span {...rest}>{display}</span>
}
