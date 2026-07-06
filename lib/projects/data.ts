import type { Project } from '@/app/types/projects'

/**
 * The public repos, as they appear on /building. Single source of truth for the
 * catalog and the detail pages. Plain facts only -- what each tool does, its
 * shape, and a few useful highlights. No status split, no storytelling.
 *
 * Maintained by the `update-my-work` skill: it audits the public GitHub repos
 * and regenerates these entries. Edit by hand freely; the skill is idempotent.
 */
export const projects: Project[] = [
  {
    slug: 'palette-forge',
    name: 'Palette Forge',
    repo: 'https://github.com/joshcoolman/palette-forge',
    liveUrl: 'https://colorfordays.com',
    tagline:
      'From an image or seed color, generates rounds of distinct light and dark UI palettes — legible by construction.',
    stack: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind v4', 'pnpm'],
    whatItDoes:
      'Drop in an image or a seed color and it composes several distinct palette takes in light and dark — each a saturated ground with a cross-hue accent. Re-run for a fresh round, keep the ones you like, and export as JSON or CSS variables. With your own Anthropic key a third path opens: describe a palette in words and the model authors the whole round.',
    structure: `palette-forge/
├── src/          app routes + palette engine
├── knowledge/    the taste layer (editable markdown)
├── eval/         local prompt-eval capture (runs.jsonl)
├── docs/         spec + build plans
└── scripts/      tooling`,
    highlights: [
      'Deterministic by default — nothing leaves the browser without your key',
      '/knowledge is plain markdown you can rewrite to change the output',
      'Legibility is baked into the recipe, not enforced by a checker',
    ],
  },
  {
    slug: 'repo-explorer',
    name: 'Repo Explorer',
    repo: 'https://github.com/joshcoolman/repo-explorer',
    tagline:
      'Local-only tool for browsing trending repos and running agentic analysis with Claude, via swappable investigation personas.',
    stack: ['Next.js', 'TypeScript', 'Claude Agent SDK'],
    whatItDoes:
      'Paste one or two GitHub URLs, pick a persona, and it shallow-clones each repo to a temp dir, runs an Explore agent over it via the local Claude Agent SDK, and writes a self-contained HTML report — keeping an index of past reports in the sidebar. The clone is always discarded. It shells out to git and runs an agent on your machine, so it stays local-only.',
    structure: `repo-explorer/
├── app/       local web GUI
├── lib/       agent orchestration (Claude Agent SDK)
├── data/      generated HTML reports
├── scripts/   launcher
└── docs/      notes`,
    highlights: [
      'Runs on a Claude Pro/Max subscription or your Anthropic API key',
      'Swappable analysis personas, each with its own scope + report template',
      'Local-only: clones are temporary and never exposed',
    ],
  },
  {
    slug: 'type-explorer',
    name: 'Type Explorer',
    repo: 'https://github.com/joshcoolman/type-explorer',
    liveUrl: 'https://type-explorer-pi.vercel.app/',
    tagline:
      'Browse Google Fonts as full-size specimens and discover curated and algorithmic display + text pairings.',
    stack: ['Next.js', 'TypeScript'],
    whatItDoes:
      'A calmer way to choose type than scrolling a wall of names. Browse the full Google Fonts catalog as real specimens — title, subtitle, and paragraph set in the actual font — with search, filters, and sort. Set a custom typographic voice so every font is judged against the same words, and hit Get Pairings on any font for curated and algorithmic partners. Pairings are precomputed offline, so it needs no AI or API keys at runtime.',
    structure: `type-explorer/
├── app/       routes + specimen UI
├── lib/       pairing logic
├── data/      precomputed pairings
├── content/   curated sets
└── scripts/   offline pairing generation`,
    highlights: [
      "Pairings precomputed offline from Google Fonts' semantic tags + a curated set",
      'No API keys — fully static at runtime',
    ],
  },
  {
    slug: 'outpaint-studio',
    name: 'Outpaint Studio',
    repo: 'https://github.com/joshcoolman/outpaint-studio',
    tagline:
      'Extends an image to a target aspect ratio with seam-aware fill so the added area looks intentional, not pasted.',
    stack: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind v4'],
    whatItDoes:
      "An agent-first, BYO-key utility that grows an image to a new ratio — 'I have this, I need it at 21:9 for the hero.' The agent-first version closes the loop with vision as the verifier: generate, look at the seam, regenerate the bad region, repeat under a hard cap. Currently a runnable scaffold with the architecture, contracts, and knowledge layer in place; the first vertical slice is next.",
    structure: `outpaint-studio/
├── src/         runnable shell + /docs viewer
├── knowledge/   the extension taste layer (markdown)
├── docs/        PLAN.md, SPEC.md, overview
└── public/`,
    highlights: [
      'Scaffolded and runnable; the build is in progress',
      'Vision as the verifier — generate, inspect the seam, regenerate',
      'Image libs in place: @google/genai, @anthropic-ai/sdk, sharp',
    ],
  },
  {
    slug: 'prompt-smith',
    name: 'Prompt Smith',
    repo: 'https://github.com/joshcoolman/prompt-smith',
    tagline: 'Improves a prompt against a stated problem, fixing exactly what you flag.',
    stack: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind v4'],
    whatItDoes:
      "An agent-first, BYO-key utility that revises a prompt against a complaint — 'too verbose, too many canned phrases' — and checks the result against both your complaint and a /knowledge rubric until it's satisfied. The most fun file is anti-patterns.md, a living blocklist of phrases that produce mush; the app gets better as you grow it. Scaffolded and runnable; development begins after palette-forge.",
    structure: `prompt-smith/
├── src/         runnable shell
├── knowledge/   prompt-craft rubric (anti-patterns.md)
├── docs/        spec + overview
└── public/`,
    highlights: [
      'Scaffolded and runnable; development begins after palette-forge ships',
      'Verifier from two sources: your complaint + the /knowledge rubric',
    ],
  },
  {
    slug: 'view-down',
    name: 'View Down',
    repo: 'https://github.com/joshcoolman/view-down',
    tagline:
      'Drag a folder or a single markdown file onto the page and read it formatted instantly — nothing is uploaded, nothing is saved.',
    stack: ['Vite', 'React 19', 'TanStack Router', 'Tailwind v4'],
    whatItDoes:
      "Reads .md/.markdown files straight out of the browser's drag-and-drop file entries and renders them formatted — no editor, no preview toggle. A nav tree, reading pane, and filename search over whatever you drop in. Nothing is uploaded or saved; it's a personal, local-only tool.",
    structure: `view-down/
├── src/       drag-and-drop viewer
├── docs/      plan + notes
└── public/`,
    highlights: [
      'Everything stays in the browser — nothing uploaded or saved',
      'A personal tool, not a maintained product',
    ],
  },
]
