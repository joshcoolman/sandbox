'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const BPM = 132
const BEAT = 60 / BPM

const NOTE: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51,
}

type Step = [string | null, number]

// Lead melody — 4-bar I–V–vi–IV loop in C major, ~7.3s
const LEAD: Step[] = [
  ['E5', 0.5], ['G5', 0.5], ['C6', 0.5], ['G5', 0.5], ['E5', 1], ['G5', 1],
  ['D5', 0.5], ['G5', 0.5], ['B5', 0.5], ['G5', 0.5], ['D5', 1], ['G5', 1],
  ['C5', 0.5], ['E5', 0.5], ['A5', 0.5], ['E5', 0.5], ['C5', 1], ['E5', 1],
  ['C5', 0.5], ['F5', 0.5], ['A5', 0.5], ['F5', 0.5], ['C5', 1], ['F5', 1],
]

const BASS: Step[] = [
  ['C3', 1], ['C3', 1], ['G3', 1], ['G3', 1],
  ['G2', 1], ['G2', 1], ['D3', 1], ['D3', 1],
  ['A2', 1], ['A2', 1], ['E3', 1], ['E3', 1],
  ['F2', 1], ['F2', 1], ['C3', 1], ['C3', 1],
]

export function useChiptune() {
  const [enabled, setEnabled] = useState(false)
  const enabledRef = useRef(enabled)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const leadTimeRef = useRef(0)
  const leadIdxRef = useRef(0)
  const bassTimeRef = useRef(0)
  const bassIdxRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => { enabledRef.current = enabled }, [enabled])

  const playNote = useCallback(
    (freq: number, startTime: number, durationSec: number, gain: number, type: OscillatorType) => {
      const ctx = ctxRef.current
      const master = masterRef.current
      if (!ctx || !master) return
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      const attack = 0.006
      const release = Math.min(0.05, durationSec * 0.25)
      env.gain.setValueAtTime(0.0001, startTime)
      env.gain.exponentialRampToValueAtTime(gain, startTime + attack)
      env.gain.setValueAtTime(gain, startTime + Math.max(attack, durationSec - release))
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec)
      osc.connect(env)
      env.connect(master)
      osc.start(startTime)
      osc.stop(startTime + durationSec + 0.02)
    },
    []
  )

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const lookahead = 0.25
    const horizon = ctx.currentTime + lookahead

    while (leadTimeRef.current < horizon) {
      const [name, beats] = LEAD[leadIdxRef.current]
      const dur = beats * BEAT
      if (name) playNote(NOTE[name], leadTimeRef.current, dur * 0.92, 0.07, 'square')
      leadTimeRef.current += dur
      leadIdxRef.current = (leadIdxRef.current + 1) % LEAD.length
    }
    while (bassTimeRef.current < horizon) {
      const [name, beats] = BASS[bassIdxRef.current]
      const dur = beats * BEAT
      if (name) playNote(NOTE[name], bassTimeRef.current, dur * 0.9, 0.055, 'triangle')
      bassTimeRef.current += dur
      bassIdxRef.current = (bassIdxRef.current + 1) % BASS.length
    }
  }, [playNote])

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0.315
    master.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master
    return ctx
  }, [])

  const start = useCallback(() => {
    const ctx = ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    if (timerRef.current !== null) return
    leadTimeRef.current = ctx.currentTime + 0.08
    bassTimeRef.current = ctx.currentTime + 0.08
    leadIdxRef.current = 0
    bassIdxRef.current = 0
    timerRef.current = window.setInterval(scheduler, 50)
  }, [ensureContext, scheduler])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    const ctx = ctxRef.current
    if (ctx && ctx.state === 'running') void ctx.suspend()
  }, [])

  const resume = useCallback(() => {
    if (!enabledRef.current) return
    start()
  }, [start])

  useEffect(() => {
    if (enabled) start()
    else stop()
  }, [enabled, start, stop])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      const ctx = ctxRef.current
      if (ctx) void ctx.close()
      ctxRef.current = null
      masterRef.current = null
    }
  }, [])

  return { enabled, setEnabled, resume }
}
