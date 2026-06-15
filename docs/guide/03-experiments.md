---
description: From sketch to shipped component, and the pipeline in between
---

# Design Experiments

Experiments are where ideas become pages. Each one is a self-contained route with its own styles, components, and data -- a small world that can be as rough or as polished as the idea demands. The interesting part isn't just the experiments themselves, but the pipeline that moves them from sketch to shipped work.

## The Lifecycle

An experiment typically moves through four stages:

**Sketch** -- `/sketch` creates a two-file prototype: `page.tsx` and `styles.css`. Describe what you want or paste a reference image, and iterate on the visual feedback. No architecture, no overthinking. The goal is to get something on screen fast.

**Formalize** -- `/design-experiment` converts a sketch into gallery-ready structure. It adds the experiment to the gallery data, organizes files, and ensures the build passes. Still not shipped -- the user reviews first.

**Promote** -- `/promote` makes an experiment importable, folding all the polish passes into one job: it tightens CSS for color/type consistency, adds entrance motion where it helps, does a light TypeScript review (real bugs, props API clarity, client/server boundaries), extracts components to their own files, converts to CSS Modules, and creates a barrel export. The experiment stays where it lives -- it becomes both demo page and component library.

**Ship** -- `/ship-experiment` takes a screenshot (1280x720), updates the gallery ordering and homepage, auto-commits, and pushes to GitHub for deploy. Now it's live.

Not every experiment goes through every stage. Some stay as sketches. Some skip straight from formalize to ship. The pipeline is there when you want it, not enforced.

## Gallery

The gallery at `/design-experiments` lists experiments vertically with a 280px preview image alongside the title, description, date, and tags. Cards fade up with staggered timing on first visit and lift with a cyan glow on hover.

Tags provide a scannable taxonomy: typography, layout, data-viz, motion. Each experiment also declares a theme (`light` or `dark`) that the shared frame respects.

## Experiment Frame

Every experiment renders inside a shared layout that wraps it with:

- A back link to the gallery
- Title and "Design Experiment" label
- Tags from the gallery data
- Date and footer navigation

The frame uses small, structured typography (10px uppercase labels, 13px titles) that stays out of the way. It defines its own CSS variable scope so experiments can override colors without breaking the chrome.

## Self-Contained Pages

Each experiment owns its files completely:

```
[experiment]/
├── page.tsx           # The page
├── styles.css         # Scoped styles
├── components/        # Extract at >500 lines
├── hooks/             # Custom hooks
└── data/              # Static data
```

The convention is to keep page files under 300 lines and extract to `components/` when things grow. Some experiments are 54 lines. Others have multiple component files with their own CSS modules. Both are fine.

## Editorial Briefs

Experiments that tell a design story use the `EditorialBrief` component -- a narrow 600px column with a headline, italic lede, optional image grid, and body paragraphs. It sits below the experiment itself, giving context about what was being explored and how it was built. The images render in a flexible grid with 4:3 ratios and a subtle grayscale filter.

## Theme System

The site provides dark and light themes through CSS custom properties. Dark is the default (`--site-bg: #0d0d0d`), and light mode swaps to warm paper tones (`--light-bg: #d8d4ca`). Experiments can also define `--experiment-bg` for a custom background. The frame, footer, and navigation all respond to the active theme automatically.
