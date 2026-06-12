# Continue: War Room — sci-fi HUD design experiment

## What was being worked on
New design experiment **`war-room`** at `app/design-experiments/(experiments)/war-room/` — a dense wall of eight live sci-fi HUD panels (WarGames / Iron Man / Ambrosia-DEFCON-screensaver lineage). Planned and built in one Fable 5 session from four inspiration images plus live feedback rounds from Josh while he watched it run. Build + typecheck pass. **Mid-review**: Josh has been giving panel-by-panel feedback left to right; four rounds are already implemented (see below), more may come.

Full plan with phase tables and constants: `/Users/joshcoolman/.claude/plans/based-on-app-design-experiments-experime-ethereal-hare.md`

## Architecture (stable — don't re-derive)
- **One shared rAF scheduler** (`lib/scheduler.ts`), virtual clock `{t, dt}` that pauses on tab-hide. Every panel registers a draw via `hooks/useCanvasPanel.ts` (DPR cap 2 via setTransform, ResizeObserver, IntersectionObserver pause, resolves next/font families from `--wr-mono-fam`/`--wr-display-fam`).
- **HUD store** (`lib/hud.ts`): mutable frame state (strikes/impacts/engagement/glitchUntil/logs) + subscribe-snapshot for defcon/activeTargetId. `CIN` phases: LOCK 280 / DECODE 520 / HOLD 2400 / RELEASE 8000 / FADE 600. One `engagedAt` timestamp coordinates dossier + map crosshair + globe rotate-to-target.
- **Ambient channels** (`lib/events.ts`) polled from the virtual clock — no setInterval. HudProvider (`lib/context.tsx`) owns the release tick.
- **`data/coastlines.ts`** — GENERATED 19.2KB Natural Earth 110m (regen command in header); one module → flat map polylines + globe dots.
- Composable contract: panels fill their container, `Panel` chrome separate from content, `page.tsx` is pure composition (~75 lines).
- Palette: bg `#04070a`, cyan `#39d7e0`, amber `#f0a030`, red `#e8442e`, phosphor green `#9fe870`, LCD `#a9b88e`/`#1d2417`. Overlay brights on the portrait: yellow `255,224,82`, red `255,64,48`. Fonts: Rajdhani + Share Tech Mono.

## Feedback rounds already implemented
1. **Map — WarGames climax**: full traversed arc stays lit behind the head; after arrival the whole arc persists ~9.5s (`TRAIL_LIFE`) as fading afterglow. Impacts are big solid blast bubbles (`IMPACT_LIFE` 6s, `mw*0.042` radius, fill + hot rim + white-hot core + shock ring). ~10× busier: strike channel 380–1100ms with salvos (up to 4, staggered launch via future `launchedAt`); strikes capped at 56 (oldest trail shed first, never in-flight); launch/impact logs sampled (30%/25%) so the ticker isn't drowned. Heads no longer use shadowBlur (too many concurrent).
2. **Schematic — teletype**: rewritten as line-by-line printer. Chars hammer out at the BOTTOM (1–2 chars per 3–17ms tick, jittery), carriage-return beat 36–106ms (10% chance +220ms mechanical pause), page steps up in whole lines — no smooth scroll. Print-head cursor block, blink + scatter kept.
3. **LCD — no blink, no overlap**: always light screen / dark pixels (invert-blink alarm removed entirely). Top row: "DEFCON" left, 5..1 scale inline right (active = Nokia-pill dark band). Big digit centered between top row and bottom ZULU clock.
4. **Roster cycling + hot portrait**: `TARGETS` expanded to 12 (all ascii-reveal images). Roster = 5 surveillance slots on independent timers (2.6–8.4s), hard-cutting to off-screen targets (`wr-cut` steps() static-flicker animation, keyed per feed); engaged slot never swaps. `components/ScanPortrait.tsx` (extracted): high-contrast raster (gamma 1.6, white-hot cores — `lib/scanline.ts` now takes `{intensity, tear}` opts), per-frame flicker, horizontal tears, and a dense overlay ON the image: churning red hex column, yellow tick ruler, resolving yellow/red ASCII fields (canvas `decodeText`), scan-cursor %, blinking red LOCK tag, yellow corner brackets.
5. **Roster hover = slide-gallery vertical**: mugs are flex slivers; hover blooms one to `flex-grow: 3.2` with slide-gallery's `1s cubic-bezier(0.075, 0.82, 0.165, 1)`, siblings dim; engaged mug holds `flex-grow: 2`. Portrait raster resolution doubled (`getRaster` defaults now 96×124).
6. **Schematic starts mid-document**: history pre-filled to a full page on first draw; the teletype just keeps printing from there.

## Outstanding work
- **Josh is still reviewing left-to-right** — panels not yet commented on: globe, satellite, ticker, spectrum, dossier card itself (fields/threat bar), CRT/glitch overall. Expect more tuning.
- Mugshots remain placeholders; Josh may swap later.
- After approval: `/ship-experiment` (screenshot, README, commit, push).

## Git state
Branch `main`, **nothing committed**. Untracked: `war-room/`. Modified: `lib/experiments/data.ts` (entry at top), `public/llms.txt`, `public/llms-full.txt`, `docs/01-progress.md`. Build + typecheck pass clean. `/ship-experiment` handles the commit after review.
