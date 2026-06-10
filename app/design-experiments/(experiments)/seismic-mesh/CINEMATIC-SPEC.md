# Water-Mesh Seismic Cinematic — Implementation Spec

Target file: `app/design-experiments/(experiments)/water-mesh/page.tsx` (+ `styles.css`, + a small `data/readout.ts`).
Reuse, do not modify: `app/components/DecodeText.tsx`. Reference for the readout pattern: `app/design-experiments/(experiments)/slide-gallery/components/OperativeReadout.tsx` and its `op-*` CSS.
Preserve the existing aerial mesh, perspective projection, neighbor coupling, ambient ripple, and resize handling. This is additive.

## Intent

Turn the one-note click into a showpiece. Plain click = full cinematic at the click point: the mountain rises, a seismic ripple radiates outward through the mesh, the mountain freezes at peak while an ASCII telemetry overlay decodes in beside it, the data dwells, then both fade and the mountain releases back to flat. Shift-click stays a quick dent (impulse + ripple, no cinematic). Spines and nodes are colored topographically by live elevation, so the coloring shimmers as the ambient ripple and seismic crest travel through.

## 1. New refs & state

- `cinematicRef: { phase: 'rising' | 'frozen'; epX: number; epY: number; startTime: number } | null` — the active cinematic (null = idle / melting).
- `seismicWavesRef: { x: number; y: number; startTime: number }[]` — active traveling waves (replaces the role of the old `ringsRef`; you may delete `ringsRef` and the 2D ring drawing).
- React state `overlay: { x: number; y: number; data: Readout; visible: boolean } | null` — drives the ASCII overlay DOM. Only the overlay needs React; all animation/timing lives in the raf loop and refs.

## 2. Constants (tune to taste)

```
const RISE_MS = 480;      // impulse climb before the freeze grabs it
const FREEZE_MS = 2600;   // hold at peak while telemetry decodes + dwells
// release = clear cinematic → existing Z_LINEAR_DECAY melts it back

const SEISMIC_SPEED = 0.9;   // px/ms — ring front expansion
const SEISMIC_AMP = 90;      // render-Z units at the crest (~4% of CAM_Z)
const SEISMIC_SIGMA = 70;    // px — gaussian half-width of the moving ring
const SEISMIC_K = 0.035;     // rad/px — oscillation density inside the ring (a few ripples)
const SEISMIC_LIFETIME = 2600; // ms — wave fully decayed by here

const ELEV_BANDS = 16;       // topographic color/alpha quantization
```

## 3. Interaction (replace `handleClick`)

On pointer click:
- Compute the same Gaussian extrude impulse currently applied (normal click force `-BLAST_FORCE`; **shift-click keeps the dent** `BLAST_FORCE * 3`).
- Always push a seismic wave: `seismicWavesRef.current.push({ x: e.clientX, y: e.clientY, startTime: performance.now() })`.
- **Plain click only** (not shift): start/restart the cinematic — `cinematicRef.current = { phase: 'rising', epX: e.clientX, epY: e.clientY, startTime: performance.now() }`, and clear any existing overlay (`setOverlay(null)`) so an in-progress cinematic is interrupted cleanly.
- Shift-click does NOT start a cinematic (quick dent + ripple only).

## 4. Cinematic state machine (inside the raf `draw(timestamp)` loop)

Drive transitions off `performance.now()` / `timestamp` so it stays in the animation loop (no timers):
- **rising → frozen** when `elapsed >= RISE_MS`: set `phase = 'frozen'`, reset `startTime = now`, and mount the overlay: build `data = makeReadout(epX, epY, W, H)` and `setOverlay({ x: epX, y: epY, data, visible: true })`.
- **frozen → idle** when `elapsed >= FREEZE_MS`: `cinematicRef.current = null`; start the overlay fade with `setOverlay(o => o && { ...o, visible: false })`.
- Overlay unmount: after the CSS fade (~450ms) set `setOverlay(null)`. Simplest robust approach: when `visible` flips false, schedule a single `setTimeout(() => setOverlay(null), 450)`; guard against an interrupting click having already replaced it.

