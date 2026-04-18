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

1. **Screenshot**: Take 1280x720 screenshot of experiment with agent-browser
2. **Save screenshot**: To `public/screenshots/experiment-name.png`
3. **Update data**: Move experiment to top of the experiments array in `lib/experiments/data.ts`. This single file powers the gallery AND the home page's Recent Work grid (home auto-slices the first 6), so no separate homepage edit is needed.
4. **Update README**: Move experiment to top of README.md experiments list
5. **Commit**: All changes with descriptive message
6. **Push**: To GitHub (triggers Vercel deploy)

## Workflow

```bash
# From sandbox root directory

# 1. Start dev server and take screenshot
npm run dev &
sleep 3
agent-browser open "http://localhost:3000/experiment-name" --viewport 1280x720
agent-browser screenshot ./public/screenshots/experiment-name.png
# Close browser and stop server

# 2. Update lib/experiments/data.ts
#    Move this experiment's entry to the top of the `experiments` array
#    Update date to today's date
#    This single edit updates both the /design-experiments gallery AND the
#    home page Recent Work grid (home auto-slices the first 6 entries)

# 3. Update README.md
#    Move experiment section to top of list
#    Update date if needed
#    Ensure links point to /experiment-name

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

README.md — relative paths:
```markdown
[![Experiment Name](./public/screenshots/experiment-name.png)](/experiment-name)
**[View Live →](/experiment-name)**
```

## Requirements

- agent-browser skill must be available
- Dev server must be running on localhost:3000

## Notes

- Screenshot size: 1280x720 (16:9 aspect ratio)
- Move experiment to top of both gallery and README (most recently updated first)
- Date should be today's date in format: "Month Day, Year"
- Routes are `/experiment-name` (no dated folders)
