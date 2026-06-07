---
name: start-from-scratch
description: Strip this sandbox down to a minimal, demonstrable template and re-brand it for a new owner. Deletes all content except one sample of each surface, then asks for name/socials/site info and writes them into every identity file. Destructive — runs on a fresh-start branch behind a typed confirmation.
---

# start-from-scratch

Turn this repo into a clean starting point for a new owner. One guided pass replaces
the hours of manual deletion + find/replace it otherwise takes to repurpose the site.

This skill is **destructive and rarely run**. Follow the steps in order. Do not
delete anything before the safety gate passes. Do not auto-commit at the end.

## Usage

```
/start-from-scratch
```

No arguments. The skill is fully interactive.

---

## Step 1 — Safety gate (do this first, before any deletion)

1. Run `git status`. If the tree is **not** clean, stop and tell the user to commit
   or stash first. Do not proceed.
2. Create the branch so original `main` is never touched:
   ```
   git switch -c fresh-start
   ```
   If `fresh-start` already exists, switch to a numbered variant (`fresh-start-2`, …).
3. Print a deletion summary with live counts, then require confirmation. Get the
   counts with quick shell checks, e.g.:
   ```
   ls -d "app/design-experiments/(experiments)"/*/ | wc -l   # experiments
   ls blog/*.md | wc -l                                       # blog posts
   ls "app/(blog)/notes"/*.md | wc -l                         # notes
   ls "app/(blog)/recommended/items"/*.md | wc -l             # links
   ```
   Show something like: *"This DELETES ~25 experiments, ~9 posts, ~54 notes, ~27
   links, the news feed, and most sketches/docs — keeping ONE sample of each. It also
   rewrites all identity files. Branch: fresh-start. Type `fresh start` to proceed."*
4. Only continue if the user types `fresh start` exactly. Anything else → abort
   (leave them on the branch, nothing deleted).

---

## Step 2 — Strip content to one sample per surface

Most surfaces auto-discover from folders, so deleting files is enough. Keep exactly
one item per surface. **Replace personal prose with generic placeholder text.** The
kept experiment and sketch are code/visual demos — keep them as-is.

### Experiments
- Keep **one simple, dependency-free** experiment. Default: `step-sequencer` (pure
  Web Audio, no env vars). Avoid keeping any experiment that needs external services
  (e.g. `chatroom` needs a Cloudflare worker + Upstash).
- Delete every other directory under `app/design-experiments/(experiments)/`.
- Edit `lib/experiments/data.ts` so the `experiments` array contains **only** the
  kept entry (keep the `import type` line and the `export const` shape intact).
- Delete every screenshot in `public/screenshots/` except the kept one
  (`public/screenshots/step-sequencer.png` by default). Do **not** touch
  `public/screenshots/recommended/` here — that's handled below.

### Blog
- Keep one post file in `blog/` and its hero in `public/blog/`; delete the rest.
- Rewrite the kept post body to a short generic "sample post" and set its frontmatter
  `author:` to the new name collected in Step 3.

### Notes
- Keep one file in `app/(blog)/notes/`; delete the rest. Replace its body with a
  one-line sample. Keep the frontmatter shape (`date`, `color`).

### Recommended
- Keep one item in `app/(blog)/recommended/items/` (or write a fresh generic link to
  a well-known public URL) and keep its matching thumbnail in
  `public/screenshots/recommended/`; delete the other items and thumbnails.

### News
- Rewrite `news/feed.md` to keep the frontmatter (`title`) plus one sample date
  heading with one or two placeholder entries.
- Reset the ledger: write `[]` to `news/.ledger.json`.

### Docs
- Keep/rewrite one doc in `docs/` (e.g. `docs/01-progress.md` → a short "getting
  started" stub). Delete extra docs and the `docs/guide/` subfolder.

### Sketches
- Keep one directory under `app/sketches/`; delete the others. (Sketches are unlinked
  scratch — safe either way; keeping one demonstrates the surface.)

### X broadcast
- Reset `x-state.json` to defaults:
  ```json
  { "postsPerDay": 1, "posted": [], "removed": [], "order": [] }
  ```

After this step the homepage still renders fully — it reads `experiments.slice(0,9)`,
`getAllPosts().slice(0,4)`, recommendations, and docs, and one-of-each keeps every
section populated. `app/sitemap.ts` auto-discovers blog/experiment routes, so no
per-item sitemap edits are needed.

---

## Step 3 — Identity Q&A

Use `AskUserQuestion` to collect the new owner's details. Group into ~3 prompts;
let them skip any field (leave a sensible placeholder if skipped):

1. **Person** — name, role, location, tagline.
2. **Socials** — x/twitter URL, github URL, linkedin URL.
3. **Site** — site title, site description, domain (e.g. `example.com`).

---

## Step 4 — Write identity into the brand files

Replace every occurrence of the old owner across these files. The old values to
find: `Josh Coolman`, `joshcoolman`, `https://www.joshcoolman.com`,
`https://x.com/joshiscoolman`, the linkedin URL, `https://github.com/joshcoolman`.

- **`profile.json`** — `name`, `role`, `location`, `tagline`, `photo` (keep
  `/profile-photo.jpg`), and `links.x` / `links.linkedin` / `links.github`.
- **`app/layout.tsx`** — `metadataBase` URL (→ new domain), `title.default`,
  `title.template`, `description`, `authors`, `openGraph.title`,
  `openGraph.siteName`, and the JSON-LD `Person`/`WebSite` blocks (`name`, `url`,
  `sameAs`). Build the domain into a full `https://…` URL.
- **`app/sitemap.ts`** and **`app/robots.ts`** — replace the
  `https://www.joshcoolman.com` base URL with the new domain.
- **`README.md`** — heading, description, GitHub repo URLs, and live-site URLs.
- **`public/llms.txt`** and **`public/llms-full.txt`** — regenerate from the now-minimal
  content: new site title + description, the new domain in every URL, and only the
  one kept sample per surface.

Verify nothing slipped through:
```
grep -ri "joshcoolman\|Josh Coolman" app lib public README.md
```
The only hits allowed are the user's new values (or none).

---

## Step 5 — Photos (can't be generated)

Replace these with neutral committed placeholders (a plain solid color or simple
gradient PNG is fine) so the build has valid assets:
- `public/profile-photo.jpg`
- `public/home-page-background.png`

If the kept experiment doesn't use `public/staff-photos/`, delete that folder.

Tell the user in the final summary that these two placeholders are theirs to replace.

---

## Step 6 — Verify and report

1. Run `npm run build`. Fix any error until the production build is clean. The most
   likely failures: a dangling `import`/type mismatch in `lib/experiments/data.ts`, or
   a component referencing a deleted asset path.
2. Print a summary:
   - what was kept (the one sample per surface, by name),
   - which identity fields were set,
   - the two photo placeholders still to replace.
3. **Do not commit or push.** Leave the user on the `fresh-start` branch to review.
   Suggest they diff against main:
   ```
   git diff main --stat
   ```

---

## Notes for whoever runs this

- Order matters: safety gate → strip → ask → write identity → photos → build. Asking
  for the name before rewriting blog frontmatter and `layout.tsx` avoids a second pass.
- The `(experiments)` path has literal parens — quote it in shell commands.
- Styling/retheme is intentionally **out of scope**. Colors and type are scattered
  across the main chrome; a global restyle is a separate effort. This skill only
  strips content and swaps identity.