## 5. Freeze the physics (in the Z integrate loop)

Current loop applies neighbor coupling, then per-node `Z_LINEAR_DECAY` + damping + clamp. Gate it on the cinematic phase:
- When `cinematicRef.current?.phase === 'frozen'`: **skip neighbor coupling and skip `Z_LINEAR_DECAY`** for the whole mesh; instead hard-damp velocity (`node.vz *= 0.5; node.z += node.vz`) and do NOT zero-out small z. The Gaussian mountain from the rise holds in place.
- `'rising'` and idle/melting: unchanged physics (rise, then existing decay melts it).
- Net effect: rise (~480ms) → hold (~2.6s) → release → melt (~existing decay). Ambient ripple + seismic are render-only, so the surface keeps shimmering even while frozen.

## 6. Seismic wave (render-Z, in the projection loop)

Today each node's render Z = `node.z + ambientRipple`. Add the seismic contribution, then use the combined value for BOTH the perspective scale AND the color (§7):

```
const tms = timestamp;
// cull dead waves once per frame: keep age < SEISMIC_LIFETIME
let waveZ = 0;
for (const w of seismicWavesRef.current) {
  const age = tms - w.startTime;
  const front = age * SEISMIC_SPEED;          // ring radius (px)
  const dx = node.x - w.x, dy = node.y - w.y;
  const d = Math.hypot(dx, dy);
  const phase = d - front;                    // 0 at the ring front
  const ring = Math.exp(-(phase*phase)/(2*SEISMIC_SIGMA*SEISMIC_SIGMA));
  const env = Math.max(0, 1 - age / SEISMIC_LIFETIME);
  waveZ += SEISMIC_AMP * ring * Math.cos(phase * SEISMIC_K) * env;
}
const renderZ = node.z + ambientRipple + waveZ;
const scale = CAM_Z / (CAM_Z + renderZ);
```

