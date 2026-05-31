Next.js design experiments sandbox. Each experiment is a self-contained route.

## Commands

```bash
npm run dev      # Dev server :3000
npm run build    # Production build
```

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
| Link Worthy  | `app/(blog)/recommended/` | `loadRecommended.ts`                                                | `/link`, `/replace` |
| Sticky notes | `app/(blog)/notes/`     | --                                                                    | `/note` |
| Experiments  | `app/design-experiments/` | `(experiments)/` (real, in `data.ts`) - `page.tsx` (gallery)        | `/design-experiment`, `/ship-experiment` |
| Sketches     | `app/sketches/`         | `page.tsx` (index, folder-scanned) -- top-level scratch, unlinked from the site, safe to delete | `/sketch` |
| Plans        | `app/(plans)/`          | --                                                                    | -- |
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
