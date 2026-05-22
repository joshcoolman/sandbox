---
name: yt-review
description: Reviews recent YouTube watch history in an interactive in-browser overlay and batch-adds the selected videos to the Link Worthy (recommended) page. Use when the user runs /yt-review or asks to review their YouTube history, pick watched videos to save, or bulk-add recommended links from what they watched.
---

# yt-review

Bring up an in-browser checklist of today's YouTube watch history, let the user toggle the videos worth keeping, then batch-create Link Worthy entries from the picks. Drives the user's logged-in Chrome via the claude-in-chrome tools; reuses the `/link` file format.

## Usage

```
/yt-review
```

No arguments. The whole point is minimal prompting — on invocation, bring up the UI without asking the user to describe anything.

## Steps

1. **Connect to Chrome.** Load the browser tools with `ToolSearch` (`select:mcp__claude-in-chrome__tabs_context_mcp,...navigate,...javascript_tool,...select_browser`). Call `tabs_context_mcp` with `createIfEmpty: true`. If multiple browsers are connected, ask the user which one (list each as an option), then `select_browser`. Otherwise proceed.
2. **Open history.** `navigate` the MCP tab to `https://www.youtube.com/feed/history`.
3. **Inject the overlay.** Read `overlay.js` from this skill folder and run its contents via `javascript_tool`. It scrapes today's items (title, video id, watched-%, channel) and renders the dark full-screen checklist (thumbnail + title + `channel · NN% watched`, checkboxes default-off). Expect a `overlay ready with N rows` return.
4. **Hand off.** Tell the user: toggle the ones worth saving (click / Space / arrows), then type "done" in chat. Do NOT poll — just wait for their next message.
5. **Read the selection.** When the user says done, run `read-selection.js` via `javascript_tool`. It returns `{ locked, count, picks:[{id,title,watched,channel}] }` — ids, not URLs.
6. **Dedup.** For each pick, the link URL is `https://www.youtube.com/watch?v=<id>`. Skip any whose `v=<id>` already appears in an existing file under `app/(blog)/recommended/items/` (grep the id). Report what you're skipping.
7. **Confirm + create.** Show the net-new list and confirm before writing. For each: derive a slug from the video title (first 3-5 words, lowercased, hyphenated, punctuation stripped), filename `YYYY-MM-DD-slug.md` (append `-2` on collision), today's date from `date +"%Y-%m-%d"`. Write YouTube frontmatter only — no comment body:

   ```markdown
   ---
   url: https://www.youtube.com/watch?v=<id>
   date: YYYY-MM-DD
   ---
   ```

8. **Build once, ship once.** Run a single `npm run build` (fetches thumbnails for all new items), then one `git add` + commit + `git push origin main` for the whole batch.

## Notes

- Scope is **Today** only. The history page goes back further, but multi-day was deliberately left out — keep it simple.
- This is scrape-based. The selectors (`MetadataViewModelTitle`, `WatchedProgressBarSegment`, `yt-content-metadata-view-model`) will need updating when YouTube reshuffles its DOM. Both `.js` files are standalone and editable.
- No live wire and no polling — Claude only reads the page when the user gives a turn. The "Lock in" button is just an affordance; `read-selection.js` reads ✓ state from the DOM either way. The user typing "done" is the real signal.
- Never inject via `innerHTML` — YouTube enforces Trusted Types. Build DOM with `createElement` / `textContent` (overlay.js already does).
- YouTube's output filter blocks raw `?v=` URLs in `javascript_tool` returns — that's why the scripts return bare video ids.
- Don't second-guess a pick because its watched-% is low — the percentage is context for the user, not a filter. Surface it, act on the selection. Still skip genuine duplicates.
```
