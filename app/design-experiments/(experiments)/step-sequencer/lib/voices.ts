// Web Audio voices for the step sequencer. Each trigger builds a short-lived
// node graph, schedules it, and lets it be garbage collected after stop().

export type LeadTone = 'soft' | 'sqr' | 'saw'
export type BassTone = 'sub' | 'saw' | 'acid'
export type DrumKind = 'hat' | 'clap' | 'kick'

export const LEAD_TONES: LeadTone[] = ['soft', 'sqr', 'saw']
export const BASS_TONES: BassTone[] = ['sub', 'saw', 'acid']

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>()

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ctx)
  if (!buf) {
    const len = Math.floor(ctx.sampleRate * 0.5)
    buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buf)
  }
  return buf
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  dur: number,
  gain: number,
  filterType: BiquadFilterType,
  freq: number,
  q: number
) {
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer(ctx)
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = freq
  filter.Q.value = q
  const env = ctx.createGain()
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter)
  filter.connect(env)
  env.connect(dest)
  src.start(t)
  src.stop(t + dur + 0.02)
}

export function playKick(ctx: AudioContext, dest: AudioNode, t: number, gain: number) {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.09)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(gain, t + 0.002)
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
  osc.connect(env)
  env.connect(dest)
  osc.start(t)
  osc.stop(t + 0.32)
  noiseBurst(ctx, dest, t, 0.018, gain * 0.3, 'highpass', 1400, 0.7)
}

export function playClap(ctx: AudioContext, dest: AudioNode, t: number, gain: number) {
  // Two staggered bursts give the smeared multi-hand transient
  noiseBurst(ctx, dest, t, 0.05, gain * 0.7, 'bandpass', 1900, 1.4)
  noiseBurst(ctx, dest, t + 0.022, 0.18, gain, 'bandpass', 1700, 1.2)
}

export function playHat(ctx: AudioContext, dest: AudioNode, t: number, gain: number) {
  noiseBurst(ctx, dest, t, 0.05, gain, 'highpass', 7500, 0.7)
}

export function playBass(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  gain: number,
  tone: BassTone
) {
  const osc = ctx.createOscillator()
  osc.frequency.value = freq
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  const env = ctx.createGain()
  let peak = gain
  if (tone === 'sub') {
    osc.type = 'triangle'
    filter.frequency.value = 480
    filter.Q.value = 0.5
    peak = gain * 1.5
  } else if (tone === 'saw') {
    osc.type = 'sawtooth'
    filter.frequency.value = 620
    filter.Q.value = 1.1
  } else {
    // acid: resonant lowpass swept down across the note
    osc.type = 'sawtooth'
    filter.Q.value = 9
    filter.frequency.setValueAtTime(1400, t)
    filter.frequency.exponentialRampToValueAtTime(160, t + dur * 0.8)
    peak = gain * 1.25
  }
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(peak, t + 0.006)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(filter)
  filter.connect(env)
  env.connect(dest)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function playLead(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  gain: number,
  tone: LeadTone
) {
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 0.7
  const env = ctx.createGain()
  const oscs: OscillatorNode[] = []
  let peak = gain
  if (tone === 'soft') {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    oscs.push(osc)
    filter.frequency.value = 3200
    peak = gain * 1.3
  } else if (tone === 'sqr') {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = freq
    oscs.push(osc)
    filter.frequency.value = 2600
  } else {
    // saw: two detuned oscillators for a wider stab
    for (const cents of [-7, 7]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      osc.detune.value = cents
      oscs.push(osc)
    }
    filter.frequency.value = 3800
    peak = gain * 0.65
  }
  const attack = 0.005
  const release = Math.min(0.05, dur * 0.4)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(peak, t + attack)
  env.gain.setValueAtTime(peak, t + Math.max(attack, dur - release))
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  for (const osc of oscs) {
    osc.connect(filter)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }
  filter.connect(env)
  env.connect(dest)
}
