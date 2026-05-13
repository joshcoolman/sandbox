---
name: gen-sprite
description: Generate NES-style pixel-art game assets using the GenZen MCP (gpt-image-1.5). Handles three layouts auto-detected from the description — character (4×4 animated sprite sheet), strip (N×1 sequential states), or single (one standalone image). Works from a text description alone or an existing reference image. Use for any game asset: enemies, items, effects, tiles, icons, pickups, UI elements.
---

# gen-sprite

Generate NES-style pixel-art game assets via GenZen. Three layout modes — auto-detected from your description:

| Mode | When | Examples |
|---|---|---|
| **character** | Animated enemy/hero needing run/idle/attack/dead | "kobold", "octopus wizard", "stone golem" |
| **strip** | Object with sequential states or a short animation cycle | "treasure chest", "coin spin", "level-up sparkle", "door opening" |
| **single** | One standalone image, no animation | "bomb", "skull icon", "heart pickup", "floor tile", "key" |

All outputs: magenta-background PNG, chroma-keyed in-engine at runtime.

---

## When to invoke

- "make a sprite sheet for [character]"
- "generate a [treasure chest / bomb / skull / coin / any asset]"
- "I need a [thing] for the game"
- "add [asset] as an enemy / item / effect"
- `/gen-sprite [description or reference path]`

## Hard rules

- **Check credit balance first.** Call `mcp__genzen__get_credit_balance` before spending anything.
- **Never commit.** Save PNGs, report paths, let the user review.
- **If `mcp__genzen__*` tools are unavailable, stop.** Tell the user the GenZen MCP is missing.
- **No API keys in the repo.** Auth is handled by the MCP.

---

## Step 1 — Detect layout & gather inputs

**Auto-detect layout from the description:**

- Keywords like "states", "open/closed", "cycle", "animation", "frames", "spin", "sequence" → **strip**
- Keywords like "icon", "tile", "pickup", "item", "single", "badge", "marker", "effect" → **single**
- Everything else (enemy, character, creature, hero, boss, NPC) → **character**

When unsure between strip and character, default to **character** — it's more useful.

**Determine N for strip mode:** infer from the description ("3 states" → N=3, "coin spin" → N=4, "level-up sparkle" → N=6). Default to 4 if unspecified.

**Reference image:** optional. If provided, skip the concept generation step and use it directly.

---

## Step 2 — Check balance & pick model

Run in parallel:

```
mcp__genzen__get_credit_balance
mcp__genzen__list_image_models
```

Report balance. Estimated cost:
- **character** (two-step): ~2 credits
- **strip** or **single** (one-step with concept): ~2 credits
- Any mode with reference image: ~1 credit

| Model | Notes |
|---|---|
| `fal-ai/gpt-image-1.5` | **Default.** Fast, reliable, follows layout instructions well. |
| `fal-ai/bytedance/seedream/v4.5/text-to-image` | Good alternative — strong consistency. Use `fal-ai/bytedance/seedream/v4.5/edit` for the reference step. |
| `fal-ai/gpt-image-2` | Higher quality but frequently stalls/times out. Avoid unless explicitly requested. |

---

## Step 3 — Generate concept image (no reference provided)

Build a concept prompt. Goal: clean character/object portrait on magenta background, suitable as a reference for the final asset.

```
NES-style pixel art: [USER DESCRIPTION].

Single subject on a solid bright magenta #FF00FF background, centered in frame, full subject visible.
Chunky block pixels, strong black outlines, limited palette (6–8 colors max).
No gradients, no anti-aliasing, no soft shading.
Clear readable silhouette. No background objects or scenery.
Should look like it belongs in a classic NES game.
[For characters: full body visible, facing left.]
[For objects: front-facing or most recognizable angle.]
```

```
mcp__genzen__generate_image
  prompt: <concept prompt>
  modelId: fal-ai/gpt-image-1.5
  aspectRatio: "1:1"
```

Save `imageId` as `conceptImageId`. Show the URL. Continue straight through unless it looks clearly wrong.

---

## Step 4 — Build the generation prompt

Choose the template for the detected layout:

---

### Layout: character (4×4 sprite sheet)

Derive a 1–2 sentence **character block** from the concept/reference. Be specific: colors, silhouette, distinguishing features.

```
Using the attached reference image as the exact character design, create a pixel art sprite sheet.

Animate the same character shown in the reference. Do not redesign it. Preserve silhouette, proportions, palette, facial features, clothing/body details, accessories, and chunky retro pixel-art style.

Create a 4-column × 4-row sprite sheet:
- Solid bright magenta #FF00FF cell interiors
- Lighter magenta-tinted gutters (~20px) between cells — not white, not gray
- ~200×200px per cell, total ~880×880px
- Character centered in each occupied cell, 20px clear margin from edges
- Feet aligned to consistent Y within each row
- Character faces LEFT in all frames
- Unused cells: empty magenta only

Row 0 — run cycle: col 0 left stride | col 1 neutral | col 2 right stride | col 3 neutral
Row 1 — idle/hurt: col 0–2 subtle idle poses | col 3 hurt/recoil with small impact starburst
Row 2 — attack: col 0 wind-up | col 1 full extension | col 2 follow-through | col 3 empty
Row 3 — dead: col 0 knocked-out pose | cols 1–3 empty

Style: NES pixel art, chunky black outlines, limited palette, no gradients, no anti-aliasing.
Full body visible in all occupied cells. No cropping. No background. No text. No white gutters.
Prioritize consistency and readability over dramatic posing.

[CHARACTER_BLOCK]
```

---

### Layout: strip (N×1 sequential states)

Build a column-by-column description from the user's intent.

