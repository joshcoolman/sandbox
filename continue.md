# Continue: /ai-news skill + /news page redesign

## What was being worked on
A big iterative reshape of the **`/ai-news` skill** (YouTube curation) and the **`/news` page** that renders its output. All uncommitted on `main`. Build + typecheck both pass. User is about to clear context, test the skill with a fresh query, then commit everything.

## Changes made so far

**`scripts/yt-ai-news.py`** (fetch tool → now also renders the review UI)
- Casts **wide by default**: no Shorts filter, no language filter (opt back in with `--min-seconds N` / `--english-only`). `--max` default 25.
- New `--html PATH` / `--out PATH`: writes a self-contained interactive review page (`news/.review/index.html`) + full candidate JSON (`news/.review/candidates.json`). `news/.review/` is gitignored/disposable.
- The HTML (`_HTML_TEMPLATE` + `render_review_html`): thumbnail grid, signal badges, **click card = open video / click the circle = keep**, **Noise→Signal slider** (client `signalScore`, percentile cutoff; kept cards always visible), text filter, **LAST VIEWED** yellow marker on last-clicked, **PUBLISHED** blue marker (dimmed, non-selectable) for ids already in `news/feed.md` via `load_published_ids()`, live "keep list" textarea + Copy. No "View /news" link (removed — file:// can't know the port). No link/Resources extraction anymore.
- **Additive board**: each run merges into the existing candidates.json (dedup by id), re-renders from the union; `--fresh` overwrites.

**`.claude/skills/ai-news/SKILL.md`** — rewritten to: freeform steering (`/ai-news <anything>`, any topic), one fast fetch → open page → echo `file://` path, browse→pick→commit-only-keepers. New entry format `**Title** — Channel (date · N min)` where `N = max(1, round(duration_sec/60))`. "Clearing the board" = `rm -rf news/.review`. Removal flow is **feed.md-only** (no ledger flips).

**`/news` rendering (rebuilt from MDX to a real parser+component)**
- `lib/news/parseFeed.ts` (NEW) — parses feed body → `[{date, entries:[{id,title,channel,published,durationMin,description,watchUrl,thumbUrl}]}]`.
- `app/(news)/_components/NewsFeedView.tsx` (NEW, client) — renders entries: **left** = thumbnail + meta row (date bottom-left, **duration pill** bottom-right; pill is an `<a>` that opens the video in a new tab); **right** = title/channel/description. Folds in **dead-simple edit mode**: each entry gets one "Remove" toggle → builds + copies a destructive "remove these from `news/feed.md`" prompt. Consumes `useNewsEdit()` (provider is in `app/(news)/layout.tsx`).
- **Deleted** `NewsContent.tsx` + `NewsEditableContent.tsx` (replaced). `page.tsx` now renders `<NewsFeedView content={feed.content} />`.
- `news.module.css` — new `.entry` grid, `.thumbMeta`/`.metaDate`/`.metaDur` (small pill, hover accent), `.removeBtn`, `.entryMarked`; pruned old `.prose p:has(img)` + all the downvote/ban/link edit-gutter rules + the mobile `.prose p:has(img)` rules.

**Data** — `news/feed.md` rebuilt: 9 entries under `## June 11, 2026` in the new `(date · N min)` format (4 Fable 5 + 5 loop-discourse videos). `news/.ledger.json` reset to those 9 `posted` records (+ `blockedChannels: n8n`, `blockedLinks`). `.gitignore` += `news/.review/`.

## Key decisions
- Review page is **file://**, self-contained, server-independent (deliberately — avoids the port/dev-server dependency).
- **Ledger is a record, not a gate**: signals shown in the review UI, never auto-filter. Only `blockedChannels`/`blockedLinks` are hard filters. PUBLISHED detection reads `feed.md`, not the ledger.
- Edit mode is purely destructive (build a remove prompt); dropped downvote/ban-channel/per-link/taste-tracking.
- Runs are **additive** onto one board until the user says "clear the review" (→ `rm -rf news/.review`).

## Outstanding work
- User will **test the skill fresh** (e.g. `/ai-news <new query>`) then say **commit**. On "commit": `git add -A`, thorough message, `git push` (per global workflow). Nothing else pending.
- Optional future cleanup (not requested): dormant link-extraction helpers in `yt-ai-news.py`; leftover generic `.prose` rules in `news.module.css`.

## Git state
- Branch `main`, **all uncommitted, not pushed**. Modified: SKILL.md, .gitignore, news.module.css, page.tsx, .ledger.json, feed.md, yt-ai-news.py (NewsContent.tsx + NewsEditableContent.tsx deleted). Untracked: `app/(news)/_components/NewsFeedView.tsx`, `lib/news/parseFeed.ts`.
- **`ai-news-refactor.md`** (untracked, repo root) is the **user's own** handoff doc — not part of this work; leave it / let the user decide whether to commit it.
