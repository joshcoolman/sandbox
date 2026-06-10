# Continue: Step Sequencer v2 — three-layer techno groovebox

Previous continue.md (Seismic Mesh / MeshCanvas) is fully committed and shipped — superseded.

## What was being worked on

Upgrading `app/design-experiments/(experiments)/step-sequencer/` from a 16×8 pentatonic toy to a 16×11 three-layer groovebox: better techno generation, real synthesis, layer mutes, tone switches, swing, and a pre-seeded pattern on load. Plan approved via plan mode (saved at `~/.claude/plans/app-design-experiments-experiments-step-sprightly-cupcake.md`).

## Changes made (all working-tree, NOT committed)

- **New `lib/voices.ts`**: synth voices — `playKick` (sine 150→45Hz drop + noise click), `playClap` (two staggered bandpass noise bursts), `playHat` (highpass noise), `playBass` (tones: `sub`/`saw`/`acid` — acid = resonant lowpass sweep Q9 1400→160Hz), `playLead` (tones: `soft`/`sqr`/`saw` — saw = two oscs detuned ±7c). Shared noise buffer via `WeakMap<AudioContext, AudioBuffer>`.
- **New `lib/rows.ts`**: `ROW_DEFS` (11 rows: lead E5/D5/C5/A4/G4, bass C3/G2/C2, drums HAT/CLP/KCK), hues (lead 340–250, bass 230–200, drums amber 52/40/26), `LEAD_ROWS`/`BASS_ROWS`/`DRUM_ROWS` index maps, `Section` type.
- **New `lib/generate.ts`** (rewritten mid-session per Josh's visual-pattern insight — he hand-drew a staircase pattern that sounded great): stamp/period/phase generation. Small stamp shapes (`LEAD_SHAPES` diagonals/pairs/singles) repeated at period 4 or 8 with per-row phase offsets; three archetypes `cascade` (kick→clap→hat diagonal staircase, bass two-row stagger at phase 0/1), `classic` (backbeat clap, offbeat hats), `sparse` — module-level `lastArchetype` prevents back-to-back repeats. Kick 4-on-floor is the only fixed musical anchor. Repeats mutate harder in bars 3–4 (0/0/0.2/0.35) so loops drift like fills. `enforceCoverage` caps polyphony (≤2 lead, ≤4 total per column, sheds lead then non-root bass) and a richness floor re-stamps if lead < 5 notes. Verified by simulating patterns with `npx tsx -e` (22–32 notes, good variety). Also `makeEmptyGrid`, `normalizeGrid` (pads/truncates stale grids).
- **`hooks/useStepSequencer.ts` reworked**: per-layer gain buses (lead/bass/drums) → master gain 0.5 → DynamicsCompressor → destination; dotted-eighth feedback delay on lead bus, retuned on BPM change via `setTargetAtTime`. New controller fields: `leadTone`/`bassTone` + `setLeadTone`/`setBassTone`, `swing`/`setSwing` (odd 16ths delayed by `swing * stepDur`, accent scheme 1.15/0.85/1). Default BPM now 124. No `initialGrid` → seeds `generateTechnoPattern()` in a mount `useEffect` (hydration-safe; SSR renders empty grid). `NOTE_FREQS` export removed (no external consumers). NOTE: mutes were built then removed per Josh — "not for musicians", tone switching is the interesting control, mutes are not. Buses kept for delay routing/balance.
- **`components/Sequencer.tsx`**: rows driven by `ROW_DEFS`; section divider gaps via `.sectionStart`; header strip = label left + two segmented tone pills right (`[SOFT|SQR|SAW]` violet active, `[SUB|SAW|ACID]` blue active — radiogroup/radio semantics); transport gains SWING slider (0–60, purple accent) before BPM (now 90px, blue).
- **Monono compat**: `monono/data/starter-pattern.ts` ported to 11 rows (melody on lead rows, old E4 offbeats → HAT, C4 anchor → KCK + C2 sub, no clap — kept gentle/J-pop). Monono imports via the step-sequencer barrel `index.ts` (unchanged).
- **Docs/SEO**: updated `lib/experiments/data.ts` entry (subtitle/description/tags, Chiptune→Techno), `README.md` section, `public/llms.txt`, `public/llms-full.txt`, new entry in `docs/01-progress.md`.

## Key decisions

- Mutes implemented as bus-gain ramps (not skipping notes in the scheduler) — instant and click-free.
- Drum gains fixed (kick 0.5, clap 0.17, hat 0.08·accent); lead 0.085, bass 0.17 — tuned through the compressor, may need ear-tuning.
- Per Josh: "tune by extremes" memory — if he wants effect tuning (swing, delay wet 0.18, acid Q), jump to exaggerated values first.

## Outstanding work

- **Josh has not listened yet** — awaiting his review of generation quality and voice balance in dev server.
- Screenshot `public/screenshots/step-sequencer.png` is stale (shows 8-row grid) — refresh via `/ship-experiment` or manually when shipping.
- Not committed — commit after Josh approves the sound.

## Git state

Branch `main`, clean before session. All above changes uncommitted (9 modified files + new untracked `step-sequencer/lib/`). `npm run typecheck` and `npm run build` both pass.
