import path from 'path'
import { getAllNotes } from '@/app/design-experiments/(experiments)/sticky-notes'
import type { StickyNote } from '@/app/design-experiments/(experiments)/sticky-notes'
import { loadState } from './state'
import { X_CHAR_LIMIT, type XState, type XQueueItem, type XPostedItem } from './types'

const NOTES_DIR = path.join(process.cwd(), 'app/(blog)/notes')

// Newest-first ordering (most recent note at the top). If state.order names
// ids, those lead in that order; everything else follows by date (stable).
function applyOrder(notes: StickyNote[], order: string[]): StickyNote[] {
  const byNewest = [...notes].sort((a, b) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime()
    return d !== 0 ? d : b.id.localeCompare(a.id)
  })
  if (!order.length) return byNewest
  const pos = new Map(order.map((id, i) => [id, i]))
  return byNewest.sort(
    (a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity),
  )
}

// The derived queue: all notes minus posted minus removed, newest-first.
export function getQueue(state: XState = loadState()): XQueueItem[] {
  const postedIds = new Set(state.posted.map((p) => p.noteId))
  const removedIds = new Set(state.removed)

  const notes = getAllNotes(NOTES_DIR).filter(
    (n) => !postedIds.has(n.id) && !removedIds.has(n.id),
  )

  return applyOrder(notes, state.order).map((n) => {
    const charCount = [...n.content].length
    return {
      id: n.id,
      date: n.date,
      content: n.content,
      color: n.color,
      charCount,
      overLimit: charCount > X_CHAR_LIMIT,
    }
  })
}

// The next note eligible to post: head of the queue that fits the char limit.
export function nextPostable(state: XState = loadState()): XQueueItem | null {
  return getQueue(state).find((item) => !item.overLimit) ?? null
}

// Posted history with note content reattached, newest-posted first.
export function getPosted(state: XState = loadState()): XPostedItem[] {
  const byId = new Map(getAllNotes(NOTES_DIR).map((n) => [n.id, n]))
  return state.posted
    .map((p) => {
      const n = byId.get(p.noteId)
      return {
        id: p.noteId,
        date: n?.date ?? '',
        content: n?.content ?? '(note no longer exists)',
        color: n?.color ?? 'neutral',
        at: p.at,
      }
    })
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
}
