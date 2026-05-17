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

## Phase 0: Explore (If a Previous Experiment Is Referenced)

If the user mentions a previous experiment by name or description ("like X", "based on X", "we did X"), read it before asking anything or writing any code.

**Read in this order:**

1. `lib/experiments/data.ts` — confirm the slug and tags
2. `app/design-experiments/(experiments)/[slug]/page.tsx` (or the non-route-group path if it lives outside `(experiments)/`) — note font choices, hydration strategy (`dynamic` + `ssr: false`?), metadata
3. The styles file (`styles.css` or `page.module.css`) — extract the CSS custom properties; this is where the design palette lives
4. `types.ts` if present — understand the state shape
5. The root component in `components/` if the experiment has one — note the composition pattern and any animation approach

**What to extract:**
- Design tokens (colors, radius, spacing scale from CSS variables)
- Technical patterns worth carrying forward (state shape, animation hooks, control primitives)
- Anything reusable: hooks, leaf components, utility functions

**How to present:** One brief line before the sharpening questions — not a report. Something like:

```
I pulled up [X] — [design language note], [technical pattern note]. 
I'll carry those forward where they fit.
```

Then move straight to sharpening questions.

## Phase 1: Sharpening Questions

Before writing any spec or code, ask **1–2 targeted questions** to sharpen the brief. These are design-partner questions — they surface assumptions and often produce a more interesting experiment than the initial description alone.

Each question should include a recommended answer so the user can accept, redirect, or ignore:

```
Before I build — two quick questions:

1. What's the primary thing you want to *feel* when using this?
   → My read: [your interpretation of the intent].

2. [A second question specific to the brief's biggest open variable]
   → I'd go with [your recommendation] — [one-sentence reason].
```

Ask them all at once. Two questions max for simple experiments, three for complex ones.

**Skip sharpening questions if** the brief is already highly specific — exact layout described, exact interaction detailed, or the user says "just build it."

## Phase 1: Planning Gate (Complex Experiments Only)

After sharpening questions are answered, check for complexity signals:

- Calls an external API (Anthropic, OpenAI, any third-party)
- Real user input that drives meaningful branching
- Multi-component state (more than a single view)
- Data layer, even localStorage-backed persistence
- Keywords: "debate," "generate," "chat," "stream," "personas," "real-time"

**If any signal is present**, produce a spec block and wait for approval before writing code:

```
## Spec: [Experiment Name]

**What it does (user-facing):**
- [2-3 observable, verifiable behaviors]

**Components / modules:**
- [list — e.g. DebateArena, PersonaCard, TopicInput]

**AI contract (if applicable):**
- Model: claude-sonnet-4-6
- Prompt strategy: [one sentence]
- Output shape: [e.g. streaming text, JSON with { speaker, content }]

**Done criteria:**
1. [concrete, testable — something you can verify by clicking]
2. [another]
3. [another]
4. [reset / error / edge case]
```

Present the spec as a proposal, not a question. Wait for the user to approve or correct before building.

**If no complexity signals**, skip the spec and go straight to Steps.

## Steps

1. Create the experiment files at `app/design-experiments/(experiments)/[name]/`
2. Add entry to gallery at top of the experiments array in `lib/experiments/data.ts`:
   ```tsx
   {
     slug: '[name]',
     date: '[today in "Month Day, Year" format]',
     title: '[Title]',
     subtitle: '[one-sentence hook, ~10-15 words — shown on the home card under the title]',
     description: '[2-3 sentence description — shown on the gallery and experiment layout]',
     screenshot: '/screenshots/[name].png',
     tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4']
   }
   ```

   `subtitle` is the short editorial one-liner that sits below the title on the home page cards. Keep it tight — think magazine subhead, not feature list. `description` is the longer 2-3 sentence blurb that appears on the gallery and inside the experiment's layout wrapper.
3. Run `npm run build` to verify no errors
4. Do NOT run `npm run dev` -- user will start the server
5. Do NOT take screenshot or commit -- user will review first and use `/ship-experiment`

## Post-Build Check (Complex Experiments Only)

If a spec was produced in Phase 1, run a quick self-check against the done criteria before handing off:

```
Done criteria check:
✓ [criterion 1]
✓ [criterion 2]
✗ [criterion 3 — fix this before reporting done]
```

Fix any failures before telling the user it's ready.

## Design Quality Bar

- No generic AI aesthetics. Be opinionated.
- Use real content, not lorem ipsum.
- Generous whitespace. Let the design breathe.
- Mobile responsive. No single-column-only layouts on desktop.
- Load fonts via Google Fonts (avoid Montserrat, Roboto, Open Sans, Lato, Poppins, Inter as primaries -- dig deeper).
- Inline under 300 lines. Extract to `components/` when file exceeds 500 lines.
- AI integration: stream responses when possible; show a loading state; never block the UI waiting for a completion.

## Notes

- Screenshot will happen later via `/ship-experiment`
- README update happens via `/ship-experiment`
- The user will review the design before shipping
