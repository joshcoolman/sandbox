export type ProjectStatus = 'in-development' | 'shipped'

export interface Project {
  slug: string
  name: string
  description: string
  repo: string
  status: ProjectStatus
  tags: string[]
}

export type ProjectPhase =
  | 'scaffolding'
  | 'agent-loop'
  | 'knowledge'
  | 'byok'
  | 'shipped'

export type EntryVerdict = 'kept' | 'reversed' | 'open'

export interface ProjectLogEntry {
  slug: string
  title: string
  date: string
  phase?: ProjectPhase
  verdict?: EntryVerdict
  excerpt?: string
  content: string
}

export interface ProjectContent {
  brief: string | null
  entries: ProjectLogEntry[]
}
