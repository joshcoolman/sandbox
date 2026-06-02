// X (Twitter) broadcast — shared types.
// Posting is done via X Web Intent (the app opens X's pre-filled composer; the
// user clicks Post). No API, no auth, no cost. The queue is *derived* from
// notes, not captured: any note that isn't yet posted or explicitly removed is
// implicitly queued. State below records only the deltas (what's posted, what
// was dropped, config, manual ordering).

export const X_CHAR_LIMIT = 280

export interface XPosted {
  noteId: string
  at: string // ISO timestamp of when it was marked posted
}

export interface XState {
  postsPerDay: number
  posted: XPosted[]
  removed: string[] // noteIds dropped from the queue, never posted
  order: string[] // optional manual ordering of noteIds; empty => date order
}

export type NoteColor = 'warm' | 'cool' | 'neutral'

export interface XQueueItem {
  id: string // noteId (note filename without .md)
  date: string
  content: string
  color: NoteColor // carried from the note — tints the card
  charCount: number
  overLimit: boolean // > X_CHAR_LIMIT — flagged (trim in the composer before posting)
}

export interface XPostedItem {
  id: string
  date: string
  content: string
  color: NoteColor
  at: string // when it was marked posted
}
