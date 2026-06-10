# Continue: Seismic Mesh shipped + MeshCanvas home backdrop

Two major pieces this session, both committed and pushed on `main`.

## 1. Seismic Mesh experiment (shipped)

Implemented CINEMATIC-SPEC.md for the water-mesh experiment, renamed it **seismic-mesh**, shipped with screenshot. Lives in `app/design-experiments/(experiments)/seismic-mesh/`.

- Plain click cinematic: rise (~480ms) -> freeze (~2.6s, physics gated) -> ASCII telemetry panel (`data/readout.ts`, DecodeText, `.sm-readout`) -> release/melt. Shift-click = dent.
- Topo color LUT (blue->green->amber->white), render-only seismic wave, epicenter crosshair + leader line via shared `panelPos()` (PANEL_W/H must track CSS).
- Fable 5 branding everywhere (user asked repeatedly — it matters): card subtitle leads "A Fable 5 experiment", description opener, tag `Fable 5` (replaced `Canvas`). In data.ts, README, llms.txt, llms-full.txt.
- Screenshot trick: `agent-browser eval "window.dispatchEvent(new MouseEvent('click',{clientX,clientY}))"`, wait ~1700ms, shoot mid-freeze.

## 2. MeshCanvas home backdrop (new, swapped in)

`app/components/MeshCanvas.tsx` replaces NetworkCanvas on the home page. **NetworkCanvas.tsx kept untouched** — revert = flip the import in `app/page.tsx` (comment there notes this). Same `{ className }` prop interface.

Final tuned state (every quality = one named constant at top of file):
- Hex mesh `CELL_SIZE 84`, static jitter, overscanned to viewport **diagonal** (rotation must never expose corners)
- Interference swell: `swell()` = 3 low-frequency waves morphing, `SWELL_AMP 480`, `SWELL_SPEED 0.0007`
- Whole-field rotation `ROT_SPEED 0.0001` (~63s/rev) — user picked the "extreme" value deliberately and confirmed twice; do not quietly slow it
- Click = always a **depression** (no shift variant): `renderZ = -ambient + waveZ`, broad slow surge `WAVE_SIGMA 170`, `WAVE_SPEED 0.22`, `WAVE_K 0.006` (no rings), **`WAVE_ATTACK 700ms` smoothstep so there's no jump at click time**, ~5s dissipation
- All render-only, zero node physics; document-level click listener keeps cards clickable
- Warm palette preserved: edges `#B6A48F`, nodes `#C67E5E`, terrain-seeded base alpha, 12 batched alpha buckets

## Key decisions / lessons

- Tune-by-extremes workflow saved to memory (`feedback-tune-by-extremes.md`): crank a constant 2-4x so Josh can see it, then dial back.
- Click feel evolved: rapid ripple -> "slow surge in the same dialect as the ambient flow" -> depression-only with eased attack. The attack envelope was the fix for "sudden shift on click".
- Verification pattern: typecheck + build, then agent-browser zoomed margin crops (`magick -crop 280x600+0+100 -resize 300%`) to judge the subtle backdrop.

## Outstanding work

- None. Possible future: prefers-reduced-motion support for MeshCanvas (never discussed); parked DecodeText-on-homepage-cards idea in memory.

## Git state

Branch `main`, clean tree, all pushed: `6e1b5ab` (seismic-mesh), `b53cd65` (Fable 5 subtitle), `90c0927` (MeshCanvas backdrop). Vercel deploys on push.
