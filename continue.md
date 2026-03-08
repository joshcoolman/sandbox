Continuing work on the promoted "image-to-ui" experiment at `app/design-experiments/(experiments)/image-to-ui/`. Read all files in that directory and its `components/` folder to get up to speed.

## What this is

Interactive UI components reverse-engineered from video generation UI screenshots (Kling-style). Four components share design tokens, are composable, and now have a barrel export for use elsewhere in the app.

## Current file structure

```
app/design-experiments/(experiments)/image-to-ui/
  index.ts                    -- barrel export (public API)
  types.ts                    -- ModelTag, ModelItem, ModelSection interfaces
  tokens.css                  -- :root design tokens (--ui-primary: #ff8c2a orange)
  page.tsx                    -- demo page, two-column layout, MODEL_SECTIONS data
  page.module.css             -- page layout + param-toolbar styles
  components/
    RotarySelector.tsx         -- circular dial, radial labels, spring rotation
    RotarySelector.module.css
    DurationSlider.tsx         -- popover snap slider (3s-15s)
    DurationSlider.module.css
    ListSelector.tsx           -- popover dropdown with checkmark, optional badge
    ListSelector.module.css
    ModelSelector.tsx           -- two-level flyout, JSON-driven, viewport-aware
    ModelSelector.module.css
```

## Changes made this session

- **Promoted experiment**: converted global `styles.css` + styled-jsx to per-component CSS Modules
- Extracted shared types to `types.ts` (ModelTag, ModelItem, ModelSection)
- Design tokens isolated to `tokens.css` (previously in styles.css)
- Added `className` prop to all 4 components for composability
- Created barrel export `index.ts` re-exporting all components + types
- Updated RotarySelector demo labels: `Voiceover/Change Voice/Translate` -> `Standard/Pro/Turbo` (Kling 3.0 mode tiers)
- Deleted old `styles.css`

## Key decisions

- `--ui-primary` (#ff8c2a orange) is single brand color source; all accent tokens derive from it
- CSS Modules per component, design tokens stay global in `tokens.css`
- Page-level toolbar overrides component trigger styles via `button[aria-expanded]` selector in page.module.css
- RotarySelector labels themed to Kling 3.0 video generation context
- Kling 3.0 research done: key params are mode (std/pro), cfg_scale (0-1), duration, aspect_ratio, camera control (pan/dolly/crane), motion intensity (1-10), native audio toggle, frame rate (24/30/60fps)
- Consumer import path: `import { RotarySelector, ModelSelector } from '@/app/design-experiments/(experiments)/image-to-ui'`

## Outstanding / next session

- May want to `/ship-experiment` (screenshot, gallery entry, README)
- Could add more Kling-authentic parameters to demo (cfg_scale slider, camera motion dial)
- Keyboard navigation for ModelSelector not yet implemented
- No tests written (visual components, verify visually)

## Git state

Branch `main`, clean working tree. Latest commit: `09e7a85` "Promote image-to-ui experiment: CSS Modules, barrel export, themed labels". Pushed to remote.
