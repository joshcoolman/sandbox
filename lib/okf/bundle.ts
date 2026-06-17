import { experiments } from '@/lib/experiments/data'
import type { Experiment } from '@/app/types/experiments'

// Open Knowledge Format (OKF) bundle generator.
// Spec: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
//
// Exposes this sandbox's design experiments as an agent-queryable knowledge
// bundle: a tree of frontmatter-markdown concept documents served over plain
// HTTP at /okf/. A visiting agent fetches /okf/index.md, traverses the links,
// and follows the `resource` (live demo) + `source` (GitHub) pointers to pull
// whatever it needs. Pointers-to-source, not inlined code — the concept
// describes the experiment and tells the agent exactly where to find the
// implementation.

const SITE = 'https://www.joshcoolman.com'
const REPO = 'https://github.com/joshcoolman/sandbox'

const demoUrl = (slug: string) => `${SITE}/design-experiments/${slug}`

// Experiments live under app/design-experiments/(experiments)/<slug>/.
// The parentheses in the route-group segment are percent-encoded so the URL
// survives markdown link parsing.
const sourceUrl = (slug: string) =>
  `${REPO}/tree/main/app/design-experiments/%28experiments%29/${slug}`

const toIso = (date: string): string => {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

const fm = (exp: Experiment): string => {
  const lines = [
    '---',
    'type: Design Experiment',
    `title: ${exp.title}`,
    `description: ${exp.subtitle}`,
    `resource: ${demoUrl(exp.slug)}`,
    `source: ${sourceUrl(exp.slug)}`,
    `tags: [${exp.tags.join(', ')}]`,
  ]
  const ts = toIso(exp.date)
  if (ts) lines.push(`timestamp: ${ts}`)
  lines.push('---')
  return lines.join('\n')
}

export function buildConcept(exp: Experiment): string {
  return `${fm(exp)}

${exp.description}

# Source

- Live demo: ${demoUrl(exp.slug)}
- Source code: ${sourceUrl(exp.slug)}

# Tags

${exp.tags.map((t) => `- ${t}`).join('\n')}
`
}

export function buildIndex(): string {
  const rows = experiments
    .map((e) => `- [${e.title}](./${e.slug}.md) — ${e.subtitle}`)
    .join('\n')

  return `---
type: Index
title: Josh Coolman — Design Experiments
description: An agent-queryable knowledge bundle of self-contained frontend design experiments.
resource: ${SITE}/design-experiments
---

# Design Experiments

This is an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundle describing the design experiments built in Josh Coolman's sandbox (${REPO}).

Each concept below is a self-contained frontend experiment. Follow a link to read its description, then use its \`resource\` (live demo) and \`source\` (GitHub) fields to pull the implementation.

${rows}

See [log.md](./log.md) for change history.
`
}

export function buildLog(): string {
  const rows = experiments
    .map((e) => {
      const ts = toIso(e.date)
      const stamp = ts ? ts.slice(0, 10) : e.date
      return `- ${stamp} — [${e.title}](./${e.slug}.md)`
    })
    .join('\n')

  return `---
type: Log
title: Change History
description: Design experiments in reverse-chronological order of publication.
---

# Log

${rows}
`
}

// Maps every bundle filename to its rendered markdown. Used by both the route
// handler (generateStaticParams + GET) and tests.
export function buildBundle(): Record<string, string> {
  const out: Record<string, string> = {
    'index.md': buildIndex(),
    'log.md': buildLog(),
  }
  for (const exp of experiments) {
    out[`${exp.slug}.md`] = buildConcept(exp)
  }
  return out
}
