Next.js design experiments sandbox. Each experiment is a self-contained route.

## Working conventions

- **End every file-touching turn with an uncommitted-changes readout.** After any response that creates or edits files, close with a list of clickable markdown links mirroring `git status` -- every file with pending changes (created *and* modified), each as `[path](path)`. Derive it from `git status`, not from recall of what changed this turn. It's the fast way to jump back into the work and to see where things stand on any machine. ("The readout rule" refers to this.)

## Commands

```bash
npm run dev        # Dev server :3000
npm run build      # Production build
npm run typecheck  # tsc --noEmit -- run before pushing
```

## Pre-push gate

A git `pre-push` hook runs `npm run typecheck` before each push, blocking any push that would fail Vercel's build (a type error caught locally in ~3s instead of a failed deploy minutes later). It's bypassable with `git push --no-verify`.

The hook lives in `.git/hooks/` (untracked), so on a fresh clone it won't exist. If `.git/hooks/pre-push` is missing, offer to install it -- don't create it unprompted. When offering, briefly explain what it is and why it helps (the line above), since a first-time cloner won't know. If they accept: write a `sh` script that runs `npm run typecheck` and exits non-zero on failure, then `chmod +x` it.

## Frequent Workflows

**Quick capture (most common):**
- `/note` -- sticky note, instant capture
- `/link` -- save a link with comment, auto-thumbnails
- `/blog-post` -- draft from conversation context

**Design experiments:**
- `/sketch` -- rapid prototype in `app/sketches/` (page.tsx + styles.css)
- `/design-experiment` -- scaffold a real, registered experiment
- `/ship-experiment` -- screenshot, gallery, README, commit, push

## SEO Checklist

After adding any new route or content section, touch these files:
- `app/sitemap.ts` -- add new routes to `staticRoutes` (dynamic routes like blog/experiments are auto-discovered)
- `public/llms.txt` -- concise entry
- `public/llms-full.txt` -- expanded entry with description
- `README.md` -- if it's a new section (not just a new item within existing content)
- `docs/01-progress.md` -- notable changes

Metadata: each page.tsx should export `metadata` with title + description. The root layout has OG/Twitter defaults.

Note: `app/sketches/` is intentionally excluded from all of the above -- no sitemap/llms entry, unlinked from the site. Leave it out of the SEO checklist on purpose.

## Feature Map

Word you'd say -> where it lives -> the skill for it. Rows are durable surfaces (route groups), not files. Keep it to one row per feature; map to directories, name a file only when one file clearly owns the behavior; never enumerate leaf content (individual experiments/notes/posts are auto-discovered).

| Feature      | Where                   | Brain file                                                             | Skill(s) |
|--------------|-------------------------|-----------------------------------------------------------------------|----------|
| AI News feed | `app/(news)/`           | `_components/NewsEditableContent.tsx` (edit mode) - `news/feed.md` (content) - `lib/news/` | `/ai-news` |
| Blog         | `app/(blog)/blog/`      | --                                                                    | `/blog-post` |
| Link Worthy  | `app/(blog)/recommended/` | `loadRecommended.ts`                                                | `/link` |
| Sticky notes | `app/(blog)/notes/`     | --                                                                    | `/note` |
| X broadcast  | `app/x/`                | `lib/x/` (derived queue + state) - `x-state.json` (committed ledger) - local-only, Web Intent posting | -- |
| Experiments  | `app/design-experiments/` | `(experiments)/` (real, in `data.ts`) - `page.tsx` (gallery)        | `/design-experiment`, `/ship-experiment` |
| Sketches     | `app/sketches/`         | `page.tsx` (index, folder-scanned) -- top-level scratch, unlinked from the site, safe to delete | `/sketch` |
| Docs         | `app/(docs)/`           | --                                                                    | -- |

## Structure

```
app/design-experiments/
|-- page.tsx                       # Gallery
`-- (experiments)/
    `-- [experiment]/
        |-- page.tsx               # Experiment page
        |-- styles.css
        |-- components/            # Extract when >500 lines
        |-- hooks/
        `-- data/

app/sketches/                      # Top-level scratch -- unlinked, safe to delete
|-- page.tsx                       # Folder-scanned index at /sketches
`-- [name]/                        # page.tsx + styles.css

app/(blog)/
|-- blog/                          # Blog index and posts
|-- recommended/                   # Link Worthy page
|   |-- items/                     # Individual link .md files
|   `-- loadRecommended.ts         # Auto-fetches thumbnails at build
`-- notes/                         # Sticky note .md files
```

## Component Extraction

Keep inline under 300 lines. Extract to `components/` when file exceeds 500 lines or component has a reusable interface.
