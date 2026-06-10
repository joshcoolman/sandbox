import { ROW_COUNT, STEPS, LEAD_ROWS, BASS_ROWS, DRUM_ROWS } from './rows'

export function makeEmptyGrid(): boolean[][] {
  return Array.from({ length: ROW_COUNT }, () => Array(STEPS).fill(false))
}

// Pad or truncate an arbitrary grid to ROW_COUNT × STEPS so stale patterns
// (e.g. saved against an older row layout) can't crash the renderer.
export function normalizeGrid(input: boolean[][]): boolean[][] {
  const grid = makeEmptyGrid()
  for (let r = 0; r < Math.min(input.length, ROW_COUNT); r++) {
    for (let c = 0; c < Math.min(input[r].length, STEPS); c++) {
      grid[r][c] = input[r][c]
    }
  }
  return grid
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const rand = (n: number) => Math.floor(Math.random() * n)

// Generation works geometrically rather than per-row probabilistically:
// small stamp shapes repeated at a fixed period with per-row phase offsets.
// On a quantized pentatonic grid visual regularity IS rhythmic regularity —
// diagonals read as rolls/arpeggios, translation reads as ostinato, and
// repeats mutate more toward the loop's end so bars 3-4 drift like fills.
type Archetype = 'cascade' | 'classic' | 'sparse'

// Lead stamps as {row offset, step offset} cells; diagonals are melodies.
const LEAD_SHAPES: Array<Array<{ dr: number; ds: number }>> = [
  [{ dr: 0, ds: 0 }],
  [{ dr: 0, ds: 0 }, { dr: -1, ds: 1 }],
  [{ dr: 0, ds: 0 }, { dr: 1, ds: 1 }],
  [{ dr: 0, ds: 0 }, { dr: -2, ds: 2 }],
  [{ dr: 0, ds: 0 }, { dr: -1, ds: 1 }, { dr: -2, ds: 2 }],
  [{ dr: 0, ds: 0 }, { dr: 1, ds: 1 }, { dr: 2, ds: 2 }],
]
const SMALL_LEAD_SHAPES = LEAD_SHAPES.slice(0, 4)

function stampDrums(grid: boolean[][], archetype: Archetype) {
  // The kick is the one fixed musical anchor — everything else is geometry
  for (let s = 0; s < STEPS; s += 4) grid[DRUM_ROWS.kick][s] = true

  if (archetype === 'cascade') {
    // Diagonal staircase through the kit, one 16th apart — a repeating roll
    const [a, b] = Math.random() < 0.5
      ? [DRUM_ROWS.clap, DRUM_ROWS.hat]
      : [DRUM_ROWS.hat, DRUM_ROWS.clap]
    for (let s = 0; s < STEPS; s += 4) {
      grid[a][s + 1] = true
      grid[b][s + 2] = true
    }
  } else if (archetype === 'classic') {
    grid[DRUM_ROWS.clap][4] = true
    grid[DRUM_ROWS.clap][12] = true
    if (Math.random() < 0.3) {
      for (const s of [2, 6, 10]) grid[DRUM_ROWS.hat][s] = true
      for (let s = 12; s < STEPS; s++) grid[DRUM_ROWS.hat][s] = true
    } else {
      for (const s of [2, 6, 10, 14]) grid[DRUM_ROWS.hat][s] = true
    }
  } else {
    for (const s of [2, 6, 10, 14]) grid[DRUM_ROWS.hat][s] = true
    if (Math.random() < 0.5) grid[DRUM_ROWS.clap][Math.random() < 0.5 ? 7 : 15] = true
  }

  if (Math.random() < 0.25) grid[DRUM_ROWS.kick][Math.random() < 0.5 ? 14 : 15] = true
}

function stampBass(grid: boolean[][], archetype: Archetype) {
  const partner = Math.random() < 0.6 ? BASS_ROWS.fifth : BASS_ROWS.oct
  if (archetype === 'cascade' || Math.random() < 0.45) {
    // Two-row stagger sharing the drums' phase grammar (G2@0 C2@1 etc.)
    const phase = archetype === 'cascade' ? 0 : 2
    const [first, second] = Math.random() < 0.7
      ? [partner, BASS_ROWS.root]
      : [BASS_ROWS.root, partner]
    for (let s = phase; s + 1 < STEPS; s += 4) {
      grid[first][s] = true
      grid[second][s + 1] = true
    }
  } else {
    // Single rolling row on the offbeats, root-dominant
    for (const s of [2, 6, 10, 14]) {
      const row = Math.random() < 0.75 ? BASS_ROWS.root : partner
      grid[row][s] = true
    }
  }
  // End-of-loop drift
  if (Math.random() < 0.25) grid[BASS_ROWS.root][Math.random() < 0.5 ? 14 : 15] = true
}

function addLeadStamp(
  grid: boolean[][],
  shape: Array<{ dr: number; ds: number }>,
  baseRow: number,
  phase: number,
  period: number,
  withDrift: boolean
) {
  for (let start = phase; start < STEPS; start += period) {
    const bar = Math.floor(start / 4)
    // Exact repeats early, drifting mutation toward the loop's end
    const mutateP = !withDrift || bar <= 1 ? 0 : bar === 2 ? 0.2 : 0.35
    for (const cell of shape) {
      let r = clamp(baseRow + cell.dr, 0, LEAD_ROWS.length - 1)
      let s = start + cell.ds
      if (s >= STEPS) continue
      if (Math.random() < mutateP) {
        const roll = Math.random()
        if (roll < 0.25) continue
        if (roll < 0.6) s = Math.min(STEPS - 1, s + 1)
        else r = clamp(r + (Math.random() < 0.5 ? -1 : 1), 0, LEAD_ROWS.length - 1)
      }
      grid[r][s] = true
    }
  }
}

function countLead(grid: boolean[][]) {
  return LEAD_ROWS.reduce((n, r) => n + grid[r].filter(Boolean).length, 0)
}

function stampLead(grid: boolean[][]) {
  const period = Math.random() < 0.6 ? 4 : 8
  const shapes: Array<Array<{ dr: number; ds: number }>> = []
  if (period === 8) {
    shapes.push(LEAD_SHAPES[rand(LEAD_SHAPES.length)])
    shapes.push(LEAD_SHAPES[rand(LEAD_SHAPES.length)])
  } else {
    shapes.push(LEAD_SHAPES[rand(LEAD_SHAPES.length)])
    // A second period-4 stamp only if it stays small, to bound density
    if (Math.random() < 0.35) shapes.push(SMALL_LEAD_SHAPES[rand(SMALL_LEAD_SHAPES.length)])
  }

  const usedPhases = new Set<number>()
  for (const shape of shapes) {
    let phase = rand(period)
    let guard = 0
    while (usedPhases.has(phase) && guard++ < 8) phase = rand(period)
    usedPhases.add(phase)
    addLeadStamp(grid, shape, 1 + rand(3), phase, period, true)
  }

  // Richness floor: a thin lead gets one more clean small stamp
  if (countLead(grid) < 5) {
    addLeadStamp(grid, SMALL_LEAD_SHAPES[rand(SMALL_LEAD_SHAPES.length)], 1 + rand(3), 1 + rand(3), 4, false)
  }

  // Occasional hand-placed-feeling lift right before the loop restarts
  if (Math.random() < 0.3) grid[rand(LEAD_ROWS.length)][13 + rand(3)] = true
}

function enforceCoverage(grid: boolean[][]) {
  // Polyphony caps: ≤2 lead notes per column, ≤4 notes total per column
  // (shed lead first, then non-root bass — never drums or the bass root)
  for (let c = 0; c < STEPS; c++) {
    const leadLit = LEAD_ROWS.filter(r => grid[r][c])
    while (leadLit.length > 2) {
      const i = rand(leadLit.length)
      grid[leadLit[i]][c] = false
      leadLit.splice(i, 1)
    }
    let total = 0
    for (let r = 0; r < ROW_COUNT; r++) if (grid[r][c]) total++
    const droppable = [
      ...leadLit,
      ...[BASS_ROWS.oct, BASS_ROWS.fifth].filter(r => grid[r][c]),
    ]
    while (total > 4 && droppable.length > 0) {
      const r = droppable.shift()
      if (r === undefined) break
      grid[r][c] = false
      total--
    }
  }
}

// Remember the last archetype so consecutive generates always change feel
let lastArchetype: Archetype | null = null

function pickArchetype(): Archetype {
  const roll = Math.random()
  return roll < 0.4 ? 'cascade' : roll < 0.75 ? 'classic' : 'sparse'
}

export function generateTechnoPattern(): boolean[][] {
  const grid = makeEmptyGrid()
  let archetype = pickArchetype()
  let guard = 0
  while (archetype === lastArchetype && guard++ < 8) archetype = pickArchetype()
  lastArchetype = archetype
  stampDrums(grid, archetype)
  stampBass(grid, archetype)
  stampLead(grid)
  enforceCoverage(grid)
  return grid
}
