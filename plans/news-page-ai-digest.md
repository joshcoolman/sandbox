---
title: joshcoolman.com/news — Daily AI Video Digest
description: Automate the /ai-news skill into a daily-updating page with a sidebar of past summaries, driven by GitHub Actions + Anthropic SDK.
status: ready
---

<Callout type="tldr">
GitHub Actions runs daily, calls yt-ai-news.py → Claude → saves a markdown file → pushes → Vercel deploys → /news shows the latest digest with a dated sidebar.
</Callout>

## Context

The `/ai-news` command already works great locally: it calls `~/scripts/yt-ai-news.py` to fetch recent AI videos from YouTube subscriptions + discovery searches, then Claude curates them into a digest. The goal is to automate that entirely so `joshcoolman.com/news` stays fresh without any manual step.

The sandbox app is Next.js App Router, file-based markdown content (no DB), deploys to Vercel on push. The pattern for adding a new content section is well-established (`blog`, `docs`, `plans`).

---

## Auth

**Locally** — nothing new needed. `~/.config/yt-ai-news/tokens.json` + existing env vars handle it.

**In GitHub Actions** — `yt-ai-news.py` currently bootstraps from a token file, not env vars. A small patch lets it accept `YOUTUBE_REFRESH_TOKEN` as an env var and write the token file itself before the normal refresh flow runs. Required GitHub secrets:

| Secret | Value |
|--------|-------|
| `YOUTUBE_API_KEY` | existing env var value |
| `YOUTUBE_CLIENT_ID` | existing env var value |
| `YOUTUBE_CLIENT_SECRET` | existing env var value |
| `YOUTUBE_REFRESH_TOKEN` | `refresh_token` field from `~/.config/yt-ai-news/tokens.json` |
| `ANTHROPIC_API_KEY` | your Anthropic key |

<Callout type="caveat" title="Refresh token longevity">
Google refresh tokens for read-only YouTube scopes don't expire unless revoked or unused for 6+ months. The secret should stay valid indefinitely with daily use.
</Callout>

---

## Architecture

```
GitHub Actions (daily cron, 8am UTC)
  ├── python3 scripts/yt-ai-news.py     # fetch raw video JSON
  └── node scripts/generate-news.mjs   # curate via Claude SDK → save news/YYYY-MM-DD.md
       ↓
  git commit + push
       ↓
  Vercel auto-deploys
       ↓
  /news  →  latest digest + sidebar of past summaries
```

---

## Files to Create / Modify

### `scripts/yt-ai-news.py` — copy into repo + CI patch

Copy `~/scripts/yt-ai-news.py` into the sandbox repo at `scripts/yt-ai-news.py`. Add ~10 lines near the top of `get_access_token()`: if `YOUTUBE_REFRESH_TOKEN` env var is set and no token file exists, write a synthetic `tokens.json` (expired access token + the refresh token) so the normal refresh flow picks it up. No behavior change when the token file already exists.

### `scripts/generate-news.mjs` — new

Node.js script using `@anthropic-ai/sdk`. Reads raw JSON from stdin or `$INPUT` path, sends to `claude-sonnet-4-6` with the curation prompt (same rules as the local `/ai-news` command — keep technical deep-dives/tutorials/announcements, skip clickbait/non-English/affiliate), requests markdown output, writes to `news/YYYY-MM-DD.md` with frontmatter:

```markdown
---
title: "AI News — May 19, 2026"
date: 2026-05-19
videoCount: 11
---
[curated digest grouped by theme]
```

Use prompt caching on the system prompt (the curation rules are static — good cache candidate).

### `.github/workflows/daily-news.yml` — new

```yaml
on:
  schedule: [cron: '0 8 * * *']   # 8am UTC
  workflow_dispatch:               # manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5  # 3.11
      - uses: actions/setup-node@v4    # 20
      - run: pip install requests
      - run: npm ci
      - run: python3 scripts/yt-ai-news.py > /tmp/videos.json
        env: [YOUTUBE_* from secrets]
      - run: node scripts/generate-news.mjs
        env: ANTHROPIC_API_KEY, INPUT=/tmp/videos.json
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add news/
          git diff --cached --quiet || git commit -m "news: $(date +%Y-%m-%d)" && git push
```

### `news/` directory — new

Markdown files: `news/2026-05-19.md`, `news/2026-05-18.md`, etc. Add `.gitkeep` initially. The first real file gets committed by the workflow.

### `lib/news/types.ts` — new

```typescript
export type NewsSummary = {
  slug: string        // "2026-05-19"
  date: string
  title: string
  videoCount: number
  content: string
}
```

### `lib/news/loadNews.ts` — new

Follows `lib/blog/loadBlog.ts` pattern exactly (uses `gray-matter`, `fs`, React `cache()`):
- `getAllSummaries()` — reads `news/*.md`, parses frontmatter, sorts date desc
- `getSummaryByDate(date: string)` — reads single file

### `app/news/layout.tsx` — new

Sidebar layout. Sidebar lists all past dates as nav links (`/news/2026-05-19`, etc.). Follows `app/(docs)` pattern. No entry in the main nav — just discoverable at `/news`.

### `app/news/page.tsx` — new

Server component. Loads `getAllSummaries()[0]` (latest). Renders full digest content + sidebar. Metadata: `title: "AI News"`, `description: "Daily curated AI video digest"`.

### `app/news/[date]/page.tsx` — new

Dynamic route. `generateStaticParams()` returns all date slugs. Renders single digest with `MDXRemote` (reuse the blog rendering chain: remark-gfm, rehype-slug).

### `app/sitemap.ts` — update

Add `/news` to `staticRoutes`. Dynamically add all `/news/[date]` routes from `getAllSummaries()`.

### `public/llms.txt` — update

Add: `news: daily curated AI video digest, auto-generated`

---

## Repo-Specific `/ai-news` Skill (optional)

Create `.claude/skills/ai-news/SKILL.md` in sandbox — identical curation rules as `~/.claude/commands/ai-news.md` but references `python3 scripts/yt-ai-news.py` (repo-relative path). Useful when running Claude Code from inside the sandbox repo so you don't need the global command. Also opens the door to adding "save this digest to news/" as an extra step.

---

## Verification

1. `node scripts/generate-news.mjs` with a sample JSON → check `news/YYYY-MM-DD.md` created with correct frontmatter
2. `npm run dev` → `localhost:3000/news` → latest digest renders, sidebar shows all past dates
3. `npm run build` → no type errors, all `/news/[date]` routes statically generated
4. Manual `workflow_dispatch` trigger on GitHub → Actions log passes, new commit appears on main
5. Vercel preview URL shows `/news` updated with new content
