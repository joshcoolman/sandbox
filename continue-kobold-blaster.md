# Continue: Kobold Blaster

## Status: Playable. Controls overhauled. Next: death graphics.

### What's done
- Game live at `/design-experiments/kobold-blaster`
- Carl (v2), Princess Donut (v2), Kobold — all chroma-keyed sprite sheets wired in
- Per-frame tight crop system (absolute source coords, zero bleed)
- Walk / idle / throw / attack / hurt / dead animations for all three
- Bombs, chain explosions, gore particles, splats, combo scoring
- LitRPG wave notifications, game over screen, CRT scanline overlay
- No-scroll viewport (arena = canvas), kobolds spawn from all edges

### Controls (overhauled)
- **WASD / arrows** — move
- **Hold left click** — auto-fire toward mouse cursor
- **Hold space** — auto-fire in movement direction (keyboard-friendly)
- Both fire modes use the same cooldown (0.18s, ~5.5 shots/sec)
- Custom crosshair drawn on canvas (`cursor: none`), white gap-cross + red dot
- "How to Play" instruction block on start screen

### Tuned constants
- `BOMB_SPEED` 340 → 480 (snappier travel)
- `BOMB_LIFE` 1.8s → 0.7s (explodes near aim point, not across the map)
- `BOMB_CD` 0.3s → 0.18s (rapid-fire feel)
- Muzzle flash: 4 yellow/white particles burst from Carl on each shot

### Sprite sheet spec (what worked)
- 4×4 grid, ~20px magenta gutters, character centered with 20px margin
- Solid bright magenta background for chroma key
- After generation: `node chroma-key.mjs` (or inline sharp script) samples corner pixel, removes BG with fuzz=50
- Scan per-frame bounds with sharp raw pixel scan → absolute `[sx, sy, sw, sh]` crops hardcoded in component

### Sprite files in `public/design-experiments/kobold-blaster/`
- `carl-sprite-v2-t.png` — 1254×1254, used in game
- `princess-sprite-v2-t.png` — 1254×1254, used in game
- `kobold-sprite-t.png` — 1254×1254, used in game

### What's next
- **Death graphics** — improve kobold death visuals (death animation frame, dissolve, more dramatic particles)
- Screenshot + gallery registration (`/ship-experiment`)
- Possible: kobold variety (faster/tankier variants in later waves)
