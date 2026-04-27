export type BadgeKey =
  | 'rocket'
  | 'zap'
  | 'crown'
  | 'shield'
  | 'target'
  | 'award'
  | 'flame'

export interface PlayerBadge {
  icon: BadgeKey
  label: string
}

export interface Player {
  id: string
  name: string
  score: number
  streak: number
  gradient: string
  image?: string
  city: string
  level: number
  winRate: number
  bestRun: string
  tagline: string
  badges: PlayerBadge[]
  weekly: number[]
}

export const SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 30,
  mass: 0.8,
}

export const SPRINGY = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 18,
  mass: 0.7,
}

export const SPARKLE_COLORS = [
  '#ffb81c',
  '#22d3ee',
  '#f472b6',
  '#a3e635',
  '#c044ff',
]
