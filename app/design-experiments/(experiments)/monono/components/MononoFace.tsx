'use client'

import { useEffect, useState } from 'react'

type Mood = 'idle' | 'talking' | 'pouty' | 'sleep' | 'wink'

const MOUTHS: Record<Mood, React.ReactNode> = {
  idle: <path d="M 90 135 Q 100 142 110 135" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />,
  talking: <ellipse cx="100" cy="138" rx="10" ry="7" fill="currentColor" />,
  pouty: <path d="M 92 140 Q 100 132 108 140" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />,
  sleep: <path d="M 90 138 L 110 138" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />,
  wink: <path d="M 88 135 Q 100 148 112 135" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" />,
}

export function MononoFace({
  mood = 'idle',
  speaking = false,
}: {
  mood?: Mood
  speaking?: boolean
}) {
  const [blink, setBlink] = useState(false)
  const [talkFrame, setTalkFrame] = useState(0)

  useEffect(() => {
    if (mood === 'sleep') return
    let timeout: ReturnType<typeof setTimeout>
    const schedule = () => {
      timeout = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 140)
        schedule()
      }, 2200 + Math.random() * 2600)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [mood])

  useEffect(() => {
    if (!speaking) {
      setTalkFrame(0)
      return
    }
    const id = setInterval(() => setTalkFrame(f => (f + 1) % 3), 110)
    return () => clearInterval(id)
  }, [speaking])

  const activeMood: Mood = speaking ? 'talking' : mood
  const eyesClosed = blink || mood === 'sleep'

  const talkMouth = [
    <ellipse key="0" cx="100" cy="138" rx="7" ry="4" fill="currentColor" />,
    <ellipse key="1" cx="100" cy="138" rx="9" ry="7" fill="currentColor" />,
    <ellipse key="2" cx="100" cy="138" rx="5" ry="3" fill="currentColor" />,
  ]

  return (
    <svg viewBox="0 0 200 200" className="monono-face" aria-hidden>
      <defs>
        <radialGradient id="mono-bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fff4f9" />
          <stop offset="55%" stopColor="#ffc2dc" />
          <stop offset="100%" stopColor="#e88cbd" />
        </radialGradient>
        <radialGradient id="mono-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff7fb1" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff7fb1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mono-bow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ff9dc4" />
          <stop offset="100%" stopColor="#d84a86" />
        </radialGradient>
        <radialGradient id="mono-eye" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#6b3555" />
          <stop offset="60%" stopColor="#2a1220" />
          <stop offset="100%" stopColor="#1a0812" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="88" fill="url(#mono-bg)" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#d66a9a" strokeWidth="1.5" opacity="0.35" />

      <g transform="translate(100 28)">
        <path d="M 0 0 L -18 -10 L -18 10 Z" fill="url(#mono-bow)" />
        <path d="M 0 0 L 18 -10 L 18 10 Z" fill="url(#mono-bow)" />
        <circle cx="0" cy="0" r="5" fill="#d84a86" />
        <circle cx="-1.5" cy="-1.5" r="1.5" fill="#ffd0e5" opacity="0.9" />
      </g>

      <circle cx="62" cy="128" r="13" fill="url(#mono-cheek)" />
      <circle cx="138" cy="128" r="13" fill="url(#mono-cheek)" />

      {eyesClosed ? (
        <>
          <path d="M 70 108 Q 80 118 90 108" stroke="#4a1d33" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 110 108 Q 120 118 130 108" stroke="#4a1d33" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 66 102 L 70 106" stroke="#4a1d33" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 134 102 L 130 106" stroke="#4a1d33" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'wink' ? (
        <>
          <ellipse cx="80" cy="110" rx="10" ry="13" fill="url(#mono-eye)" />
          <circle cx="84" cy="105" r="4" fill="#fff" />
          <circle cx="78" cy="114" r="2" fill="#fff" opacity="0.85" />
          <path d="M 70 100 Q 80 96 90 100" stroke="#4a1d33" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 108 112 Q 120 120 132 112" stroke="#4a1d33" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M 107 112 L 104 110" stroke="#4a1d33" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 133 112 L 136 110" stroke="#4a1d33" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="80" cy="110" rx="10" ry="13" fill="url(#mono-eye)" />
          <ellipse cx="120" cy="110" rx="10" ry="13" fill="url(#mono-eye)" />
          <circle cx="84" cy="105" r="4" fill="#fff" />
          <circle cx="124" cy="105" r="4" fill="#fff" />
          <circle cx="78" cy="114" r="2" fill="#fff" opacity="0.85" />
          <circle cx="118" cy="114" r="2" fill="#fff" opacity="0.85" />
          <path d="M 70 100 Q 80 96 90 100" stroke="#4a1d33" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 110 100 Q 120 96 130 100" stroke="#4a1d33" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 68 98 L 66 95" stroke="#4a1d33" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 132 98 L 134 95" stroke="#4a1d33" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}

      <g style={{ color: '#4a1d33' }}>
        {speaking ? talkMouth[talkFrame] : MOUTHS[activeMood]}
      </g>

      <g opacity="0.7">
        <circle cx="36" cy="60" r="2" fill="#fff" />
        <circle cx="162" cy="72" r="1.5" fill="#fff" />
        <circle cx="168" cy="110" r="2" fill="#fff" />
        <circle cx="30" cy="118" r="1.5" fill="#fff" />
      </g>

      <text
        x="100"
        y="178"
        textAnchor="middle"
        fontSize="9"
        fontFamily="monospace"
        fill="#6b2d4a"
        opacity="0.5"
        letterSpacing="2"
      >
        MONONO
      </text>
    </svg>
  )
}
