// Parse the AI-news feed body into structured sections + entries so the page can
// render a YouTube-style layout (thumbnail with a date/duration row under it) and
// a simple edit mode. The feed is fully skill-controlled, so the format is fixed:
//
//   ## June 11, 2026
//
//   **Title** — Channel (Jun 9 · 20 min)
//   One-line description.
//   [![](https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)](https://youtube.com/watch?v=VIDEO_ID)
//
// Duration is optional (older entries may lack it). Entries are blank-line separated.

export interface FeedEntry {
  id: string
  title: string
  channel: string
  published: string // short date as written, e.g. "Jun 9"
  durationMin: number | null
  description: string
  watchUrl: string
  thumbUrl: string
}

export interface FeedSection {
  date: string // e.g. "June 11, 2026"; "" if entries appear before any divider
  entries: FeedEntry[]
}

const TITLE_RE = /^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/
const META_RE = /\(([^)]*)\)\s*$/
const ID_RE = /\/vi\/([A-Za-z0-9_-]{6,})\//

function parseEntry(block: string[]): FeedEntry | null {
  const m = block[0].trim().match(TITLE_RE)
  if (!m) return null
  const title = m[1].trim()

  // "Channel (Jun 9 · 20 min)" → channel + date + duration
  let channel = m[2].trim()
  let published = ''
  let durationMin: number | null = null
  const meta = channel.match(META_RE)
  if (meta && meta.index !== undefined) {
    channel = channel.slice(0, meta.index).trim()
    const parts = meta[1].split('·').map((s) => s.trim())
    published = parts[0] || ''
    if (parts[1]) {
      const dm = parts[1].match(/(\d+)/)
      durationMin = dm ? parseInt(dm[1], 10) : null
    }
  }

  const thumbLine = block.find((l) => ID_RE.test(l)) || ''
  const idMatch = thumbLine.match(ID_RE)
  const id = idMatch ? idMatch[1] : ''
  if (!id) return null

  const description = block
    .slice(1)
    .filter((l) => !ID_RE.test(l))
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')

  return {
    id,
    title,
    channel,
    published,
    durationMin,
    description,
    watchUrl: `https://youtube.com/watch?v=${id}`,
    thumbUrl: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
  }
}

export function parseFeed(content: string): FeedSection[] {
  const lines = content.split('\n')
  const sections: FeedSection[] = []
  let current: FeedSection | null = null

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      current = { date: line.slice(3).trim(), entries: [] }
      sections.push(current)
      i++
      continue
    }
    if (line.trim().startsWith('**')) {
      const block: string[] = [line]
      let j = i + 1
      while (j < lines.length && lines[j].trim() !== '') {
        block.push(lines[j])
        j++
      }
      const entry = parseEntry(block)
      if (entry) {
        if (!current) {
          current = { date: '', entries: [] }
          sections.push(current)
        }
        current.entries.push(entry)
      }
      i = j
      continue
    }
    i++
  }

  return sections.filter((s) => s.entries.length > 0)
}
