import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'
import type { NewsSummary, NewsFile } from './types'

const newsDirectory = path.join(process.cwd(), 'news')

function readNewsFiles(): { slug: string; raw: string }[] {
  if (!fs.existsSync(newsDirectory)) return []
  return fs
    .readdirSync(newsDirectory, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.'))
    .map((e) => ({
      slug: e.name.replace(/\.md$/, ''),
      raw: fs.readFileSync(path.join(newsDirectory, e.name), 'utf-8'),
    }))
}

export const getAllSummaries = cache(function getAllSummaries(): NewsSummary[] {
  return readNewsFiles()
    .map(({ slug, raw }) => {
      const { data } = matter(raw)
      return {
        slug,
        date: data.date ? String(data.date) : slug,
        title: typeof data.title === 'string' ? data.title : `AI News — ${slug}`,
        videoCount: Number(data.videoCount) || 0,
      }
    })
    .sort((a, b) => b.slug.localeCompare(a.slug))
})

export const getNewsByDate = cache(function getNewsByDate(date: string): NewsFile | null {
  const files = readNewsFiles().filter((f) => f.slug === date)
  if (files.length === 0) return null
  const { data, content } = matter(files[0].raw)
  return {
    slug: date,
    date: data.date ? String(data.date) : date,
    title: typeof data.title === 'string' ? data.title : `AI News — ${date}`,
    videoCount: Number(data.videoCount) || 0,
    content,
  }
})
