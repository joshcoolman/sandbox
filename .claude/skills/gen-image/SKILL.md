---
name: gen-image
description: Generate raster images (avatars, icons, illustrations, hero art) via FAL.ai for use in design experiments. Use when the user asks to create / make / generate N images of X, with or without a reference image. Saves PNGs into the experiment's public folder. Requires the FAL MCP to be installed in the user's Claude environment.
---

# gen-image

Generate raster images via FAL.ai for design experiments. Avatars, icons, illustrations, hero art — anything that previously got hand-cropped from Unsplash or commissioned.

## When to invoke

Trigger on phrases like:

- "make / generate / create N [avatars / icons / illustrations / portraits] for [experiment]"
- "I need PNG art for the leaderboard / sticky notes / ascii reveal"
- "create images like this but [variation]" (with a pasted reference image)
- "match this style — different subject"
- "give me 6 variations of [thing]"

A pasted reference image (or a path to a local image) is a strong signal for the image-edit / style-transfer flow. No reference = pure text-to-image.

## Hard rules

- **Never commit.** Generate the files, report paths, let Josh review.
- **Never write API keys anywhere in the repo.** All auth is handled by the FAL MCP.
- **No emoji** in any prompt content destined for the UI (per CLAUDE.md).
- **If `mcp__fal-ai__*` tools are unavailable in the current session, stop.** Tell the user the FAL MCP is missing — don't fall back to scraping or hand-rolled HTTP calls.
- **Cap batches at 12 by default.** If the user asks for more, confirm first (cost / time).

## Workflow

### 1. Confirm the brief before spending money

Before submitting any jobs, restate back:

- Number of images
- Subject (e.g., "leaderboard avatars")
- Style (in plain language — "thick black outlines, white shapes on neutral grey, illustrative")
- Variation axes (e.g., "vary ethnicity, gender expression, hair, accessories")
- Output location (default: `public/<experiment-name>/<topic>/`)
- Reference image, if any

If anything is ambiguous, ask once. Don't submit 8 jobs and find out the user wanted a different aesthetic.

### 2. Pick a model

Use `mcp__fal-ai__recommend_model` if you're unsure. Otherwise:

| Aesthetic | Model |
|---|---|
| Illustrative / icon / logo / line-art / sticker style | `fal-ai/nano-banana-2`, `fal-ai/gpt-image-2`, `fal-ai/recraft-v3` |
| Photoreal portrait | `fal-ai/flux/dev`, `fal-ai/bytedance/seedream/v4.5/text-to-image` |
| "Match this style, different subject" (image-edit / style transfer) | `fal-ai/flux-kontext/dev`, `fal-ai/nano-banana-2` (image-edit mode) |
| Vector-feeling / clean illustration | `fal-ai/recraft-v3` (has explicit style controls) |

When in doubt about a model's input schema (does it want `image_url`, `init_image`, `reference_image_url`?), fetch it with `mcp__fal-ai__get_model_schema`.

### 3. Reference image handling

If the user pasted or pointed at a local image:

1. Upload it: `mcp__fal-ai__upload_file` with the local path. Returns a hosted URL.
2. Pass that URL as the model's reference field (name varies — check schema).
3. If the user wants the *style* but a different subject, prefer `flux-kontext` or `nano-banana-2` image-edit. Add prompt language like "in the style of the reference image" so the model doesn't just regenerate the source.

### 4. Build prompts

For batches with variation (the leaderboard avatar case): write **N distinct prompt strings**, not one prompt with a "vary X" instruction. Each prompt should be self-contained and specific.

Example for 8 leaderboard avatars matching the reference style:

```
1. East Asian woman, mid-20s, dark bob, round glasses, neutral expression, thick black line art, white shapes on neutral grey background, mascot illustration style.
2. Black man, late 30s, short fade, full beard, mirrored sunglasses, smiling, thick black line art, white shapes on neutral grey background, mascot illustration style.
3. South Asian non-binary person, early 30s, undercut, septum ring, soft smile, thick black line art, white shapes on neutral grey background, mascot illustration style.
... etc
```

Keep the **style anchor** (final clause) identical across the batch. Only vary the subject.

### 5. Submit jobs

For batches: use `mcp__fal-ai__submit_job` for parallelism. Collect `request_id`s. Poll with `mcp__fal-ai__check_job` until each is done.

For one-offs: `mcp__fal-ai__run_model` is fine (synchronous, simpler).

Don't run synchronous calls in a serial loop for batches — that's slow and expensive in wall time.

### 6. Download and post-process

Each completed job returns one or more image URLs in its result.

```bash
# Save with zero-padded 2-digit index
curl -L -o "public/<experiment>/<topic>/01.png" "<image-url>"

# Force square 512x512 if the model returned non-square
sips -z 512 512 -c 512 512 "public/<experiment>/<topic>/01.png"
```

`sips` is preinstalled on macOS. `-z` resizes, `-c` center-crops. Use both together to guarantee square output even if the model returns 1024x768.

### 7. Output convention

```
public/<experiment-name>/<topic>/01.png
public/<experiment-name>/<topic>/02.png
...
```

- Per-experiment folder under `public/`
- `<topic>` is descriptive: `avatars`, `icons`, `heroes`, `tiles`
- Zero-padded 2-digit indices for predictable consumption (`01.png`, not `1.png`)
- Default to PNG (transparent backgrounds when supported)
- Default to 512×512 unless the user asks otherwise

### 8. Report back

After the batch completes, list:

- Every saved path
- The model used (so regens use the same one)
- The FAL `request_id`s (so a single failed image can be re-run without redoing the batch)
- Any prompt that produced an obvious miss, in case the user wants to tweak just that one

Example report:

```
Generated 8 leaderboard avatars with fal-ai/flux-kontext/dev:

  public/leaderboard/avatars/01.png  →  East Asian woman, bob, round glasses
  public/leaderboard/avatars/02.png  →  Black man, fade, mirrored shades
  ...

Job IDs (for regeneration):
  01: 9e1c7a-...
  02: 4f2b8d-...
  ...
```

## Common pitfalls

- **Burning credits on a stylistic miss.** If the brief is "illustrative" and the model returned photoreal, stop, change the model (or add stronger style anchors), and regen. Don't push through 8 wrong-style images.
- **Inconsistent batches.** If avatars are supposed to be a coherent set, the style-anchor clause must be identical across all prompts. Variation lives in the subject clause.
- **Wrong aspect ratio.** Some models default to 16:9 or 4:3. Always pass an explicit aspect/size argument when the model supports one. `sips` is the safety net, not the strategy.
- **Image-edit models echoing the source.** If `flux-kontext` keeps returning a near-copy of the reference, the prompt isn't pushing far enough away. Strengthen the subject description.
- **Forgetting the experiment exists.** Save into `public/<experiment-name>/`, not the root of `public/`. Keep assets co-located.

## Reference: available FAL MCP tools

- `mcp__fal-ai__search_models` — find a model by capability or vendor
- `mcp__fal-ai__recommend_model` — let the MCP suggest one
- `mcp__fal-ai__get_model_schema` — fetch input/output JSON schema
- `mcp__fal-ai__get_pricing` — check cost per image before a big batch
- `mcp__fal-ai__upload_file` — upload local file, returns hosted URL
- `mcp__fal-ai__run_model` — synchronous one-off generation
- `mcp__fal-ai__submit_job` — async submission, returns `request_id`
- `mcp__fal-ai__check_job` — poll a `request_id` for completion
- `mcp__fal-ai__search_docs` — search FAL docs for usage examples
