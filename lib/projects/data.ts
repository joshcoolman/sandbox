import type { Project } from '@/app/types/projects'

/**
 * Current projects, curated by hand. Single source of truth for the /building
 * page. Order within each status group is the display order. Edit copy freely --
 * no build-time network calls, so what's here is exactly what renders.
 */
export const projects: Project[] = [
  {
    slug: 'palette-forge',
    name: 'Palette Forge',
    description: 'Image in, four distinct accessible light + dark UI palettes out — surprise me.',
    repo: 'https://github.com/joshcoolman/palette-forge',
    status: 'in-development',
    tags: ['Agent-first', 'BYO-key', 'Built in public'],
  },
  {
    slug: 'outpaint-studio',
    name: 'Outpaint Studio',
    description: 'Image + target ratio in, seam-aware extension out — make this hero 21:9.',
    repo: 'https://github.com/joshcoolman/outpaint-studio',
    status: 'in-development',
    tags: ['Agent-first', 'BYO-key', 'Built in public'],
  },
  {
    slug: 'prompt-smith',
    name: 'Prompt Smith',
    description: 'Prompt + a complaint in, an improved prompt out.',
    repo: 'https://github.com/joshcoolman/prompt-smith',
    status: 'in-development',
    tags: ['Agent-first', 'BYO-key', 'Built in public'],
  },
  {
    slug: 'repo-explorer',
    name: 'Repo Explorer',
    description: 'Local-only tool for browsing trending repos and running agentic analysis with Claude.',
    repo: 'https://github.com/joshcoolman/repo-explorer',
    status: 'shipped',
    tags: ['Local-only', 'Claude skill'],
  },
  {
    slug: 'type-explorer',
    name: 'Type Explorer',
    description: 'Google Fonts as full-size specimens, with curated and algorithmic pairings.',
    repo: 'https://github.com/joshcoolman/type-explorer',
    status: 'shipped',
    tags: ['Google Fonts', 'Typography'],
  },
]

export const inDevelopmentProjects = projects.filter((p) => p.status === 'in-development')
export const shippedProjects = projects.filter((p) => p.status === 'shipped')
