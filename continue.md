# Continue

## What was being worked on
Built **X Broadcast** — a local-only feature to post sticky notes to X (Twitter), plus a companion blog draft. Feature is complete and styled; nothing committed yet.

## Changes made so far (all uncommitted)
**Core lib (`lib/x/`):**
- `types.ts` — `XState` (`postsPerDay`, `posted[]`, `removed[]`, `order[]`), `XQueueItem`, `XPostedItem`, `NoteColor` (`warm|cool|neutral`), `X_CHAR_LIMIT = 280`.
- `state.ts` — `loadState`/`saveState` (reads/writes `x-state.json` at repo root), `postedToday(state)` UTC-day soft guard.
- `queue.ts` — `getQueue()` derives the queue from note files (all notes minus posted minus removed), **newest-first**, carries `color`, flags `overLimit`; `getPosted()` (newest-posted-first, content reattached); `nextPostable()`.
- `intent.ts` — `tweetIntentUrl(text)` → `https://x.com/intent/post?text=...` (X Web Intent; pure, client-safe).
- NOTE: there is **no** `client.ts` and **no** `twitter-api-v2` dep — both were added then removed during the API→Web Intent pivot.

**API:** `app/api/x/state/route.ts` — single dev-guarded route (404 when `NODE_ENV==='production'`, same pattern as `app/api/monono/reset`). GET returns `{state, queue, posted, postedToday}`; POST handles actions `markPosted | unpost | remove | restore | setPostsPerDay`.

**Admin UI (`app/x/`):** `page.tsx` (server, loads state) + `XAdmin.tsx` (client island) + `x.module.css`.
- Gated to localhost via `useIsLocal()` imported from `app/(news)/_components/NewsEditContext`.
- Queued + Posted sections; per-item char count with red over-limit flag; **Post** opens the X composer (`window.open`) and calls `markPosted`; **Remove** / **Undo** (unpost).
- Daily constraint segmented control: **1/day · 3/day · No limit** (0 = unlimited). Exceeding it shows an inline "Already posted today — Post anyway / Cancel" confirm (no native dialog).
- Dark mode cards: dark glass surface, light text, per-note color accent (left stripe + faint wash) — `warm`=#fbbf24, `cool`=#38bdf8, `neutral`=#a78bfa. Deterministic `formatDate` (no Date/locale) to avoid hydration mismatch.

**State file:** `x-state.json` (committed) — `{ postsPerDay:1, posted:[], removed:[], order:[] }`.

**Blog draft:** `blog/the-site-is-the-source.md` — author Josh Coolman, dated 2026-06-02. Thesis: the site is the source, X is a faucet you control; rate-limit-as-the-point; the API-overkill detour → Web Intent. Rough, to be refined later. No hero image (repo has no placeholder asset; cards render fine without one).

**Docs:** added "X broadcast" row to `CLAUDE.md` Feature Map; progress entry in `docs/01-progress.md`. Deliberately NOT in sitemap/llms/README (local-only tool, like sketches).

## Key decisions
- **Posting via X Web Intent, not the API.** X killed the free tier (Feb 2026, now pay-per-use ~$0.015/text post); more importantly Josh didn't want to register as a developer. Web Intent = no dev account, no OAuth, no cost, opens X's own composer to click Post. Tradeoff: can't read back tweet IDs, so "mark posted" is optimistic on click (Undo covers misfires).
- **Queue is derived, not captured** — writing a note auto-queues it; `/note` skill untouched.
- **Daily limit is a personal guardrail, not a hard cap** — confirm-and-override, configurable, can be off.
- **Local-only admin** is consistent with the repo ethos (no app auth, no DB); X is the first of possibly several broadcast channels for the "living site / personal brand."
- Leaderboard experiment (`app/design-experiments/(experiments)/leaderboard/`) was a **style reference only** — explored then fully reverted; do not change it.

## Outstanding work
- **Live verification not yet done:** Josh runs the dev server himself. Open `localhost:3000/x`, confirm queue (newest-first, colored dark cards), click Post → X composer opens prefilled → note moves to Posted; verify daily-limit confirm and `x-state.json` updates.
- Blog post refinement (currently a rough draft).
- Possible future: other broadcast channels, manual reorder UI (the `order` field exists, no drag UI yet), strict local-day vs UTC for the daily count.
- Not committed — Josh commits when he says so (workflow: `git add -A`, thorough message, `git push` to current branch).

## Git state
- Branch: `main`. All feature work is **uncommitted** (untracked: `app/api/x/`, `app/x/`, `lib/x/`, `blog/the-site-is-the-source.md`, `x-state.json`; modified: `CLAUDE.md`, `docs/01-progress.md`).
- `tsc --noEmit` clean; `npm run build` passes (`/x` static, `/api/x/state` dynamic).
- Plan file (planning artifact): `/Users/joshcoolman/.claude/plans/i-d-like-to-sort-rippling-key.md`.
