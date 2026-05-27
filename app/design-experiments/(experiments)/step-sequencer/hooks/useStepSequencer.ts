'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const ROWS = 8
const STEPS = 16

export interface SequencerController {
  grid: boolean[][]
  toggleCell: (row: number, col: number) => void
  clearAll: () => void
  randomize: () => void
  playing: boolean
  setPlaying: (b: boolean) => void
  bpm: number
  setBpm: (n: number) => void
  currentStep: number | null
}

export interface UseStepSequencerOptions {
  initialGrid?: boolean[][]
  initialBpm?: number
}

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

// Per-row probability that the row participates in a generated pattern
const ROW_ACTIVE_PROB = [0.3, 0.5, 0.55, 0.6, 0.5, 0.45, 0.4, 0.7]
// Per-step probability within a 4-step motif: downbeat heaviest, then beat 3, then offbeats
const MOTIF_STEP_PROBS = [0.5, 0.2, 0.35, 0.2]

function makeRandomGrid(): boolean[][] {
  for (let attempt = 0; attempt < 8; attempt++) {
    const grid: boolean[][] = Array.from({ length: ROWS }, () => Array(STEPS).fill(false))

    const activeRows: number[] = []
    for (let r = 0; r < ROWS; r++) {
      if (Math.random() < ROW_ACTIVE_PROB[r]) activeRows.push(r)
    }

    for (const r of activeRows) {
      if (Math.random() < 0.55) {
        // Motif strategy: generate a 4-step micropattern, repeat across 4 bars with light mutation
        const motif: boolean[] = [false, false, false, false]
        for (let i = 0; i < 4; i++) {
          const adjBoost = i > 0 && motif[i - 1] ? 0.25 : 0
          if (Math.random() < MOTIF_STEP_PROBS[i] + adjBoost) motif[i] = true
        }
        for (let bar = 0; bar < 4; bar++) {
          for (let i = 0; i < 4; i++) {
            const flip = Math.random() < 0.18
            grid[r][bar * 4 + i] = flip ? !motif[i] : motif[i]
          }
        }
      } else {
        // Cluster strategy: walk left to right with an adjacency boost so notes group into runs
        for (let c = 0; c < STEPS; c++) {
          const adjBoost = c > 0 && grid[r][c - 1] ? 0.35 : 0
          const downbeatBoost = c % 4 === 0 ? 0.15 : 0
          if (Math.random() < 0.22 + adjBoost + downbeatBoost) grid[r][c] = true
        }
      }
    }

    // End-of-loop fill: stack 2–3 notes on the last step ~half the time
    if (Math.random() < 0.5 && activeRows.length > 0) {
      const fillCount = 2 + Math.floor(Math.random() * 2)
      const shuffled = [...activeRows].sort(() => Math.random() - 0.5).slice(0, fillCount)
      for (const r of shuffled) grid[r][15] = true
    }

    // Bass anchor on step 0
    if (Math.random() < 0.7) grid[7][0] = true

    // Cap polyphony at 4 per column
    for (let c = 0; c < STEPS; c++) {
      const lit: number[] = []
      for (let r = 0; r < ROWS; r++) if (grid[r][c]) lit.push(r)
      while (lit.length > 4) {
        const idx = Math.floor(Math.random() * lit.length)
        grid[lit[idx]][c] = false
        lit.splice(idx, 1)
      }
    }

    let count = 0
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < STEPS; c++) if (grid[r][c]) count++
    if (count >= 14 && count <= 32) return grid
  }
  return makeEmptyGrid()
}

export function useStepSequencer(options?: UseStepSequencerOptions): SequencerController {
  const [grid, setGrid] = useState<boolean[][]>(() =>
    options?.initialGrid ? options.initialGrid.map(r => r.slice()) : makeEmptyGrid()
  )
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(options?.initialBpm ?? 110)
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

  const randomize = useCallback(() => {
    setGrid(makeRandomGrid())
  }, [])

  return {
    grid,
    toggleCell,
    clearAll,
    randomize,
    playing,
    setPlaying,
    bpm,
    setBpm,
    currentStep,
  }
}
