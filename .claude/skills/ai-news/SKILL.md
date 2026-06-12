---
name: ai-news
description: Fetch recent YouTube videos on any topic you steer it toward, render them as a fast interactive thumbnail page to skim and pick from, then add only the ones you keep to the running /news feed. Browse-first and disposable — curation happens visually, not in the terminal.
---

# ai-news

Rapid visual curation. A run does three things, fast: **fetch wide → render a throwaway interactive page → commit only what the user keeps.** No pre-curation, no dedupe, no quality gates — the user skims thumbnails and picks; you do the durable work only for the picks.

**You drive the search.** `scripts/yt-ai-news.py` is a fetch tool. You author queries from the user's steering (or a sensible default), call it **once** per run with the review-page flags, and open the page. Exploration is many cheap runs with different steering — not one heavy run that loops and curates internally. Keep each run a single fast shot.

## Usage

```
/ai-news                       # AI/ML, last 2 days (default)
/ai-news 3                     # leading integer → --days 3
/ai-news philosophy of mind    # freeform steering → drives the queries (any topic, not just AI/ML)
/ai-news 3 local LLM tooling   # days + steering combined
```

Interpret the argument:
- **empty** → default AI/ML run, 2 days.
- **leading integer** → that's `--days N`; the rest (if any) is the steering theme.
- **any other text** → the search theme. Drop the AI/ML assumption — it could be a topic, a creator, a tool, a genre. Author 4–8 queries around it. Pick `--order`: `viewCount` (default) for popular, `relevance` for niche themes, `date` for freshness.

## Requirements (keys)

Read from your shell environment or `.env.local` at the repo root (see `.env.local.example`):

- `YOUTUBE_API_KEY` — Google Cloud key with YouTube Data API v3 (discovery search + signal enrichment)
- `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` — OAuth 2.0 desktop client (reads your subscriptions)

First run opens a browser for one-time YouTube authorization (OAuth on `localhost:8080`); tokens cache at `~/.config/yt-ai-news/tokens.json`. `python3 scripts/yt-ai-news.py --reset-auth` clears them.

## Workflow

### 1. Fetch and render (one shot)

Author your queries from the steering, then run **once** from the repo root, writing both the interactive page and the candidate JSON, and open the page:

```
python3 scripts/yt-ai-news.py --days 2 "query one" "query two" "query three" \
  --html news/.review/index.html --out news/.review/candidates.json
open news/.review/index.html
```

Then **always report the clickable absolute path** so the user can reopen the page later without re-running (the path is constant — they can also just refresh that tab after a future run, or ask you to reopen it):

```
echo "Review ready → file://$(pwd)/news/.review/index.html"
```

- Subscriptions are always included unless `--no-subs`. Add as many discovery queries as the theme warrants (the script de-dupes within a run).
- The script casts **wide by default**: no Shorts filter, no language filter, no quality gating. It fetches, enriches with signals, sorts by velocity, and renders everything. Don't try to pre-curate in chat — that's the slow path you're replacing.
- Override flags exist if a run wants them: `--english-only`, `--min-seconds N`, `--order`, `--max N` (default 25/query), `--days N`.
- `news/.review/` is gitignored and disposable. `--out` writes the full records you'll need in step 3; `--html` writes the page.
- **Runs are additive.** Each run merges its results into the existing board (`news/.review/candidates.json`, dedup by id) and re-renders the page from the whole set — so several runs with different steering (e.g. AI, then `theory of mind`) accumulate onto one review page. Pass `--fresh` to start a clean board instead of merging.
- This step should be near-instant on your side: the script renders the page, so you're not hand-writing a digest. Just run it, `open` it, echo the clickable path, and tell the user it's ready to skim.

The ledger's `blockedChannels` / `blockedLinks` still apply (the script reads them) — those are deliberate denylists worth keeping. Nothing else about the ledger is consulted on a run: **no dedupe.** A video already in the feed can resurface; the user just won't re-pick it.

### 2. The user skims and picks

