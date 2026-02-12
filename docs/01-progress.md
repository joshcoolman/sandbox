# Development Progress

This file tracks major changes and milestones in the project.

---

### Day at a Glance: time-aware enhancement

**Date:** 2026-02-12
**Issue:** #9 - Day at a Glance: time-aware enhancement with dynamic now-line

Rebuilt the Day at a Glance experiment with a full 9am-5pm workday schedule, dynamic now-line that tracks real time, and a partial color fill effect on the current hour's event bar. Added accessibility for checkboxes and fixed hydration mismatch.

**Key files:** `app/day-at-a-glance/page.tsx`, `app/day-at-a-glance/styles.css`

---

### Write-post skill and TypeScript cleanup

**Date:** 2026-02-12

Added `/write-post` skill for blog authoring and eliminated all `any` types from the codebase.

**What changed:**
- New skill `.claude/skills/write-post/SKILL.md` for conversational blog post creation with auto-calculated reading time, slug derivation, and image handling
- Removed `@ts-nocheck` from `NetworkCanvas.tsx`, added typed interfaces (`CanvasNode`, `Organism`, `BlastAnimation`)
- Typed `TextScramble` class in both `geist-pixel` and `terminator` experiments
- Replaced all `any` props in color-spec components (`Cards.tsx`, `ColorSidebar.tsx`, `BrandColors.tsx`, `TypeInfo.tsx`, `ActivityWidget.tsx`, `AnalyticsWidget.tsx`)
- Typed blend recipe state and color scale utilities
- Updated sanity-check skill to remove emojis
- New feature doc: `docs/features/skills.md`

**Key files:** `.claude/skills/write-post/SKILL.md`, `app/components/NetworkCanvas.tsx`, `app/color-spec/components/ColorSidebar.tsx`

---

### Docs Viewer

**Date:** 2026-02-09

Added a `/docs` route that renders markdown files from the `docs/` directory with sidebar navigation, syntax highlighting, table of contents with scroll spy, and dark mode styling.

**What changed:**
- New route group `app/(docs)/` with layout, catch-all slug page, and index redirect
- Utility library `lib/docs/` for scanning the docs directory, parsing filenames, extracting headings
- Client components for sidebar (collapsible categories, mobile drawer), TOC (IntersectionObserver scroll spy), and code blocks (react-syntax-highlighter with VS Code Dark+ theme)
- Server-rendered markdown via next-mdx-remote/rsc with remark-gfm and rehype-slug
- Dark mode CSS Modules with Bitter serif font on headings to match homepage brand
- Homepage redesigned from single text link to two card-style nav links (Design Experiments + Docs)
- Ported 3 reference docs from the notes vault: AI Dev Stack 2026, BYOK Pattern, Stack Overview
- Files prefixed with `_` are excluded from the sidebar (used for templates)
- Subdirectories in `docs/` become collapsible categories; numeric prefixes control sort order

**Key files:**
- `app/(docs)/layout.tsx` - Docs layout with sidebar
- `app/(docs)/docs/[...slug]/page.tsx` - Doc renderer with TOC
- `app/(docs)/_components/` - DocsSidebar, TableOfContents, CodeBlock, DocsContent
- `lib/docs/loadDocs.ts` - Core logic for scanning and loading docs
- `app/(docs)/docs.module.css` - All docs styling
- `app/page.tsx` - Homepage with card nav links
- `docs/stack/` - Ported reference documentation

**Dependencies added:**
- gray-matter, remark-gfm, rehype-slug, react-syntax-highlighter, next-mdx-remote, lucide-react

---

### TypeScript Migration & Component Architecture

**Date:** 2026-02-08

Completed comprehensive TypeScript migration and established component extraction patterns for the design experiments sandbox.

**What changed:**
- Converted all 7 experiments from `.jsx` to `.tsx` with full type safety
- Added TypeScript type definitions (`@types/react-dom`, `@types/chroma-js`)
- Refactored `color-spec` from monolithic 2000+ line file into modular component architecture
- Established clear guidelines in CLAUDE.md for when to extract vs keep single-file

**Key files:**
- All `app/*/page.tsx` - TypeScript conversion
- `app/color-spec/components/*` - Extracted reusable components
- `app/color-spec/hooks/useColorScale.ts` - Color generation utilities
- `app/color-spec/data/fontPairings.ts` - Static data extraction
- `CLAUDE.md` - Added component architecture guidance

**Benefits:**
- Full type safety across all experiments
- Easier to port components to other projects
- Clear separation of concerns in complex experiments
- Better AI agent collaboration on component extraction

---
