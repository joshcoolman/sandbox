'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MononoSprite, type Mood, type SpriteStatus } from './MononoSprite'
import { MusicSwitch } from './MusicSwitch'
import { useChiptune } from '../hooks/useChiptune'
import { voice, pick } from '../data/voice'

type Turn = {
  role: 'user' | 'assistant'
  content: string
  kind?: 'greeting' | 'nudge' | 'poke' | 'cutoff' | 'blocked' | 'error' | 'normal'
}

type SessionState = 'active' | 'ended' | 'blocked'

type Phase = 'idle' | 'user-typing' | 'waiting' | 'speaking' | 'bored-soft' | 'bored-pouty' | 'asleep' | 'woken' | 'poked'
type PostMood = Extract<Mood, 'idle' | 'heart-eyes' | 'tongue' | 'smile-big' | 'pouty' | 'wink' | 'excited' | 'nervous' | 'surprised' | 'crying-happy' | 'mad' | 'goofy' | 'smug' | 'shy' | 'paws-over-eyes'>

const IDLE_SOFT_MS = 30_000
const IDLE_POUTY_MS = 90_000
const IDLE_SLEEP_MS = 180_000

function inferPostMood(reply: string): PostMood {
  const r = reply.toLowerCase()
  if (/♡/.test(reply) || /\b(love|miss|adore|heart)\b/.test(r)) return 'heart-eyes'
  if (/!{2,}|\bwow\b|\bomg\b|\bwhoa\b|\byay\b/i.test(reply)) return 'excited'
  if (/crying|sob|tears|sniff|😭/i.test(r)) return 'crying-happy'
  if (/\b(boring|shoo|next question|whatever|hmph)\b/.test(r) || /tsk~/i.test(reply)) return 'pouty'
  if (/\b(rude|annoying|stop|ugh|grr)\b/i.test(r)) return 'mad'
  if (/♪/.test(reply) || /\b(la.?la|hum|sing|music)\b/.test(r)) return 'wink'
  if (/pfft~|nyeh~|bleh|heh~/i.test(reply)) return 'goofy'
  if (/hmm~|let me think|wonder|maybe|perhaps/i.test(reply)) return 'smug'
  if (/oh\?|really\?|wait—|wait,|huh\?/i.test(reply)) return 'surprised'
  if (/ehhh|embarrass|blush|oh no/i.test(reply)) return 'shy'
  if (/\b(nervous|scared|worried|anxious|sweat)\b/i.test(r)) return 'nervous'
  if (reply.trim().split(/\s+/).length <= 4) return 'smile-big'
  return 'idle'
}

const POKE_MOODS: PostMood[] = ['surprised', 'goofy', 'mad', 'excited', 'nervous', 'shy', 'crying-happy']

function phaseToSpriteMood(phase: Phase, postMood: PostMood): Mood {
  switch (phase) {
    case 'waiting': return 'thinking'
    case 'bored-pouty': return 'pouty'
    case 'asleep': return 'sleep-curled'
    case 'woken': return 'surprised'
    case 'poked': return postMood
    case 'bored-soft':
    case 'speaking':
    case 'user-typing':
    case 'idle': return postMood
  }
}

function phaseToStatus(phase: Phase): SpriteStatus {
  switch (phase) {
    case 'user-typing': return 'user-typing'
    case 'waiting': return 'waiting'
    case 'asleep': return 'asleep'
    case 'woken': return 'woken'
    default: return 'default'
  }
}

