import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'
import type { NewsFeed } from './types'

const feedPath = path.join(process.cwd(), 'news', 'feed.md')

// Drop date dividers (## headings) that have no content beneath them — e.g. when
// every video for a date has been trimmed, the bare heading should not render.
function stripEmptySections(content: string): string {
  const lines = content.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      let j = i + 1
      while (j < lines.length && !lines[j].startsWith('## ') && lines[j].trim() === '') j++
      const empty = j >= lines.length || lines[j].startsWith('## ')
      if (empty) {
        i = j - 1 // skip the heading and its trailing blank lines
        continue
      }
    }
    out.push(line)
  }
  return out.join('\n').trim() + '\n'
}

export const getFeed = cache(function getFeed(): NewsFeed | null {
  if (!fs.existsSync(feedPath)) return null
  const { data, content } = matter(fs.readFileSync(feedPath, 'utf-8'))
  return {
    title: typeof data.title === 'string' ? data.title : 'AI News',
    content: stripEmptySections(content),
  }
})
