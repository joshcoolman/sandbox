'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ROW_DEFS, STEPS } from '../lib/rows'
import { makeEmptyGrid, normalizeGrid, generateTechnoPattern, generateLudicrousPattern } from '../lib/generate'
import {
  playKick,
  playClap,
  playHat,
  playBass,
  playLead,
  type LeadTone,
  type BassTone,
} from '../lib/voices'

export interface SequencerController {
  grid: boolean[][]
  toggleCell: (row: number, col: number) => void
  clearAll: () => void
  randomize: () => void
  ludicrous: () => void
  playing: boolean
  setPlaying: (b: boolean) => void
  bpm: number
  setBpm: (n: number) => void
  currentStep: number | null
  leadTone: LeadTone
  bassTone: BassTone
  setLeadTone: (t: LeadTone) => void
  setBassTone: (t: BassTone) => void
}

export interface UseStepSequencerOptions {
  initialGrid?: boolean[][]
  initialBpm?: number
}

type Buses = {
  master: GainNode
  lead: GainNode
  bass: GainNode
  drums: GainNode
}

export function useStepSequencer(options?: UseStepSequencerOptions): SequencerController {
  const [grid, setGrid] = useState<boolean[][]>(() =>
    options?.initialGrid ? normalizeGrid(options.initialGrid) : makeEmptyGrid()
  )
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(options?.initialBpm ?? 114)
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [leadTone, setLeadTone] = useState<LeadTone>('sqr')
  const [bassTone, setBassTone] = useState<BassTone>('saw')

  const gridRef = useRef(grid)
  const bpmRef = useRef(bpm)
  const leadToneRef = useRef(leadTone)
  const bassToneRef = useRef(bassTone)
  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { leadToneRef.current = leadTone }, [leadTone])
  useEffect(() => { bassToneRef.current = bassTone }, [bassTone])

  // No initialGrid -> seed a generated pattern after mount so the SSR'd
  // markup stays deterministic (Math.random in initial state = hydration bug)
  const seededRef = useRef(Boolean(options?.initialGrid))
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    setGrid(generateTechnoPattern())
  }, [])

  const ctxRef = useRef<AudioContext | null>(null)
  const busesRef = useRef<Buses | null>(null)
  const delayRef = useRef<DelayNode | null>(null)
  const nextStepTimeRef = useRef(0)
  const nextStepIdxRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const uiTimeoutsRef = useRef<number[]>([])

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()

    // master gain -> compressor (glue) -> speakers
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 8
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    compressor.connect(ctx.destination)
    const master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(compressor)

    // per-layer buses: the lead bus feeds the delay send, and they keep a
    // single place to rebalance layers against each other
    const lead = ctx.createGain()
    const bass = ctx.createGain()
    const drums = ctx.createGain()
    lead.connect(master)
    bass.connect(master)
    drums.connect(master)

    // dotted-eighth feedback delay on the lead bus only
    const delay = ctx.createDelay(2)
    delay.delayTime.value = (60 / bpmRef.current) * 0.75
    const feedback = ctx.createGain()
    feedback.gain.value = 0.3
    const wet = ctx.createGain()
    wet.gain.value = 0.18
    lead.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(master)

    ctxRef.current = ctx
    busesRef.current = { master, lead, bass, drums }
    delayRef.current = delay
    return ctx
  }, [])

  // Keep the delay locked to a dotted eighth as the tempo moves
  useEffect(() => {
    const ctx = ctxRef.current
    const delay = delayRef.current
    if (ctx && delay) delay.delayTime.setTargetAtTime((60 / bpm) * 0.75, ctx.currentTime, 0.05)
  }, [bpm])

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current
    const buses = busesRef.current
    if (!ctx || !buses) return
    const lookahead = 0.25
    const horizon = ctx.currentTime + lookahead
    while (nextStepTimeRef.current < horizon) {
      const stepDur = (60 / bpmRef.current) / 4 // 16th notes
      const idx = nextStepIdxRef.current
      const t = nextStepTimeRef.current
      const g = gridRef.current
      // Subtle accents: downbeats push, offbeats sit back
      const accent = idx % 4 === 0 ? 1.15 : idx % 2 === 1 ? 0.85 : 1
      for (let r = 0; r < g.length; r++) {
        if (!g[r][idx]) continue
        const def = ROW_DEFS[r]
        if (!def) continue
        if (def.section === 'lead') {
          playLead(ctx, buses.lead, t, def.freq, stepDur * 0.85, 0.085 * accent, leadToneRef.current)
        } else if (def.section === 'bass') {
          playBass(ctx, buses.bass, t, def.freq, stepDur * 0.95, 0.17 * accent, bassToneRef.current)
        } else if (def.drum === 'kick') {
          playKick(ctx, buses.drums, t, 0.5)
        } else if (def.drum === 'clap') {
          playClap(ctx, buses.drums, t, 0.17)
        } else {
          playHat(ctx, buses.drums, t, 0.08 * accent)
        }
      }
      const delayMs = Math.max(0, (t - ctx.currentTime) * 1000)
      const id = window.setTimeout(() => setCurrentStep(idx), delayMs)
      uiTimeoutsRef.current.push(id)
      nextStepTimeRef.current += stepDur
      nextStepIdxRef.current = (idx + 1) % STEPS
    }
  }, [])

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
      busesRef.current = null
      delayRef.current = null
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

  // Generating implies "play": pressing either button while stopped also
  // starts the transport (the click is the user gesture audio needs).
  const randomize = useCallback(() => {
    setGrid(generateTechnoPattern())
    setPlaying(true)
  }, [])

  const ludicrous = useCallback(() => {
    setGrid(generateLudicrousPattern())
    setPlaying(true)
  }, [])

  return {
    grid,
    toggleCell,
    clearAll,
    randomize,
    ludicrous,
    playing,
    setPlaying,
    bpm,
    setBpm,
    currentStep,
    leadTone,
    bassTone,
    setLeadTone,
    setBassTone,
  }
}
