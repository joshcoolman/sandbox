import fs from 'fs'
import path from 'path'
import { getAllNotes } from '@/app/design-experiments/(experiments)/sticky-notes'
import type { NoteColor } from './types'

const NOTES_DIR = path.join(process.cwd(), 'app/(blog)/notes')
const COLORS: NoteColor[] = ['warm', 'cool', 'neutral']

// Full ISO timestamp in LOCAL time, no timezone suffix — matches the /note
// skill's `date +"%Y-%m-%dT%H:%M:%S"` so notes sort by creation order.
function localStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// First 3-5 words, lowercased, hyphenated, punctuation stripped.
function slugify(content: string): string {
  const slug = content
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('-')
  return slug || 'note'
}

// Create a sticky-note markdown file exactly as the /note skill does, then
// return the derived note id (filename without .md) so the caller can locate
// it in the freshly-derived queue.
export function createNote(rawContent: string): { id: string } {
  const content = rawContent.trim()
  if (!content) throw new Error('empty')

  const now = new Date()
  const datePart = localStamp(now).slice(0, 10)
  const color = COLORS[getAllNotes(NOTES_DIR).length % COLORS.length]

  // Dedupe filename: slug, then -2, -3, … if it already exists.
  const base = `${datePart}-${slugify(content)}`
  let fileName = `${base}.md`
  let n = 2
  while (fs.existsSync(path.join(NOTES_DIR, fileName))) {
    fileName = `${base}-${n}.md`
    n += 1
  }

  const file = `---\ndate: ${localStamp(now)}\ncolor: ${color}\n---\n${content}\n`
  fs.writeFileSync(path.join(NOTES_DIR, fileName), file, 'utf-8')

  return { id: fileName.replace(/\.md$/, '') }
}