A gaussian-windowed cosine gives a clean expanding swell with a couple of trailing ripples that fade out — the "seismic ripple that goes out and goes away." Cull waves where `age >= SEISMIC_LIFETIME`. Delete the old 2D `ringsRef` stroke; the mesh wave is the feedback now. (Optional: keep a single faint leading-edge circle stroke if it reads better — author's call.)

## 7. Topographic coloring (spines + nodes)

Define a per-node elevation in [0,1] from static terrain + live displacement, so there's topo color at rest that brightens to white-hot at the frozen peak:

```
// heights[i] is the static terrain field in ~[-1,1]; renderZ negative = toward camera = high
const elev = clamp01( 0.5 + heights[i]*0.28 + (-renderZ / CAM_Z)*0.9 );
```

Build a topographic LUT of `ELEV_BANDS` precomputed `rgba` strings by interpolating these stops (low→high):

```
0.00 #0a1a3a   (deep blue)
0.28 #11507a   (blue-teal)
0.50 #1f8a4c   (green)
0.70 #c9c23a   (yellow)
0.86 #d98a2b   (amber)
1.00 #f5f5f0   (white)
```

Alpha rises with elevation too (e.g. `0.22 + elev*0.7`) to keep the depth cue. Quantize `elev` into a band index → that band's color+alpha.
- **Edges:** band = average of the two endpoints' elevation. Keep the existing batch-by-band stroke approach (one `beginPath`/`stroke` per band, ~16 bands) so perf matches today's alpha buckets — just key buckets on the elevation band and use the LUT color instead of gray.
- **Nodes:** color by the node's own band; let radius grow slightly with elevation (`r = 0.8 + elev*1.8`) so the frozen mountain's nodes swell.

Because elevation uses `renderZ`, the ambient ripple and the seismic crest paint a moving band of color across the surface for free.

## 8. ASCII telemetry overlay

New module `data/readout.ts`:

```
export type Readout = { title: string; magnitude: string; rows: {k:string;v:string}[]; ref: string };
export function makeReadout(x: number, y: number, W: number, H: number): Readout
```

Derive plausible seismic/terrain telemetry from the click coords (deterministic-ish so it feels real; `Math.random` is fine here — the overlay only mounts client-side on click, never in SSR, so no hydration concern). Suggested content:
- title `SEISMIC EVENT` · magnitude e.g. `M ${(4.8 + ...).toFixed(1)}`
- rows: `ELEVATION +N,NNN M`, `EPICENTER {lat from y}N {lon from x}W`, `RADIUS N.N KM`, `DEPTH N.N KM`, `STATUS HOLDING`
- ref hex like the operatives: `REF 0x….`

Render it like `OperativeReadout`: a `wm-readout` panel with staggered `DecodeText` lines (`import { DecodeText } from '@/app/components/DecodeText'`), `aria-hidden`. Stagger title→rows→ref with increasing `delay` (mirror `ROW_BASE`/`ROW_STEP`). Position the panel anchored to `(overlay.x, overlay.y)` with an offset, **clamped to the viewport** (tooltip-style) so it never clips off-screen. Fade in/out via a `.is-visible` opacity+translate transition (~450ms) toggled by `overlay.visible`.

JSX (inside `.water-mesh-container`, above the canvas in z-order):

```
{overlay && (
  <div className={`wm-readout ${overlay.visible ? 'is-visible' : ''}`}
       style={{ left: clampedX, top: clampedY }} aria-hidden="true">
    <div className="wm-readout-title"><DecodeText text={overlay.data.title} delay={120} /></div>
    <div className="wm-readout-mag"><DecodeText text={overlay.data.magnitude} delay={260} /></div>
    {overlay.data.rows.map((r,i) => ( …two DecodeText spans, delay 420 + i*100… ))}
    <div className="wm-readout-ref"><DecodeText text={overlay.data.ref} delay={…} /></div>
  </div>
)}
```

## 9. styles.css additions

Add `wm-readout` styles: absolutely positioned, monospace, uppercase, tight `letter-spacing`, faint translucent backdrop / thin border consistent with the dark `#050505` ground, small key/value rows. Default `opacity:0; transform: translateY(6px)`, `.is-visible { opacity:1; transform:none }`, `transition: opacity .45s, transform .45s`. `pointer-events:none`. Borrow proportions from the slide-gallery `op-*` rules. Keep the existing container/canvas rules.

## 10. Constraints / gotchas

- Keep the raf loop the single source of animation timing; React state only for the overlay DOM. `setOverlay` identity is stable, safe to call from the loop.
- One cinematic at a time: a new plain click during `rising`/`frozen` must reset `cinematicRef` and `overlay` to the new epicenter.
- Don't reintroduce SSR `Math.random` in the mesh build or initial render — only inside `makeReadout` (client-only on click).
- Perf: keep edge/node drawing batched by band (one stroke per band). Seismic loop is `waves × nodes`, waves are few — fine.
- Respect `MESH_PADDING_TOP` header clearance and resize rebuild as-is.

## Files

- `app/design-experiments/(experiments)/water-mesh/page.tsx` — refs/state, click handler, cinematic state machine, freeze gate, seismic render-Z, topo LUT + banded draw, overlay JSX.
- `app/design-experiments/(experiments)/water-mesh/styles.css` — `wm-readout` panel + transitions.
- `app/design-experiments/(experiments)/water-mesh/data/readout.ts` — `makeReadout` + `Readout` type.
- Reused unchanged: `app/components/DecodeText.tsx`.

## Verification

- `npm run typecheck` then `npm run build` succeed (per repo pre-push gate).
- `npm run dev`, open `/design-experiments/water-mesh`:
  - Plain click → mountain rises, seismic ripple radiates and fades, mountain freezes ~2.6s while ASCII telemetry decodes in beside the click, data dwells, both fade, mountain melts back.
  - A second click mid-cinematic restarts cleanly at the new spot.
  - Shift-click → quick dent + ripple, no overlay.
  - Surface shows topographic color (blue→green→yellow→white) that shimmers with ambient ripple and rides the seismic crest; frozen peak reads white-hot.
  - No hydration "Issue" badge in dev.
- Optionally `/ship-experiment` to refresh the gallery screenshot + README.
