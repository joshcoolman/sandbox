import type { ReactNode } from 'react'

export interface ModelTag {
  label: string
  icon?: 'resolution' | 'duration'
}

export interface ModelItem {
  id: string
  label: string
  icon?: string
  iconNode?: ReactNode
  tags?: ModelTag[]
  badge?: string
  description?: string
  children?: ModelItem[]
}

export interface ModelSection {
  title: string
  icon?: string
  items: ModelItem[]
}