export function MononoChat() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [session, setSession] = useState<SessionState>('active')
  const [phase, setPhase] = useState<Phase>('idle')
  const [postMood, setPostMood] = useState<PostMood>('idle')

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const wokenTimerRef = useRef<number | null>(null)

  const { enabled: musicEnabled, setEnabled: setMusicEnabled, resume: resumeMusic } = useChiptune()

  const speaking = phase === 'speaking'
  const pending = phase === 'waiting'
  const spriteMood = phaseToSpriteMood(phase, postMood)
  const spriteStatus = phaseToStatus(phase)
  const inputDisabled = pending || session !== 'active'

  const triggerSpeaking = useCallback((replyText: string) => {
    const mood = inferPostMood(replyText)
    setPostMood(mood)
    setPhase('speaking')
    window.setTimeout(() => setPhase('idle'), 900)
  }, [])

  useEffect(() => {
    const greeting = pick(voice.greetings)
    setTurns([{ role: 'assistant', content: greeting, kind: 'greeting' }])
    triggerSpeaking(greeting)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (wokenTimerRef.current) clearTimeout(wokenTimerRef.current)
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns])

  const fetchIdleLine = useCallback(async (stage: 'soft' | 'pouty' | 'sleep'): Promise<string | null> => {
    try {
      const res = await fetch('/api/monono-idle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      const data = await res.json().catch(() => null) as { reply?: string } | null
      if (!res.ok || !data?.reply) {
        console.warn(`[monono-idle:${stage}] fallback — status:`, res.status, 'body:', data)
        return null
      }
      console.log(`[monono-idle:${stage}] generated:`, data.reply)
      return data.reply
    } catch (err) {
      console.warn(`[monono-idle:${stage}] network error:`, err)
      return null
    }
  }, [])

  useEffect(() => {
    if (session !== 'active') return

    const tick = () => {
      if (phase === 'waiting' || phase === 'speaking' || phase === 'user-typing' || phase === 'woken') return

      const elapsed = Date.now() - lastActivityRef.current

      if (elapsed > IDLE_SLEEP_MS && phase !== 'asleep') {
        const startedAt = Date.now()
        lastActivityRef.current = startedAt
        void (async () => {
          const generated = await fetchIdleLine('sleep')
          if (lastActivityRef.current !== startedAt) return
          const line = generated ?? pick(voice.idleSleep)
          setTurns(t => [...t, { role: 'assistant', content: line, kind: 'nudge' }])
          setPhase('asleep')
        })()
      } else if (elapsed > IDLE_POUTY_MS && phase === 'bored-soft') {
        const startedAt = Date.now()
        lastActivityRef.current = startedAt
        setPhase('bored-pouty')
        void (async () => {
          const generated = await fetchIdleLine('pouty')
          if (lastActivityRef.current !== startedAt) return
          const line = generated ?? pick(voice.idlePouty)
          setTurns(t => [...t, { role: 'assistant', content: line, kind: 'nudge' }])
        })()
      } else if (elapsed > IDLE_SOFT_MS && phase === 'idle') {
        const startedAt = Date.now()
        lastActivityRef.current = startedAt
        setPhase('bored-soft')
        void (async () => {
          const generated = await fetchIdleLine('soft')
          if (lastActivityRef.current !== startedAt) return
          const line = generated ?? pick(voice.idleSoft)
          setTurns(t => [...t, { role: 'assistant', content: line, kind: 'nudge' }])
        })()
      }
    }

    const id = window.setInterval(tick, 3000)
    return () => window.clearInterval(id)
  }, [session, phase, fetchIdleLine])

  const history = useMemo(
    () =>
      turns
        .filter(t => t.kind !== 'nudge' && t.kind !== 'poke' && t.kind !== 'greeting' && t.kind !== 'cutoff' && t.kind !== 'blocked' && t.kind !== 'error')
        .map(t => ({ role: t.role, content: t.content })),
    [turns]
  )

  const isDev = process.env.NODE_ENV !== 'production'

  const devReset = useCallback(async () => {
    try {
      await fetch('/api/monono/reset', { method: 'POST' })
    } catch {}
    const greeting = pick(voice.greetings)
    setTurns([{ role: 'assistant', content: greeting, kind: 'greeting' }])
    setSession('active')
    setPostMood('idle')
    setPhase('idle')
    setInput('')
    lastActivityRef.current = Date.now()
    triggerSpeaking(greeting)
  }, [triggerSpeaking])

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
    setPhase('asleep')
    setPostMood('idle')
  }, [])

  const pokeTimerRef = useRef<number | null>(null)

  const handlePoke = useCallback(async () => {
    if (phase === 'waiting' || phase === 'poked' || session !== 'active') return
    setPostMood('paws-over-eyes' as PostMood)
    setPhase('poked')
    lastActivityRef.current = Date.now()

    try {
      const res = await fetch('/api/monono-poke', { method: 'POST' })
      const data = await res.json().catch(() => null) as { reply?: string; error?: string } | null

      const reply = data?.reply
      if (!res.ok || !reply) {
        console.warn('[monono-poke] fallback — status:', res.status, 'body:', data)
        const errMsg = pick(voice.errorFallback)
        setPostMood('nervous')
        setTurns(t => [...t, { role: 'assistant', content: errMsg, kind: 'error' }])
      } else {
        console.log('[monono-poke] generated:', reply)
        const pokeMood = POKE_MOODS[Math.floor(Math.random() * POKE_MOODS.length)]
        setPostMood(pokeMood)
        setTurns(t => [...t, { role: 'assistant', content: reply, kind: 'poke' }])
      }
    } catch (err) {
      console.warn('[monono-poke] network error:', err)
      setPostMood('nervous')
      setTurns(t => [...t, { role: 'assistant', content: pick(voice.errorFallback), kind: 'error' }])
    }

    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current)
    pokeTimerRef.current = window.setTimeout(() => setPhase('idle'), 1800)
  }, [phase, session])

  const handleInputFocus = useCallback(() => {
    if (phase !== 'asleep' || session !== 'active') return
    const wakeMsg = pick(voice.wakeUp)
    setTurns(t => [...t, { role: 'assistant', content: wakeMsg, kind: 'nudge' }])
    setPostMood('idle')
    setPhase('woken')
    lastActivityRef.current = Date.now()
    if (wokenTimerRef.current) clearTimeout(wokenTimerRef.current)
    wokenTimerRef.current = window.setTimeout(() => setPhase('idle'), 800)
  }, [phase, session])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    if (session !== 'active') return
    if (phase === 'waiting' || phase === 'speaking') return
    if (val) lastActivityRef.current = Date.now()
    if (phase === 'asleep') {
      setPhase(val ? 'user-typing' : 'idle')
      return
    }
    if (phase !== 'woken') {
      setPhase(val ? 'user-typing' : 'idle')
    }
  }, [phase, session])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || phase === 'waiting' || session !== 'active') return

    setInput('')
    setPhase('waiting')
    lastActivityRef.current = Date.now()

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
        const errorMsg = pick(voice.errorFallback)
        setTurns(t => [...t, { role: 'assistant', content: errorMsg, kind: 'error' }])
        triggerSpeaking(errorMsg)
        return
      }

      const data = await res.json() as { reply: string; remaining: number; used: number }
      setTurns(t => [...t, { role: 'assistant', content: data.reply, kind: 'normal' }])
      triggerSpeaking(data.reply)
      lastActivityRef.current = Date.now()

      if (data.remaining <= 0) {
        window.setTimeout(() => endSession('cutoff'), 600)
      }
    } catch {
      const errorMsg = pick(voice.errorFallback)
      setTurns(t => [...t, { role: 'assistant', content: errorMsg, kind: 'error' }])
      triggerSpeaking(errorMsg)
    }
  }, [input, phase, session, history, endSession, triggerSpeaking])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="monono-stage">
      <div className="monono-device" onPointerDown={resumeMusic}>
        <div className="monono-device-top">
          <span className="monono-dot monono-dot--power" />
          <span className="monono-label">ENTERTAINMENT CORE v1</span>
          <div className="monono-device-top__right">
            <MusicSwitch enabled={musicEnabled} onToggle={() => setMusicEnabled(!musicEnabled)} />
            <span className={`monono-dot monono-dot--live ${speaking ? 'is-on' : ''}`} />
          </div>
        </div>

        <div className="monono-screen">
          <div className="monono-face-wrap">
            <MononoSprite mood={spriteMood} speaking={speaking} status={spriteStatus} onPoke={handlePoke} />
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
                  : phase === 'asleep'
                    ? 'Monono is sleeping… tap to wake~'
                    : 'say something to Monono…'
            }
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
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

        {isDev && (session === 'blocked' || session === 'ended') && (
          <button
            type="button"
            className="monono-dev-reset"
            onClick={devReset}
          >
            Development Reset
          </button>
        )}

        <div className="monono-device-bottom">
          <span className="monono-label">MONONO AWARE · IDOL MODEL 2049</span>
        </div>
      </div>
    </div>
  )
}
