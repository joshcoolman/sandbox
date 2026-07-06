export interface Project {
  slug: string
  name: string
  repo: string
  liveUrl?: string
  /** One-line hook shown under the name on the card and detail header. */
  tagline: string
  /** A few short chips -- the tech stack. */
  stack: string[]
  /** A short factual paragraph: what the tool does. No storytelling. */
  whatItDoes: string
  /** A curated ASCII tree of the repo's meaningful directories. */
  structure: string
  /** A few plain bullets: notable, decision-useful facts. */
  highlights: string[]
}
