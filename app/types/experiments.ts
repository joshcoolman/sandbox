export interface Experiment {
  slug: string
  date: string
  title: string
  subtitle: string
  description: string
  screenshot: string
  tags: string[]
  theme?: 'light' | 'dark'
  bgTop?: string
  bgBottom?: string
  // When true, the (experiments) layout skips its header/footer chrome so the
  // experiment owns the full viewport. See app/design-experiments/(experiments)/layout.tsx
  fullscreen?: boolean
}
