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

These commands tighten the quality of an experiment. They can run independently or as part of the `/promote` pipeline.

### /design-audit

Scans an experiment's CSS for color and type inconsistencies. Surfaces near-duplicate colors (is `#f4f4f4` really different from `#f5f5f5`?), orphan font sizes, and opportunities to unify the design system. Proposes specific changes and implements them atomically after approval. Keeps the visual character intact -- just more consistent.

### /animation-audit

Inventories existing motion and identifies what's missing. Proposes a motion plan: entrance animations, stagger timing, interaction feedback (hover lifts, click responses). Suggests spring presets and implements Framer Motion animations. Adds click-to-replay for demonstrating motion patterns.

### /ts-handoff

Light TypeScript cleanup from a practical perspective. Checks for real bugs, props API clarity, state patterns, and client/server boundary issues. Suggests CSS Modules conversion for portability. The question it answers: "Is this code ready to hand off?" Not strict -- just hygienically sound.

### /promote

The full quality pipeline. Assesses an experiment's readiness, runs whichever audit passes are needed (design, animation, TypeScript), extracts components to their own files, converts to CSS Modules, and creates a barrel export (`index.ts`). After promotion, the experiment is importable by other parts of the site:

```tsx
import { RetroTechPanel } from '@/app/design-experiments/(experiments)/retro-tech'
```

The experiment stays where it lives. It becomes both a demo page and a component library -- no separate package, no migration.

## Utilities

### /sanity-check

A senior engineer code review for React, TypeScript, and Next.js. Scans for component size issues, unnecessary client bundles, type safety gaps, Next.js convention mismatches, and accessibility problems. Presents findings as an interactive checklist of improvements to apply. Tone: helpful colleague, not a linter.

### /replace

Updates a blog post's hero image. Find a post by name, provide a source image, and the command crops it to the blog's standard 1.87:1 aspect ratio and replaces the existing hero at `public/blog/{slug}.jpg`.

### /bitmap-to-vector

Converts raster images (PNG, JPG) to clean SVG vectors using potrace-based tracing. Output uses `fill="currentColor"` for theme-aware coloring. Useful for logos, icons, and illustrations that need to work at any size.

## Asset Generation

These skills create visual assets directly into an experiment's folder.

### /gen-image

Generates raster images via FAL.ai -- avatars, icons, illustrations, hero art. Takes a text description (and optionally a reference image), produces N PNG outputs into the current experiment's `public/` folder. Replaces the workflow of cropping from Unsplash or commissioning art for prototypes. Requires the FAL MCP to be installed in the user's Claude environment.

### /gen-sprite

Generates NES-style pixel-art game assets via GenZen (gpt-image-1.5). Auto-detects layout from the description: `character` (4×4 animated sprite sheet), `strip` (N×1 sequential states like walk/attack frames), or `single` (one standalone image). Useful for any game asset -- enemies, items, effects, tiles, pickups, UI elements.

## Infrastructure

### /supabase

Wraps the Supabase CLI for database operations: schema migrations, TypeScript type generation, edge function deployment, and postgres best practices. Provides opinionated, safe workflows for common Supabase tasks so the CLI's surface area doesn't have to live in working memory.

## References

### /vercel-react-best-practices

A reference skill rather than a workflow skill -- a packaged copy of Vercel Engineering's React and Next.js performance guidelines (MIT-licensed). Auto-triggers when writing, reviewing, or refactoring React/Next.js code: data fetching, bundle optimization, server vs client components, performance patterns. Acts as a domain glossary rather than a command.

## Process

These skills operate on the workflow itself rather than on site content -- one stress-tests a plan, the other scaffolds new skills.

### /grill-me

Interviews you about a plan one question at a time, with a recommended answer attached to each question. Walks the decision tree of a design until ambiguity is resolved. Use before `/sketch` or `/design-experiment` when the brief is vague enough that prototyping would burn iterations on resolvable questions. Ported verbatim from Matt Pocock's skills repo.

### /write-a-skill

Scaffolds a new sandbox skill. Asks what the skill does and what should trigger it, then drafts a single-file `SKILL.md` with sandbox conventions baked in: terse voice, no emojis, `name` + `description` frontmatter only. Splits into progressive-disclosure reference files when the skill grows past ~150 lines (see `supabase/` for the working example). Adapted from Matt Pocock's `write-a-skill` with his glossary/ADR assumptions removed.
