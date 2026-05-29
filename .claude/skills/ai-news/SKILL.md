---
name: ai-news
description: Search YouTube for recent, popular, vetted AI/ML videos using queries you author, then prepend the net-new ones to the running /news feed. Run this command, drive the search yourself with quality signals, present a curated digest, and log results to the ledger.
---

# ai-news

Find recent AI/ML videos worth watching and prepend the net-new ones to the single running `/news` feed (`news/feed.md`) under today's date.

**You drive the search.** `scripts/yt-ai-news.py` is a fetch tool, not a fixed pipeline — you decide what to search for and call it as many times as a good run needs. It returns quality signals (views, view velocity, like ratio, subscriber count, duration, language) so you vet for *popular and legitimate* instead of trusting raw search order. The feed is one long page split by date dividers; you over-collect from vetted results, the user trims locally with the Edit button on `/news`.

## Usage

```
/ai-news        # last 2 days (default)
/ai-news 3      # last 3 days  → pass --days 3
```

## Requirements (keys)

Read from your shell environment or `.env.local` at the repo root (see `.env.local.example`):

- `YOUTUBE_API_KEY` — Google Cloud key with YouTube Data API v3 (discovery search + signal enrichment)
- `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` — OAuth 2.0 desktop client (reads your subscriptions)

First run opens a browser for one-time YouTube authorization (OAuth on `localhost:8080`); tokens cache at `~/.config/yt-ai-news/tokens.json`. `python3 scripts/yt-ai-news.py --reset-auth` clears them.

## Workflow

### 1. Read the ledger

Read `news/.ledger.json` (`{videos:[{id,title,channel,...,status}]}`) — it does double duty:

- **Dedupe set:** collect every `id` (status `posted` *or* `deleted`). Anything already there is dropped later. This is what makes re-runs safe — trashed noise never resurfaces, nothing double-posts.
- **Taste signal:** look at what's `posted` vs `deleted`. The channels and topics the user keeps tell you what to hunt for; the ones they delete tell you what to avoid. Let this shape your queries.

### 2. Author queries and fetch

Decide what to search for — don't use a canned list. Aim queries at *substantive* content (specific tools, techniques, papers, model releases, named channels the user keeps), not generic phrasings like "AI video tutorial" that dredge up faceless-automation slop. Then run from the repo root:

```
python3 scripts/yt-ai-news.py --days 2 "query one" "query two" "query three" ...
```

- Subscriptions are always included (unless `--no-subs`). Add as many discovery queries as the run warrants.
- `--order viewCount` (default) biases toward already-popular hits; use `--order date` for freshness or `--order relevance` for on-topic.
- Each search is ~100 API-quota units (enrichment is ~free) against a 10k/day budget — dozens of searches/day is fine.
- **Iterate.** If a pass comes back thin or junky, refine the queries and run again. This is the whole point of the tool being in your hands.

Output is a JSON array sorted by `views_per_day`, each video carrying: `id`, `title`, `channel`, `published`, `description`, `url`, `source`, `query`, and the signals `views`, `likes`, `comments`, `views_per_day`, `like_ratio`, `subs`, `duration_sec`, `language`, `age_hours`. Shorts (<90s) and non-English are pre-dropped.

### 3. Vet on signals, then curate generously

Drop everything already in the ledger (step 1). From what remains, vet for **popular and legitimate**, then keep broadly:

- **Momentum** — `views_per_day` (velocity, not raw views — raw views punish recent videos). High velocity = real traction.
- **Genuineness** — `like_ratio` (healthy ratio separates organic interest from inflated views).
- **Credibility/context** — `subs` puts views in proportion (12k views from a 4k-sub channel beats 12k from a 3M-sub channel).
- **Shape** — skip multi-hour livestreams unless clearly valuable; Shorts are already gone.
- **AI-slop heuristic** — the API can't flag synthetic content, so watch for brand-new tiny-sub channels + generic titles + robotic descriptions, and lean on the ledger (down-weight channels the user has deleted).

You're vetting for legitimacy, not taste — once a video clears the signal bar, keep it; the user does the fine trim. Present the kept list in chat, newest first, flat (no themes):

```
**[Title]** — [Channel] ([short date])
[One-sentence description of what you actually learn or see]
[url]
```

If after dedupe + vetting there's nothing solid, say so — don't pad.

### 4. Prepend to the feed

Get today's date — never guess:

```
date +%F            # ISO, for the ledger (2026-05-28)
date "+%B %-d, %Y"  # long form, for the divider (May 28, 2026)
```

Edit `news/feed.md` (frontmatter `title: "AI News"` then date sections). **Prepend today's section** directly under the frontmatter:

- No `## <long date>` divider for today yet → add one, then the videos.
- Today's divider already exists (same-day re-run) → merge the new videos into it.

Each block uses a thumbnail link (`VIDEO_ID` = the `id` field):

```
**[Title]** — [Channel] ([short date])
[One-sentence description]
[![](https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)](https://youtube.com/watch?v=VIDEO_ID)
```

The only `##` headings in the file are date dividers — no theme groups.

### 5. Log to the ledger

Append one record per **posted** video to `news/.ledger.json` (leave existing records untouched):

```json
{ "id": "VIDEO_ID", "title": "...", "channel": "...", "published": "YYYY-MM-DD", "source": "subscription", "firstSeen": "<today ISO>", "status": "posted" }
```

Don't log videos you vetted out — only what posted. The user trims the feed later via the Edit button, which produces a prompt that removes blocks from `feed.md` and flips ids to `status: "deleted"`. **Deletes are the gold signal** — over time the ledger steers both your queries (step 1) and your vetting.

After writing, report how many net-new videos you added and how many were skipped as already-seen.

## Rules

- Don't commit or push unless asked.
- One feed file (`news/feed.md`), one ledger (`news/.ledger.json`). Never recreate per-date files.
- Always dedupe against the ledger before posting. Never re-post a video already recorded, deleted or not.
- Drive the search — author queries, vet on signals, iterate. Never fall back to a fixed query list.
