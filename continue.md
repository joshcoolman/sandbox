# Continue: Seismic Mesh shipped

## What was being worked on

Implemented the full CINEMATIC-SPEC.md for the water-mesh experiment, then renamed it to **seismic-mesh** and shipped it. All work lives in `app/design-experiments/(experiments)/seismic-mesh/` (page.tsx, styles.css, data/readout.ts, CINEMATIC-SPEC.md).

## Changes made so far

- **Cinematic state machine** in the raf loop (no timers for phases): plain click -> `rising` (~480ms Gaussian impulse) -> `frozen` (~2.6s, physics gated: no coupling/decay, `vz *= 0.5`) -> release -> existing linear-decay melt. Shift-click = quick dent, no cinematic.
- **Seismic wave**: render-Z-only gaussian-windowed cosine ring (`seismicWavesRef`), per-quake amp variation (±15%), faint leading-edge circle. Old `ringsRef` 2D blast rings deleted.
- **Topographic coloring**: 16-band precomputed LUT (`EDGE_COLORS`/`NODE_COLORS`/`NODE_RADII`, deep blue -> teal -> green -> yellow -> amber -> white) keyed off renderZ; edges/nodes batched one stroke/fill per band; frozen peak reads white-hot.
- **Telemetry overlay**: `data/readout.ts` `makeReadout(x,y,W,H)` derives magnitude/epicenter/elevation/radius/depth from click point (coordinate-seeded + random, client-only). DOM panel `.sm-readout` with staggered DecodeText; overlay `gen` counter guards stale fade timeouts so mid-cinematic clicks restart cleanly.
- **Epicenter marker**: canvas crosshair + pulsing ring, leader line draws out to panel over ~260ms; canvas and DOM agree via shared `panelPos()` — `PANEL_W`/`PANEL_H` constants in page.tsx must track `.sm-readout` CSS (252px wide, ~196px tall).
- **Entry animation gotcha**: panel mounts with `is-visible` already applied, so fade-in is a CSS `animation` (`sm-readout-in`), fade-out is the transition.
- **Rename**: folder, `SeismicMesh` component, CSS classes (`seismic-mesh-*`, `sm-*`), `lib/experiments/data.ts` entry, README.md, llms.txt, llms-full.txt. Old `public/screenshots/water-mesh.png` deleted; new `seismic-mesh.png` captured mid-freeze with overlay visible (agent-browser synthetic click + timed screenshot).
- **Fable 5 branding** (user asked twice — it matters to them): description opens "An experiment with the new Fable 5 model", tag `Canvas` -> `Fable 5`, and the card subtitle leads "A Fable 5 experiment — click to trigger a quake: ...".

## Key decisions

- `app/sketches/water-mesh/` is the old scratch predecessor — intentionally left untouched.
- All animation timing stays in the raf loop; React state only for the overlay DOM.
- Screenshot strategy for cinematic experiments: `agent-browser eval "window.dispatchEvent(new MouseEvent('click', {clientX, clientY}))"`, wait ~1700ms (freeze + decode), shoot. Composition B (click at 560,380) won.

## Outstanding work

- None pending. Optional polish never discussed in depth: sound, multi-quake interference.

## Git state

- Branch `main`, clean tree, all pushed: `6e1b5ab` (rename + cinematic), `b53cd65` (Fable 5 subtitle). Vercel deploy triggered — worth a quick look at the live URL.
