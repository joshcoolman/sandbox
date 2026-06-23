import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type {
  ProjectContent,
  ProjectLogEntry,
  ProjectPhase,
  EntryVerdict,
} from '@/app/types/projects'

const contentDir = path.join(process.cwd(), 'content/building')

/**
 * Loads the editorial layer for a single project: the brief (index.md) and the
 * dated log entries. These are hand/skill-authored markdown distilled from the
 * project repo's raw log/ -- they are the published artifact, not the raw logs.
 */
export function getProjectContent(slug: string): ProjectContent {
  const dir = path.join(contentDir, slug)
  if (!fs.existsSync(dir)) return { brief: null, entries: [] }

  let brief: string | null = null
  const entries: ProjectLogEntry[] = []

  // YAML parses an unquoted `2026-06-22` into a UTC Date; normalize back to the
  // calendar date string so rendering never drifts a day in a western timezone.
  const toDateString = (v: unknown): string => {
    if (!v) return ''
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    return String(v)
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))

  for (const fileName of files) {
    const raw = fs.readFileSync(path.join(dir, fileName), 'utf-8')
    const { data, content } = matter(raw)

    if (fileName === 'index.md') {
      brief = content.trim()
      continue
    }

    entries.push({
      slug: fileName.replace(/\.md$/, ''),
      title: data.title ? String(data.title) : fileName.replace(/\.md$/, ''),
      date: toDateString(data.date),
      phase: data.phase ? (String(data.phase) as ProjectPhase) : undefined,
      verdict: data.verdict ? (String(data.verdict) as EntryVerdict) : undefined,
      excerpt: data.excerpt ? String(data.excerpt) : undefined,
      content: content.trim(),
    })
  }

  entries.sort((a, b) => {
    const byDate = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (byDate !== 0) return byDate
    // Same-day entries get a deterministic order by slug (readdir order isn't
    // stable across machines). Entries usually land on different days; for
    // strict within-day recency, give them distinct dates.
    return a.slug.localeCompare(b.slug)
  })

  return { brief, entries }
}
