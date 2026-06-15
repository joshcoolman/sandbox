---
description: Every slash command in the repo and how they connect
---

# Skills

Skills are slash commands that automate common workflows. They're defined in `.claude/skills/` and invoked during conversation -- type the command, and Claude handles the rest. Each skill maps to a part of the site, and together they form the loops that keep content and experiments flowing.

## Quick Capture

These are the commands you reach for mid-conversation when something needs to be saved.

### /note

Creates a sticky note -- a single thought on a colored card. Takes the content directly as an argument.

```
/note I wouldn't poo poo vibe coding too much
```

Writes a markdown file to `app/(blog)/notes/` with an ISO timestamp and auto-cycled color (warm, cool, neutral). The note appears immediately on the blog index as part of the sticky note stack. No title, no category -- just the thought and the date.

### /link

Saves a link with a comment to the Link Worthy collection.

```
/link https://github.com/anthropics/claude-code A CLI for Claude to write code directly
```

Creates a markdown file in `app/(blog)/recommended/items/`. For YouTube and GitHub links, thumbnails are auto-fetched at build time. For generic web links, the command takes a screenshot (1200x630) and saves it to `public/screenshots/linked/`. Titles are pulled from Open Graph metadata if not provided.

### /blog-post

Drafts a longer post from conversation context. Reads existing posts to match the site's voice, creates markdown with frontmatter at `blog/{slug}.md`, and copies a placeholder hero image. Not auto-committed -- there's always a review step before publishing.

## Design Pipeline

These commands move experiments from idea to shipped work. They're designed to be used in sequence, though you can skip stages or use them independently.

### /sketch

Rapid prototyping. Describe what you want or paste a reference image, and get a working two-file prototype (`page.tsx` + `styles.css`). The focus is visual iteration -- corners rounder, gradient warmer, animation springier. No architecture, no component extraction, just getting something on screen.

### /design-experiment

Formalizes a sketch into gallery-ready structure. Adds the experiment to the gallery data in `app/design-experiments/page.tsx`, organizes files into the proper directory structure, and ensures the build passes. The experiment is reviewable but not yet shipped.

### /ship-experiment

The release command. Takes a screenshot at 1280x720, updates the gallery ordering and homepage recent experiments list, updates the README, auto-commits, and pushes to GitHub. After this, the experiment is live on the site.

## Refinement

### /promote

The full quality pipeline, with all the polish folded into one job. Assesses an experiment's readiness, then runs whichever passes are needed: tightening CSS for color/type consistency, adding entrance motion where it helps, and a light TypeScript review (real bugs, props API clarity, client/server boundaries). It then extracts components to their own files, converts to CSS Modules, and creates a barrel export (`index.ts`). After promotion, the experiment is importable by other parts of the site:

```tsx
import { RetroTechPanel } from '@/app/design-experiments/(experiments)/retro-tech'
```

The experiment stays where it lives. It becomes both a demo page and a component library -- no separate package, no migration.

## Utilities

### /sanity-check

A senior engineer code review for React, TypeScript, and Next.js. Scans for component size issues, unnecessary client bundles, type safety gaps, Next.js convention mismatches, and accessibility problems. Presents findings as an interactive checklist of improvements to apply. Tone: helpful colleague, not a linter.

## References

### /vercel-react-best-practices

A reference skill rather than a workflow skill -- a packaged copy of Vercel Engineering's React and Next.js performance guidelines (MIT-licensed). Auto-triggers when writing, reviewing, or refactoring React/Next.js code: data fetching, bundle optimization, server vs client components, performance patterns. Acts as a domain glossary rather than a command.

## Process

These skills operate on the workflow itself rather than on site content.

### /write-a-skill

Scaffolds a new sandbox skill. Asks what the skill does and what should trigger it, then drafts a single-file `SKILL.md` with sandbox conventions baked in: terse voice, no emojis, `name` + `description` frontmatter only. Splits into progressive-disclosure reference files when the skill grows past ~150 lines. Adapted from Matt Pocock's `write-a-skill` with his glossary/ADR assumptions removed.
