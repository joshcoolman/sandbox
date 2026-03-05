export interface Experiment {
  slug: string
  date: string
  title: string
  description: string
  screenshot: string
  tags: string[]
  theme?: 'light' | 'dark'
  bgTop?: string
  bgBottom?: string
}