The page is a thumbnail grid with signal badges (velocity, views, subs, duration, like-ratio, source, and `channel_keep_rate` when known — all shown, none enforced), a Noise→Signal slider to thin lower-signal videos, and a text filter. Videos already in the feed show a PUBLISHED marker and aren't selectable. The user clicks a card to open the video, clicks its circle to keep it; a live "keep list" textarea builds up. They copy it and paste it back, or just tell you the picks in chat. Wait for that — don't act until they've chosen.

### 3. Commit only the keepers

Once you have the kept ids (from the pasted "Keep these…" list or chat), read `news/.review/candidates.json`, pull the full record for each kept id, and write **only those** to the feed:

Get today's date — never guess:

```
date +%F            # ISO, for the ledger (2026-06-11)
date "+%B %-d, %Y"  # long form, for the divider (June 11, 2026)
```

Prepend a today's section to `news/feed.md` (frontmatter `title: "AI News"`, then date sections). If today's `## <long date>` divider already exists, merge into it; otherwise add it directly under the frontmatter. For each kept video write one block — write a fresh one-line description of what the viewer actually learns/sees (this is where you add value; N is small, so it's cheap):

```
**[Title]** — [Channel] ([short date] · [N] min)
[One-sentence description]
[![](https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)](https://youtube.com/watch?v=VIDEO_ID)
```

The title line's parenthetical carries **two** things, `·`-separated: the video's short publish date and its duration — `[N] min` where `N = max(1, round(duration_sec / 60))` from the candidate. The `/news` page renders these as a small date-left / duration-right row under the thumbnail, so the format is load-bearing — keep the `(date · N min)` shape exactly.

No Resources/links section — extracted description links are mostly self-promo noise; anyone interested opens the video. Keep everything in one block (no blank lines inside it) so the entry trims as a unit. The only `##` headings in the file are date dividers — no theme groups.

**Already-published guard.** The review page reads `news/feed.md` and marks videos already in the feed as PUBLISHED and non-selectable, so they shouldn't appear in the keep list. Still, skip any kept id already present in `feed.md` rather than writing a duplicate block.

### 4. Log to the ledger

Append one record per **posted** video to `news/.ledger.json` (leave existing records untouched), copying the signals straight from the candidate record:

```json
{
  "id": "VIDEO_ID", "title": "...", "channel": "...", "channel_id": "UC...",
  "published": "YYYY-MM-DD", "source": "subscription", "firstSeen": "<today ISO>",
  "status": "posted",
  "signals": { "views": 0, "views_per_day": 0, "like_ratio": 0, "subs": 0, "duration_sec": 0, "age_hours_at_post": 0 }
}
```

Map the candidate's `age_hours` to `signals.age_hours_at_post`; use `null` for any signal the candidate lacked. The ledger is now a **record**, not a gate — it's not used to filter runs. Log only what posted.

Report how many videos you added.

## Clearing the board

Because runs accumulate, the user clears the board to start over. A `file://` page can't delete files, so the page's **"Clear picks"** button is selection-only (it just unchecks keeps). The destructive clear is a request to you: when the user says "clear the review" / "start fresh" / "wipe the board", delete the review artifacts so the next run starts clean:

```
rm -rf news/.review
```

(Equivalently, the next run can pass `--fresh` to overwrite instead of merge.)

## Removing items (the Edit button on /news)

The user trims the public feed in the browser via the Edit button on `/news`. It's deliberately dead-simple: they mark entries and it copies a destructive prompt naming the video blocks to drop. When you act on that prompt:

- Delete the named block(s) from `news/feed.md` (the bold title line, the description line, the thumbnail line).
- **If removing a block empties its `## <date>` section (no video blocks left under it), delete the date divider too** — don't leave a bare heading.

That's it — removal is **feed.md-only**. Don't touch the ledger: PUBLISHED detection reads `feed.md`, so a removed video automatically becomes selectable again on the next run. (The ledger stays the record of what was posted + the `blockedChannels`/`blockedLinks` denylists.)

## Rules

- One feed file (`news/feed.md`), one ledger (`news/.ledger.json`). Never recreate per-date files.
- `news/.review/` is temporary and gitignored — regenerate it freely, never commit it.
- One fast shot per run. Don't loop-and-curate in chat; that's the slowness being removed. To explore more, the user re-runs with new steering.
- Don't commit or push unless asked.
