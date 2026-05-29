export interface NewsSummary {
  slug: string
  date: string
  title: string
  videoCount: number
}

export interface NewsFile extends NewsSummary {
  content: string
}
