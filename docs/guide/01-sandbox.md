---
description: What this site is and how its parts fit together
---

# The Sandbox

This is a design playground that doubles as a portfolio. It's built with Next.js and evolved through conversation -- most of the code, content, and tooling was made by talking to Claude and iterating on what came back. The site has five main sections, each with its own conventions and workflow.

## The Sections

**Design Experiments** are self-contained pages where visual ideas get prototyped, refined, and sometimes promoted into reusable components. They start as rough sketches and move through a pipeline of audits and polish before shipping. The gallery at `/design-experiments` presents them as a body of work.

**Blog** is a markdown-driven editorial space with a warm, print-inspired aesthetic. Posts range from essays about working with AI to technical reflections on design decisions. The card grid, overlay heroes, and prose styling are all tuned for long-form reading.

**Sticky Notes** are quick captures -- single thoughts written in a handwritten typeface on colored cards. They stack in the corner of the blog index like Post-its on a desk. No titles, no categories, just a thought and a date.

**Link Worthy** is a curated link collection with auto-fetched thumbnails and source badges. Drop a URL and a comment in a markdown file, and the build system handles the rest -- pulling titles from Open Graph, downloading thumbnails, detecting whether it's a YouTube video, GitHub repo, or web page.

**Plans** are design and architecture conversations with Claude rendered as HTML at `/plans` -- the comparisons, rationale, tradeoffs, and decisions behind the work, not just the resulting code. Each plan carries a status (exploratory, in-progress, implemented, archived) and gets custom rendering conventions: numbered "Move N" cards, eyebrow labels for inline subsection headers, and colored callouts for notes, decisions, caveats, and TL;DRs. Part of the "coding in public" ethos -- the thinking is the artifact.

## How It's Made

The site is built with Claude Code using a set of slash commands that map to each section. The workflow is conversational: describe what you want, iterate on the result, then use a command to formalize and ship it.

The most common loops:

- `/sketch` an idea, talk through iterations, `/ship-experiment` when it's ready
- `/note` a quick thought mid-conversation, see it appear on the blog index
- `/link` a link you found interesting, with a comment about why
- `/blog-post` to draft something longer from the conversation context

The docs you're reading now are part of the site too -- markdown files in a `docs/` folder, rendered with a sidebar, table of contents, and syntax-highlighted code blocks.

## Design System

The site uses a small set of shared conventions across all sections:

| Font | Role |
|------|------|
| Bitter 700 | Headings everywhere |
| Lora 400 / italic | Body text, titles, subtitles |
| Space Mono | Meta, dates, monospace details |
| Karla | Global body fallback |

Colors are warm and dark by default (`--site-bg: #0b0b0b`, `--site-text: #F2EFEB`) with a cyan accent (`#8FF7F9`) for interactive elements. A light theme is available for experiments and the blog, activated through a `data-theme` attribute that flips CSS custom properties.

Content width is capped at 900px (`--content-max`) across the blog, gallery, docs, and homepage.

## What the Docs Cover

The pages in this guide tell the story of each section: how it looks, how content flows through it, and how the workflow tools keep things moving. They're written for someone who wants to understand what they're looking at -- or pick up where the last conversation left off.
