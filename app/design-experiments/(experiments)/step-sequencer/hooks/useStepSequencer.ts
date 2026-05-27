'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const ROWS = 8
const STEPS = 16

// C major pentatonic, top-of-UI = highest pitch
export const NOTE_FREQS = [
  659.25, // E5
  587.33, // D5
  523.25, // C5
  440.00, // A4
  392.00, // G4
  329.63, // E4
  293.66, // D4
  261.63, // C4
]

const makeEmptyGrid = (): boolean[][] =>
  Array.from({ length: ROWS }, () => Array(STEPS).fill(false))

export function useStepSequencer() {
  const [grid, setGrid] = useState<boolean[][]>(makeEmptyGrid)
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(110)
  const [currentStep, setCurrentStep] = useState<number | null>(null)

  const gridRef = useRef(grid)
  const bpmRef = useRef(bpm)
  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { bpmRef.current = bpm }, [bpm])

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const nextStepTimeRef = useRef(0)
  const nextStepIdxRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const uiTimeoutsRef = useRef<number[]>([])

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0.32
    master.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master
    return ctx
  }, [])

  const playNote = useCallback(
    (freq: number, startTime: number, durationSec: number, gain: number) => {
      const ctx = ctxRef.current
      const master = masterRef.current
      if (!ctx || !master) return
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      const attack = 0.005
      const release = Math.min(0.05, durationSec * 0.4)
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
    while (nextStepTimeRef.current < horizon) {
      const stepDur = (60 / bpmRef.current) / 4 // 16th notes
      const t = nextStepTimeRef.current
      const idx = nextStepIdxRef.current
      const g = gridRef.current
      for (let r = 0; r < ROWS; r++) {
        if (g[r][idx]) {
          playNote(NOTE_FREQS[r], t, stepDur * 0.85, 0.09)
        }
      }
      const delayMs = Math.max(0, (t - ctx.currentTime) * 1000)
      const id = window.setTimeout(() => setCurrentStep(idx), delayMs)
      uiTimeoutsRef.current.push(id)
      nextStepTimeRef.current = t + stepDur
      nextStepIdxRef.current = (idx + 1) % STEPS
    }
  }, [playNote])

  useEffect(() => {
    if (!playing) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      uiTimeoutsRef.current.forEach(window.clearTimeout)
      uiTimeoutsRef.current = []
      const ctx = ctxRef.current
      if (ctx && ctx.state === 'running') void ctx.suspend()
      setCurrentStep(null)
      return
    }
    const ctx = ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    nextStepTimeRef.current = ctx.currentTime + 0.08
    nextStepIdxRef.current = 0
    timerRef.current = window.setInterval(scheduler, 50)
  }, [playing, ensureContext, scheduler])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      uiTimeoutsRef.current.forEach(window.clearTimeout)
      const ctx = ctxRef.current
      if (ctx) void ctx.close()
      ctxRef.current = null
      masterRef.current = null
    }
  }, [])

  const toggleCell = useCallback((row: number, col: number) => {
    setGrid(g => {
      const next = g.map(r => r.slice())
      next[row][col] = !next[row][col]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setGrid(makeEmptyGrid())
  }, [])

  return {
    grid,
    toggleCell,
    clearAll,
    playing,
    setPlaying,
    bpm,
    setBpm,
    currentStep,
  }
}
