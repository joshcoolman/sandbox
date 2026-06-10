import type { DrumKind } from './voices'

export const STEPS = 16

export type Section = 'lead' | 'bass' | 'drums'

export type RowDef =
  | { section: 'lead'; label: string; hue: number; freq: number }
  | { section: 'bass'; label: string; hue: number; freq: number }
  | { section: 'drums'; label: string; hue: number; drum: DrumKind }

// Top → bottom: 5 lead rows (C major pentatonic), 3 bass rows, 3 drum rows
// (kick at the bottom, drum-machine convention).
export const ROW_DEFS: RowDef[] = [
  { section: 'lead', label: 'E5', hue: 340, freq: 659.25 },
  { section: 'lead', label: 'D5', hue: 320, freq: 587.33 },
  { section: 'lead', label: 'C5', hue: 295, freq: 523.25 },
  { section: 'lead', label: 'A4', hue: 270, freq: 440.0 },
  { section: 'lead', label: 'G4', hue: 250, freq: 392.0 },
  { section: 'bass', label: 'C3', hue: 230, freq: 130.81 },
  { section: 'bass', label: 'G2', hue: 215, freq: 98.0 },
  { section: 'bass', label: 'C2', hue: 200, freq: 65.41 },
  { section: 'drums', label: 'HAT', hue: 52, drum: 'hat' },
  { section: 'drums', label: 'CLP', hue: 40, drum: 'clap' },
  { section: 'drums', label: 'KCK', hue: 26, drum: 'kick' },
]

export const ROW_COUNT = ROW_DEFS.length

export const LEAD_ROWS = [0, 1, 2, 3, 4]
export const BASS_ROWS = { oct: 5, fifth: 6, root: 7 }
export const DRUM_ROWS = { hat: 8, clap: 9, kick: 10 }
