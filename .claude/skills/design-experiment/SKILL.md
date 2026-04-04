---
name: design-experiment
description: Create a new design experiment in the sandbox. Scaffolds the route, page.tsx, and styles.css for a self-contained frontend experiment.
---

# design-experiment

Create a new design experiment in the sandbox. Follow with a description of what to build.

## Usage

```
/design-experiment A typography specimen page showing variable font axes
/design-experiment Interactive color palette generator with OKLCH
```

## Structure

Experiments live inside the `(experiments)` route group to get the shared header/footer layout wrapper:

```
app/design-experiments/(experiments)/[name]/
├── page.tsx          # Main experiment (React component or iframe wrapper)
├── styles.css        # Scoped styles
├── components/       # Extract when page.tsx > 500 lines
├── hooks/            # Custom hooks if needed
└── data/             # Static data files if needed
```

The shared layout at `(experiments)/layout.tsx` auto-provides:
- Back link to gallery
- Experiment title, tags, date (pulled from `lib/experiments/data.ts`)
- Site footer

**Do NOT add your own header/footer/title/back-link** -- the wrapper handles it.

**Exception:** Fullscreen/immersive experiments (e.g., scroll-driven animations, z-index-heavy layouts) that conflict with the wrapper can live at `app/design-experiments/[name]/` directly, outside `(experiments)/`. Add a comment explaining why.

For static HTML experiments (no React/framework), put the HTML file in `public/[name].html` and create a thin iframe wrapper:

```tsx
"use client";
export default function Page() {
  return (
    <iframe
      src="/[name].html"
      style={{ width: "100%", height: "100vh", border: "none" }}
      title="Experiment Name"
    />
  );
}
```

## Steps

1. Create the experiment files at `app/design-experiments/(experiments)/[name]/`
2. Add entry to gallery at top of the experiments array in `lib/experiments/data.ts`:
   ```tsx
   {
     slug: '[name]',
     date: '[today in "Month Day, Year" format]',
     title: '[Title]',
     description: '[2-3 sentence description]',
     screenshot: '/screenshots/[name].png',
     tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4']
   }
   ```
3. Run `npm run build` to verify no errors
4. Do NOT run `npm run dev` -- user will start the server
5. Do NOT take screenshot or commit -- user will review first and use `/ship-experiment`

## Design Quality Bar

- No generic AI aesthetics. Be opinionated.
- Use real content, not lorem ipsum.
- Generous whitespace. Let the design breathe.
- Mobile responsive. No single-column-only layouts on desktop.
- Load fonts via Google Fonts (avoid Montserrat, Roboto, Open Sans, Lato, Poppins, Inter as primaries -- dig deeper).
- Inline under 300 lines. Extract to `components/` when file exceeds 500 lines.

## Notes

- Screenshot will happen later via `/ship-experiment`
- README update happens via `/ship-experiment`
- The user will review the design before shipping
