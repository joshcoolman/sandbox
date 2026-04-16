'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MononoFace } from './MononoFace'
import { voice, pick } from '../data/voice'

type Turn = {
  role: 'user' | 'assistant'
  content: string
  kind?: 'greeting' | 'nudge' | 'cutoff' | 'blocked' | 'error' | 'normal'
}

type SessionState = 'active' | 'ended' | 'blocked'

const IDLE_SOFT_MS = 30_000
const IDLE_POUTY_MS = 90_000

export function MononoChat() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [session, setSession] = useState<SessionState>('active')
  const [mood, setMood] = useState<'idle' | 'pouty' | 'sleep' | 'wink'>('idle')
  const [speaking, setSpeaking] = useState(false)
  const [nudgeLevel, setNudgeLevel] = useState<0 | 1 | 2>(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    setTurns([{ role: 'assistant', content: pick(voice.greetings), kind: 'greeting' }])
    animateSpeaking()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns])

  const animateSpeaking = useCallback(() => {
    setSpeaking(true)
    window.setTimeout(() => setSpeaking(false), 900)
  }, [])

  useEffect(() => {
    if (session !== 'active') return

    const tick = () => {
      const elapsed = Date.now() - lastActivityRef.current
      if (elapsed > IDLE_POUTY_MS && nudgeLevel < 2) {
        setTurns(t => [...t, { role: 'assistant', content: pick(voice.idlePouty), kind: 'nudge' }])
        setMood('pouty')
        animateSpeaking()
        setNudgeLevel(2)
        lastActivityRef.current = Date.now()
      } else if (elapsed > IDLE_SOFT_MS && nudgeLevel < 1) {
        setTurns(t => [...t, { role: 'assistant', content: pick(voice.idleSoft), kind: 'nudge' }])
        animateSpeaking()
        setNudgeLevel(1)
        lastActivityRef.current = Date.now()
      }
    }

    const id = window.setInterval(tick, 3000)
    return () => window.clearInterval(id)
  }, [session, nudgeLevel, animateSpeaking])

  const history = useMemo(
    () =>
      turns
        .filter(t => t.kind !== 'nudge' && t.kind !== 'greeting' && t.kind !== 'cutoff' && t.kind !== 'blocked' && t.kind !== 'error')
        .map(t => ({ role: t.role, content: t.content })),
    [turns]
  )

  const endSession = useCallback((reason: 'cutoff' | 'blocked' | 'global') => {
    const cutoffLine = reason === 'cutoff' ? pick(voice.sessionCutoff) : null
    const blockedLine = reason === 'global' ? pick(voice.globalClosed) : pick(voice.refreshBlocked)
    setTurns(t => [
      ...t,
      ...(cutoffLine ? [{ role: 'assistant' as const, content: cutoffLine, kind: 'cutoff' as const }] : []),
      { role: 'assistant' as const, content: blockedLine, kind: 'blocked' as const },
      { role: 'assistant' as const, content: pick(voice.sessionEnd), kind: 'blocked' as const },
    ])
    setSession(reason === 'blocked' ? 'blocked' : 'ended')
    setMood('sleep')
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || pending || session !== 'active') return

    setPending(true)
    setInput('')
    setNudgeLevel(0)
    lastActivityRef.current = Date.now()
    setMood('idle')

    const nextHistory = [...history, { role: 'user' as const, content: text }]
    setTurns(t => [...t, { role: 'user', content: text, kind: 'normal' }])

    try {
      const res = await fetch('/api/monono', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory }),
      })

      if (res.status === 429) {
        const data = await res.json().catch(() => null) as { code?: string } | null
        endSession(data?.code === 'global_cap' ? 'global' : 'cutoff')
        return
      }

      if (!res.ok) {
        setTurns(t => [
          ...t,
          { role: 'assistant', content: pick(voice.errorFallback), kind: 'error' },
        ])
        animateSpeaking()
        return
      }

      const data = await res.json() as { reply: string; remaining: number; used: number }
      setTurns(t => [...t, { role: 'assistant', content: data.reply, kind: 'normal' }])
      animateSpeaking()
      lastActivityRef.current = Date.now()

      if (data.remaining <= 0) {
        window.setTimeout(() => endSession('cutoff'), 600)
      }
    } catch {
      setTurns(t => [
        ...t,
        { role: 'assistant', content: pick(voice.errorFallback), kind: 'error' },
      ])
      animateSpeaking()
    } finally {
      setPending(false)
    }
  }, [input, pending, session, history, endSession, animateSpeaking])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const inputDisabled = pending || session !== 'active'

  return (
    <div className="monono-stage">
      <div className="monono-device">
        <div className="monono-device-top">
          <span className="monono-dot monono-dot--power" />
          <span className="monono-label">ENTERTAINMENT CORE v1</span>
          <span className={`monono-dot monono-dot--live ${speaking ? 'is-on' : ''}`} />
        </div>

        <div className="monono-screen">
          <div className="monono-face-wrap">
            <MononoFace mood={mood} speaking={speaking} />
          </div>

          <div className="monono-transcript" ref={scrollRef}>
            {turns.map((t, i) => (
              <div
                key={i}
                className={`monono-bubble monono-bubble--${t.role} ${t.kind ? `is-${t.kind}` : ''}`}
              >
                {t.content}
              </div>
            ))}
            {pending && (
              <div className="monono-bubble monono-bubble--assistant is-typing">
                <span /><span /><span />
              </div>
            )}
          </div>
        </div>

        <div className="monono-input-row">
          <textarea
            className="monono-input"
            placeholder={
              session === 'blocked'
                ? 'Monono is taking a nap~'
                : session === 'ended'
                  ? 'She signed off~'
                  : 'say something to Monono…'
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={inputDisabled}
            rows={1}
            maxLength={500}
          />
          <button
            className="monono-send"
            onClick={send}
            disabled={inputDisabled || !input.trim()}
            aria-label="Send"
          >
            ♪
          </button>
        </div>

        <div className="monono-device-bottom">
          <span className="monono-label">MONONO AWARE · IDOL MODEL 2049</span>
        </div>
      </div>
    </div>
  )
}
