'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export type Mood = 'idle' | 'pouty' | 'sleep' | 'wink'

const BASE = '/design-experiments/monono/sprites'

const SRC = {
  idle: `${BASE}/idle.png`,
  pouty: `${BASE}/pouty.png`,
  sleep: `${BASE}/sleep.png`,
  wink: `${BASE}/wink.png`,
  'talking-open': `${BASE}/talking-open.png`,
  'talking-narrow': `${BASE}/talking-narrow.png`,
  blink: `${BASE}/blink.png`,
  tongue: `${BASE}/tongue.png`,
  'smile-big': `${BASE}/smile-big.png`,
  'look-side': `${BASE}/look-side.png`,
  yawn: `${BASE}/yawn.png`,
  'heart-eyes': `${BASE}/heart-eyes.png`,
} as const

type SpriteKey = keyof typeof SRC

const TALK_FRAMES = ['talking-open', 'talking-narrow'] as const satisfies readonly SpriteKey[]

type RestingKey = Extract<
  SpriteKey,
  'idle' | 'smile-big' | 'look-side' | 'tongue' | 'heart-eyes' | 'yawn'
>

const RESTING_POOL: { name: RestingKey; weight: number }[] = [
  { name: 'idle', weight: 32 },
  { name: 'smile-big', weight: 18 },
  { name: 'look-side', weight: 18 },
  { name: 'tongue', weight: 12 },
  { name: 'yawn', weight: 6 },
  { name: 'heart-eyes', weight: 2 },
]

const RESTING_TOTAL = RESTING_POOL.reduce((s, p) => s + p.weight, 0)

function pickResting(exclude?: RestingKey): RestingKey {
  const pool = exclude ? RESTING_POOL.filter(p => p.name !== exclude) : RESTING_POOL
  const total = pool.reduce((s, p) => s + p.weight, 0) || RESTING_TOTAL
  let r = Math.random() * total
  for (const p of pool) {
    if ((r -= p.weight) <= 0) return p.name
  }
  return 'idle'
}

export function MononoSprite({
  mood = 'idle',
  speaking = false,
  size = 160,
}: {
  mood?: Mood
  speaking?: boolean
  size?: number
}) {
  const [talkFrame, setTalkFrame] = useState(0)
  const [resting, setResting] = useState<RestingKey>('idle')
  const [blinking, setBlinking] = useState(false)

  const changeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!speaking) {
      setTalkFrame(0)
      return
    }
    const id = setInterval(() => setTalkFrame(f => (f + 1) % TALK_FRAMES.length), 140)
    return () => clearInterval(id)
  }, [speaking])

  useEffect(() => {
    const clearAll = () => {
      if (changeTimer.current) clearTimeout(changeTimer.current)
      if (blinkTimer.current) clearTimeout(blinkTimer.current)
      if (blinkClearTimer.current) clearTimeout(blinkClearTimer.current)
      changeTimer.current = null
      blinkTimer.current = null
      blinkClearTimer.current = null
    }

    if (mood !== 'idle' || speaking) {
      clearAll()
      setBlinking(false)
      return
    }

    const scheduleChange = () => {
      const delay = 5000 + Math.random() * 6500
      changeTimer.current = setTimeout(() => {
        setResting(prev => pickResting(prev))
        scheduleChange()
      }, delay)
    }

    const scheduleBlink = () => {
      const delay = 2600 + Math.random() * 3800
      blinkTimer.current = setTimeout(() => {
        setBlinking(true)
        blinkClearTimer.current = setTimeout(() => {
          setBlinking(false)
          scheduleBlink()
        }, 170)
      }, delay)
    }

    scheduleChange()
    scheduleBlink()
    return clearAll
  }, [mood, speaking])

  let key: SpriteKey
  if (speaking) {
    key = TALK_FRAMES[talkFrame]
  } else if (mood !== 'idle') {
    key = mood
  } else if (blinking) {
    key = 'blink'
  } else {
    key = resting
  }

  return (
    <div
      className="monono-sprite-wrap"
      style={{ width: size, height: size }}
    >
      {(Object.keys(SRC) as SpriteKey[]).map(k => (
        <Image
          key={k}
          src={SRC[k]}
          alt=""
          width={size}
          height={size}
          className={`monono-sprite ${k === key ? 'is-active' : ''}`}
          priority={k === 'idle'}
          unoptimized
          aria-hidden
        />
      ))}
      <span className="sr-only" aria-live="polite">
        Monono {mood}{speaking ? ', talking' : ''}
      </span>
    </div>
  )
}
