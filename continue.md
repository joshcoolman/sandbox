# Continue: two /news feature additions (plan only, not started)

**Full plan:** `/Users/joshcoolman/.claude/plans/the-skill-is-working-snug-cake.md` — read it first; it has
exact files, line numbers, and verification steps. This file is the quick orientation.

## What this is
Two improvements to the `/news` (AI News) route + the `/ai-news` skill. **Planning is complete; no
implementation has started.** All design decisions are settled. User wanted to do unrelated edits first,
then come back to implement this.

### Feature 1 — "Resources" chips pulled from YouTube descriptions
Surface a vetted set of links (GitHub repos, tools the video reviews, docs) under each video in the feed.
- **`scripts/yt-ai-news.py`**: the `videos.list` enrichment call (line ~292) already returns `snippet` but
  discards `snippet.description`. Capture it (internal use only — do NOT add full description to output;
  token bloat). Add `extract_links(description)` → list of `{url, label, kind}`. **Liberal extraction**
  (dev phase): regex all http(s) URLs, strip only self youtube/youtu.be links + tracking params
  (`utm_*`,`si`,`el`,`fbclid`,`ref`) + exact dupes; KEEP social/sponsor/newsletter for now so user can
  observe noise. `label`: github.com/owner/repo → `owner/repo`, else preceding-line text or bare domain.
  `kind`: `"github"` for repo URLs else `"other"`. Cap ~12. Attach as `v["links"]`.
- **`.claude/skills/ai-news/SKILL.md`**: step 3 — pass through essentially ALL candidate links (liberal).
  Step 4 block template gains an optional `Resources:` line (omit only if empty), inside the same `<p>`
  block (no blank line) so it trims with the video:
  ```
  **[Title]** — [Channel] ([date])
  [description]
  Resources: [label](url) · [label](url)
  [![](https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)](https://youtube.com/watch?v=VIDEO_ID)
  ```
- **`app/(news)/news.module.css`**: (a) FIX — scope absolute-positioning to the image anchor only or
  resource links stack on the thumbnail: `.prose p:has(img) a` → `a:has(img)` (line ~337), same for
  `.editing ... > a` (~397) and `p[data-deleted='true'] > a` + `::after` (~414/~419). (b) Style non-image
  anchors as **uniform chips** (decided — no GitHub accent in v1) via `.prose p:has(img) a:not(:has(img))`.

### Feature 2 — "Ignore this channel" in the edit flow
A second per-entry button in local edit mode that permanently bans a channel from future runs.
- **Decision: block FUTURE only** — does NOT remove current feed entries; user trashes visible ones
  separately via the existing trash button.
- **`news/.ledger.json`**: add top-level `blockedChannels: [{name, channelId?, since}]` alongside `videos`.
- **`scripts/yt-ai-news.py`**: read `news/.ledger.json` at startup (script doesn't touch it today), load
  `blockedChannels`, filter by name right after collection (pre-enrichment, saves quota) + by channelId
  post-enrichment. Print `Skipped N from blocked channels`.
- **`app/(news)/_components/NewsEditableContent.tsx`**: capture channel name per entry from
  `strong.nextSibling` text (strip `— ` prefix / ` (date)` suffix) → `p.dataset.channel`. Inject a second
  gutter button (ban icon) beside the trash button; toggled state on the BUTTON only (entry untouched).
  Extend `buildPrompt()` with a "Block these channels" section that ONLY adds channels to `blockedChannels`
  (no entry removal, no status flips). Also generalize the existing delete wording (line ~38) from
  "title/description/thumbnail line" to "its full entry block (all lines, incl. any Resources line)".
- **`app/(news)/news.module.css`**: add `.banBtn` (mirror `.trashBtn`, stack at `top: 65px` under trash at
  `top: 31px`; `min-height: 90px` has room) with a clear active/toggled state.

## Key facts learned
- Feed renders via MDXRemote (markdown→HTML); each video = one `<p>` with title/desc/thumbnail as
  soft-break lines. Edit mode (NewsEditableContent.tsx) finds `<p>`s containing an img, injects a trash
  button, builds a clipboard prompt for Claude to apply. Edit UI only shows on localhost.
- Full YouTube descriptions cost zero extra quota (already in the enrichment response).

## Git state
Branch `main`. Uncommitted: `news/feed.md` + `news/.ledger.json` (today's /ai-news run — 10 videos added),
untracked `public/blog/shad-1.jpg`. None of this plan's code is written yet. Nothing committed this session.

## Next step
When ready: implement per the plan file. Verify with `npm run build` + load `/news`, and run the script
to confirm `links` populate and `blockedChannels` filtering works (commands in the plan's Verification).
