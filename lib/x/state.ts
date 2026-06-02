import fs from 'fs'
import path from 'path'
import type { XState } from './types'

// Committed JSON ledger at the repo root, mirroring the news/.ledger.json pattern.
const STATE_PATH = path.join(process.cwd(), 'x-state.json')

const DEFAULT_STATE: XState = { postsPerDay: 1, posted: [], removed: [], order: [] }

export function loadState(): XState {
  try {
    if (!fs.existsSync(STATE_PATH)) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'))
    return {
      postsPerDay:
        typeof parsed.postsPerDay === 'number' && parsed.postsPerDay > 0
          ? parsed.postsPerDay
          : 1,
      posted: Array.isArray(parsed.posted) ? parsed.posted : [],
      removed: Array.isArray(parsed.removed) ? parsed.removed : [],
      order: Array.isArray(parsed.order) ? parsed.order : [],
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: XState): void {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8')
}

// Count posts already made on the same UTC day as `now`. Used as the soft
// per-day guard on the manual post button.
export function postedToday(state: XState, now: Date = new Date()): number {
  const today = now.toISOString().slice(0, 10)
  return state.posted.filter((p) => (p.at || '').slice(0, 10) === today).length
}
