import { NextResponse } from 'next/server'
import { loadState, saveState, postedToday } from '@/lib/x/state'
import { getQueue, getPosted } from '@/lib/x/queue'
import { createNote } from '@/lib/x/note'

export const runtime = 'nodejs'

// Local-only tool: invisible (404) in production, mirroring app/api/monono/reset.
function blocked() {
  return process.env.NODE_ENV === 'production'
}

function snapshot() {
  const state = loadState()
  return {
    state,
    queue: getQueue(state),
    posted: getPosted(state),
    postedToday: postedToday(state),
  }
}

export async function GET() {
  if (blocked()) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(snapshot())
}

export async function POST(req: Request) {
  if (blocked()) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const noteId = String(body.noteId || '')
  const state = loadState()

  switch (body.action) {
    case 'createNote': {
      // Mirror the /note skill: write a sticky-note .md file; it auto-queues
      // since the queue is derived from the notes directory.
      const content = String(body.content || '').trim()
      if (!content) return NextResponse.json({ error: 'empty_note' }, { status: 400 })
      createNote(content)
      break
    }
    case 'markPosted':
      if (noteId && !state.posted.some((p) => p.noteId === noteId)) {
        state.posted.push({ noteId, at: new Date().toISOString() })
        state.removed = state.removed.filter((id) => id !== noteId)
      }
      break
    case 'unpost': // undo an accidental mark — back into the queue
      state.posted = state.posted.filter((p) => p.noteId !== noteId)
      break
    case 'remove': // drop from the queue without posting
      if (noteId && !state.removed.includes(noteId)) state.removed.push(noteId)
      break
    case 'restore': // bring a removed note back into the queue
      state.removed = state.removed.filter((id) => id !== noteId)
      break
    case 'setPostsPerDay': {
      const n = Number(body.postsPerDay)
      // 0 == no daily limit (post freely, no confirm)
      if (Number.isFinite(n) && n >= 0) state.postsPerDay = Math.floor(n)
      break
    }
    default:
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
  }

  saveState(state)
  return NextResponse.json(snapshot())
}