```
Create a pixel art sprite strip for: [SUBJECT].

Layout: [N] columns × 1 row, horizontal strip.
- Solid bright magenta #FF00FF cell backgrounds
- Lighter magenta-tinted gutters (~20px) between cells — not white
- ~200×200px per cell, total ~[N×220]×220px
- Subject centered in each cell with 20px clear margin
- Consistent scale and baseline across all cells

[COLUMN DESCRIPTIONS — e.g.:]
Col 0: [state 1 description]
Col 1: [state 2 description]
Col 2: [state 3 description]
...

Style: NES pixel art, chunky black outlines, limited palette (6–8 colors), no gradients, no anti-aliasing.
No background objects. No text. No white gutters. Subject fully visible in every cell.
Keep scale, proportions, and design identical across all cells — only the pose/state changes.

[SUBJECT DESCRIPTION BLOCK — e.g., "Wooden treasure chest, iron hinges, gold latch, warm brown palette, chunky retro proportions."]
```

**Example column descriptions by asset type:**

- Treasure chest (3): `Col 0: chest fully closed | Col 1: lid halfway open, light rays escaping | Col 2: fully open, glowing interior, coins visible`
- Coin spin (4): `Col 0: full circle facing forward | Col 1: ellipse (45°) | Col 2: thin vertical sliver (edge-on) | Col 3: ellipse (135°)`
- Door (3): `Col 0: door closed | Col 1: door ajar, light from behind | Col 2: door fully open`
- Level-up sparkle (4): `Col 0: small star burst | Col 1: medium expanding rings | Col 2: large bright flare | Col 3: fading glow`
- Explosion (4): `Col 0: small ignition spark | Col 1: expanding orange fireball | Col 2: full bloom with debris | Col 3: dissipating smoke cloud`

---

### Layout: single (1×1 standalone image)

```
NES-style pixel art: [SUBJECT DESCRIPTION].

Single image on solid bright magenta #FF00FF background.
Subject centered, fully visible, ~180×180px effective area within a ~220×220px frame.
Chunky block pixels, strong black outlines, limited palette (6–8 colors max).
No gradients, no anti-aliasing, no soft shading.
No background objects, no text, no scenery.
Clean readable silhouette — should read clearly at small sizes.

[Any specific angle, orientation, or style notes.]
```

Examples of subject descriptions:
- Bomb: `Round black bomb with lit fuse, white skull marking, yellow fuse spark, NES Bomberman style`
- Skull: `Cartoon skull, hollow eye sockets, cracked dome, used as a death/enemy-killed marker`
- Heart: `Bright red pixel-art heart, HP pickup, simple chunky shape, slight specular highlight`
- Key: `Gold skeleton key, ornate bow, classic RPG item style`
- Floor tile: `Dark gray stone cobblestone, subtle cracks, seamless-tileable dungeon floor`

---

## Step 5 — Generate the asset

```
mcp__genzen__generate_image
  prompt: <assembled prompt for layout>
  modelId: fal-ai/gpt-image-1.5
  aspectRatio: "1:1"
  referenceImageIds: [<conceptImageId or uploadedRefId>]   ← omit if no reference
```

For **single** assets with no reference, omit `referenceImageIds` entirely — just use the prompt.

---

## Step 6 — Save the result

Derive a slug. Save to the experiment's public folder:

```bash
# Character sheet
curl -L -o "public/design-experiments/kobold-blaster/<slug>-sprite.png" "<url>"

# Strip
curl -L -o "public/design-experiments/kobold-blaster/<slug>-strip.png" "<url>"

# Single
curl -L -o "public/design-experiments/kobold-blaster/<slug>.png" "<url>"
```

Adjust path for other experiments. Chroma keying is handled in-engine — no `-t` suffix needed.

---

## Step 7 — Report back

```
Generated <layout> asset — <subject>:

  Concept:      <url or "used existing reference" or "n/a — single asset">
  Saved:        <path>
  Model:        fal-ai/gpt-image-1.5
  GenZen IDs:   concept=<id>  asset=<id>
  Credits used: ~<n> (~$<x> total)
  Remaining:    <balance>

[For character/strip:]
Next step: wire up CROPS array in the game component.
Use the sharp pixel-scan script (continue-kobold-blaster.md) to measure
[sx, sy, sw, sh] per frame, then hardcode into the component's crop constant.
```

---

## Common pitfalls

- **Layout ignored.** Pass through `mcp__genzen__edit_image`: "Reformat as a strict [N]-column × [M]-row grid with magenta cell interiors and lighter magenta gutters. Keep all art identical."
- **White gutters.** Edit: "Replace all white dividers between cells with a lighter tint of magenta. Cell interiors stay bright magenta #FF00FF."
- **Empty cells filled in.** Edit: "Remove all art from col X row Y — that cell must be solid magenta only."
- **Character redesigned.** Strengthen the subject description block with explicit color values and silhouette keywords. Re-run generation.
- **gpt-image-2 stalls.** Fall back to `fal-ai/gpt-image-1.5` — it's faster and reliable.
- **Strip frames inconsistent scale.** Edit: "Make the subject the same size in every cell. Only the pose should change, not the scale or proportions."

---

## Reference: GenZen MCP tools

- `mcp__genzen__get_credit_balance` — check balance before spending
- `mcp__genzen__list_image_models` — available models + reference support
- `mcp__genzen__list_edit_models` — correction/edit models
- `mcp__genzen__upload_image` — upload local PNG, returns `imageId` (free)
- `mcp__genzen__generate_image` — generate from prompt + optional reference images
- `mcp__genzen__edit_image` — correct/adjust an existing generated image
- `mcp__genzen__list_recent_generations` — see recent outputs
