---
name: ship-experiment
description: Ship a design experiment with automated screenshot, data/README updates, git commit, and push. Triggers Vercel deploy.
---

# ship-experiment

Ship a design experiment with automated screenshot, updates, and commit workflow for Next.js sandbox.

## Usage

```
/ship-experiment
/ship-experiment "Custom commit message"
```

## What It Does

1. **Screenshot**: Capture a clean 1280x720 screenshot with agent-browser — confirm the dev server is up (don't start it), settle the page, check the dev-overlay issue count, hide the overlay, then shoot (see Screenshot below)
2. **Save screenshot**: To `public/screenshots/experiment-name.png`
3. **Update data**: Move experiment to top of the experiments array in `lib/experiments/data.ts`. This single file powers the gallery AND the home page's Recent Work grid (home auto-slices the first 6), so no separate homepage edit is needed.
4. **Update README**: Move experiment to top of README.md experiments list
5. **Commit**: All changes with descriptive message
6. **Push**: To GitHub (triggers Vercel deploy)

## Workflow

```bash
# From sandbox root directory

# 1. Take a clean screenshot
#    The USER runs the dev server — never `npm run dev` here. Confirm it's up:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000   # expect 200; if not, ask the user to start it
agent-browser open "http://localhost:3000/experiment-name" --viewport 1280x720
agent-browser wait 1500   # let content/animations settle; hover/click to a specific state if you want one
#    Check for a real bug before shipping it: the Next.js dev "Issue" badge is
#    almost always a hydration mismatch, NOT cosmetic (see Notes). If count > 0,
#    investigate the console and fix the cause rather than shipping it.
agent-browser eval "(() => { const sr=document.querySelector('nextjs-portal')?.shadowRoot; const t=sr&&sr.querySelector('[data-nextjs-toast]'); return t ? t.innerText.replace(/\s+/g,' ').trim() : 'none'; })()"
#    Hide the dev overlay so the badge never lands in the shot (production never shows it):
agent-browser eval "(() => { const s=document.createElement('style'); s.textContent='nextjs-portal{display:none!important}'; document.head.appendChild(s); })()"
agent-browser screenshot ./public/screenshots/experiment-name.png
#    View the saved PNG to confirm composition before committing.

# 2. Update lib/experiments/data.ts
#    Move this experiment's entry to the top of the `experiments` array
#    Update date to today's date
#    This single edit updates both the /design-experiments gallery AND the
#    home page Recent Work grid (home auto-slices the first 6 entries)

# 3. Update README.md
#    Move experiment section to top of list
#    Update date if needed
#    Two links per entry: View Live (absolute joshcoolman.com URL) and
#    View Code (GitHub source URL). The View Code path MUST match where the
#    experiment actually lives on disk — verify it:
ls -d app/design-experiments/experiment-name app/design-experiments/\(experiments\)/experiment-name 2>/dev/null
#    Most experiments live under (experiments)/ — that route-group segment is
#    part of the GitHub path and is the #1 source of broken View Code links.

# 4. Commit and push
git add -A
git commit -m "Update Experiment Name"
git push
```

## Deployment

- **Platform**: Vercel
- **Auto-deploys** on push to main branch
- **Live URL**: Check Vercel dashboard or README for current deployment URL

## Entry Format

The experiment's single source of truth is the `experiments` array in `lib/experiments/data.ts`. The gallery and the home page's Recent Work grid both consume this array — no separate homepage manifest exists.

```tsx
{
  slug: 'experiment-name',
  date: 'February 8, 2026',
  title: 'Experiment Name',
  subtitle: 'One-sentence hook shown on the home card under the title.',
  description: '2-3 sentence description shown on the gallery and experiment layout.',
  screenshot: '/screenshots/experiment-name.png',
  tags: ['Tag1', 'Tag2']
}
```

README.md entry — note the two-link footer with full URLs:
```markdown
[![Experiment Name](./public/screenshots/experiment-name.png)](/design-experiments/experiment-name)

One-to-three sentence description.

`Tag1` `Tag2`

**[View Live →](https://www.joshcoolman.com/design-experiments/experiment-name) | [View Code →](https://github.com/joshcoolman/sandbox/tree/main/app/design-experiments/(experiments)/experiment-name)**
```

The `(experiments)/` segment in the View Code URL is required only when the
experiment lives in that route group — confirm with the `ls` check in step 3
above before pasting. Getting this wrong 404s the link (this has happened).

## Requirements

- agent-browser skill must be available
- Dev server must already be running on localhost:3000 — the user starts it; do **not** run `npm run dev`. If :3000 isn't up, ask the user to start it.

## Notes

- Screenshot size: 1280x720 (16:9 aspect ratio)
- **Dev "Issue" badge = real bug, not cosmetic.** A non-zero count on `nextjs-portal`'s toast is usually a React hydration mismatch — commonly `Math.random()` / `Date.now()` in a `'use client'` experiment's initial render (it's still SSR'd). Fix the cause (seed a deterministic first frame, move randomness into `useEffect`), don't just hide it. Hiding the overlay is only to keep the badge out of the screenshot once the count is zero.
- Move experiment to top of both gallery and README (most recently updated first)
- Date should be today's date in format: "Month Day, Year"
- Routes are `/experiment-name` (no dated folders)
