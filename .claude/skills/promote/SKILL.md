---
name: promote
description: Refine a design experiment in place until it's importable by other parts of the app. Runs the full quality pipeline and adds a barrel export.
---

# promote

Make a design experiment importable. The experiment stays where it lives -- promote refines it in place and adds a public API so any page in the app can `import { Component } from '@/app/design-experiments/[name]'`.

## Usage

```
/promote contact-sheet
/promote crossfit-bento DonutChart
/promote day-at-a-glance
```

## What It Does

Assesses an experiment's current state, runs whatever pipeline passes are needed to make it production-grade, extracts components within the experiment directory, and creates a barrel export (`index.ts`).

## Reference: Sticky Notes Pattern

The sticky-notes experiment is the canonical example of a promoted experiment:

```
app/design-experiments/sticky-notes/
├── index.ts                    # Barrel: exports component, loader, types
├── page.tsx                    # Demo page (the experiment itself)
├── types.ts                    # Shared interfaces
├── loadNotes.ts                # Data loading utility
└── components/
    └── StickyNoteStack.tsx     # The reusable component
```

Consumer (blog page) imports directly from the experiment:
```tsx
import { StickyNoteStack, getAllNotes } from '@/app/design-experiments/sticky-notes'
```

The experiment is the component library. No relocation needed.

## Steps

### Step 0: Assess Readiness

Read all files in the experiment and evaluate its current state:

```
Contact Sheet Assessment:
  Structure:      Single page.tsx (200 lines) + global styles.css
  Components:     None extracted
  CSS Modules:    No
  Animations:     None
  Barrel export:  No index.ts
  TypeScript:     Has interfaces but some hacks

  Pipeline status (what still needs doing):
    CSS consistency  — global CSS, not yet audited for color/type drift
    Motion           — none (decide whether it benefits)
    TypeScript       — no CSS Modules, unresolved type issues
```

Based on this assessment, determine which pipeline passes are needed. Present the plan to the user.

### Readiness Levels

**Already refined** (e.g., CrossFit Bento after full pipeline):
- Components extracted with CSS Modules
- Animations wired up
- TypeScript clean
- Promote just needs to: design public API, add barrel export, done

**Partially refined** (e.g., experiment with extracted components but global CSS):
- Skip passes that are already done
- Run remaining passes (CSS Modules, TS cleanup)
- Add barrel export

**Raw experiment** (e.g., contact sheet -- single page.tsx + styles.css):
- Full pipeline needed during promotion
- Component extraction, CSS Modules, TS cleanup, optional animation
- This is the biggest lift but promote handles it

### Step 1: Component Extraction

If the experiment is still a monolithic page.tsx:

1. Identify the reusable core vs. page-level demo wrapper
2. Extract components into `components/` directory
3. Extract complex state/logic into custom hooks
4. Page.tsx becomes a thin demo that imports and composes the components

Guidelines for what becomes a component:
- Distinct UI regions with their own markup + styles
- Anything with its own state management
- Reusable pieces that a consumer would want independently

Keep it minimal -- don't over-extract. A 200-line page might only need 1-2 components pulled out.

### Step 2: CSS Modules

Convert global styles to per-component modules:
- Each component gets `ComponentName.module.css` with only its styles
- Page layout styles go in `page.module.css`
- Font imports stay in the page module
- Use camelCase class names
- If a component receives CSS class names as string props, change to semantic props (e.g., `color: string` instead of `className: 'bar-dark'`)

Skip this step if CSS Modules are already in place.

### Step 3: TypeScript Cleanup

Do a light TypeScript handoff pass:
- Props API clarity (does the component do what its types suggest?)
- Parser/transform safety
- Client/server boundary directives (`'use client'` where needed)
- Animation-specific checks (if motion is present)
- No `any`; export the public types

Skip this step if the TypeScript is already clean.

### Step 4: Animation (Optional)

Not every experiment needs animation. Suggest it only if:
- The experiment has visual elements that would benefit (charts, grids, lists)
- The user wants the promoted version to include motion

If yes, add motion directly:
- Card/section entrance stagger
- Component-specific animations (counters, draws, waves)
- Click-to-replay where appropriate

Skip if motion is already wired up, or if the experiment doesn't benefit from it.

### Step 5: Design Public API

This is promote's core unique job. Decide what gets exported:

- Which components are consumer-facing vs. internal?
- What props does a consumer need to pass?
- What data loading utilities should be exported?
- What types should be public?

Propose the API and ask for approval:

```tsx
// Proposed public API for contact-sheet:
export { ContactSheet } from './components/ContactSheet'
export type { ImageEntry } from './types'

// Consumer usage:
import { ContactSheet } from '@/app/design-experiments/contact-sheet'

<ContactSheet onSelect={(filenames) => console.log(filenames)} />
```

Keep the API minimal. Not every component in the experiment needs to be public -- only the ones a consumer would actually import.

### Step 6: Create Barrel Export

Create `index.ts` at the experiment root:

```tsx
// app/design-experiments/contact-sheet/index.ts
export { ContactSheet } from './components/ContactSheet'
export type { ImageEntry } from './types'
```

This is the public surface. Internal components, hooks, and utilities that consumers don't need stay unexported.

### Step 7: Verify

1. `npm run build` -- must pass clean
2. The experiment page still works identically (it's now a demo consumer)
3. The barrel export resolves correctly

Report what was done:
- Which pipeline passes were run
- Component structure (file tree)
- Public API (what's exported)
- Import example for consumers

Do NOT commit -- user will review first.

## Quality Bar

- **Importable**: Barrel export, clean public API
- **Self-contained**: CSS Modules, no global style leakage
- **Typed**: Explicit interfaces, exported types, no `any`
- **Composable**: Accept `className` prop on public components
- **Defaults**: Every optional prop has a sensible default

## Guidelines

- The experiment stays in `app/design-experiments/[name]/`. Nothing gets moved out.
- The experiment page is both the demo and the source of truth.
- Don't over-abstract. A consumer should be able to use the component with 1-2 props. More configuration can be added later.
- If the component needs data loading, export the loader separately (like `getAllNotes` in sticky-notes). Keep data fetching out of the component itself.
- One promotion at a time. If an experiment has multiple promotable components (like CrossFit Bento's chart widgets), promote one per invocation.
- Preserve the original visual design exactly. Promotion is a structural change, not a redesign.
- Run `npm run build` after every significant step, not just at the end.
