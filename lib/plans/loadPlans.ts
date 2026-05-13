import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { parseDocTitle } from '@/lib/docs/parseDocTitle'

export const plansDirectory = path.join(process.cwd(), 'plans')

export type PlanStatus = 'exploratory' | 'in-progress' | 'implemented' | 'archived'

const KNOWN_STATUSES: PlanStatus[] = ['exploratory', 'in-progress', 'implemented', 'archived']

function normalizeStatus(value: unknown): PlanStatus {
  if (typeof value !== 'string') return 'exploratory'
  const lower = value.toLowerCase().trim() as PlanStatus
  return KNOWN_STATUSES.includes(lower) ? lower : 'exploratory'
}

export interface PlanSummary {
  slug: string
  title: string
  description?: string
  status: PlanStatus
  modified: Date
}

export interface PlanFile {
  slug: string
  title: string
  description?: string
  status: PlanStatus
  content: string
}

function isExcluded(fileName: string): boolean {
  return fileName.startsWith('_') || fileName.startsWith('.')
}

function readPlanFiles(): { slug: string; filePath: string; raw: string }[] {
  if (!fs.existsSync(plansDirectory)) return []

  return fs
    .readdirSync(plansDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !isExcluded(entry.name))
    .map((entry) => {
      const filePath = path.join(plansDirectory, entry.name)
      const slug = entry.name.replace(/\.md$/, '')
      const raw = fs.readFileSync(filePath, 'utf-8')
      return { slug, filePath, raw }
    })
}

export function getAllPlans(): PlanSummary[] {
  return readPlanFiles()
    .map(({ slug, filePath, raw }) => {
      const { data: frontmatter, content } = matter(raw)
      const title = typeof frontmatter.title === 'string' && frontmatter.title.trim()
        ? frontmatter.title.trim()
        : parseDocTitle(content, slug)
      return {
        slug,
        title,
        description: frontmatter.description || undefined,
        status: normalizeStatus(frontmatter.status),
        modified: fs.statSync(filePath).mtime,
      }
    })
    .sort((a, b) => b.modified.getTime() - a.modified.getTime())
}

export function getPlanBySlug(slug: string): PlanFile | null {
  const files = readPlanFiles().filter((f) => f.slug === slug)
  if (files.length === 0) return null

  const { raw } = files[0]
  const { data: frontmatter, content } = matter(raw)
  const title = typeof frontmatter.title === 'string' && frontmatter.title.trim()
    ? frontmatter.title.trim()
    : parseDocTitle(content, slug)

  return {
    slug,
    title,
    description: frontmatter.description || undefined,
    status: normalizeStatus(frontmatter.status),
    content,
  }
}
