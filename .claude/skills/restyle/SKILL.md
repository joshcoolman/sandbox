---
name: restyle
description: Refresh the base site's look — palette, fonts, light/dark, and feel (corner roundness, border weight, density, shadows) — through a back-and-forth. Drives the global theme contract in app/globals.css and is free to rewrite base-site component CSS/markup to land a look. Never touches route structure, sections, or the isolated experiments/sketches. Runs on a branch; no auto-commit.
---

# restyle

Reskin the base site via a conversation. Change how it *looks and feels*, not how it's
*built*. The site has a single theme contract (`app/globals.css`) that every base-site
surface consumes — that's the primary control surface. You also have full freedom to go
deeper into base-site component CSS and markup to realize a direction.

## Usage

```
/restyle
/restyle warm editorial, light default, rounded, soft serif
/restyle explore            # generate several distinct directions to choose from
/restyle <paste a reference image>
```

## Scope walls (hard limits — never cross)

- IN SCOPE: `app/globals.css` (the contract), `app/layout.tsx` (fonts), and base-site
  CSS/components — home (`app/page.module.css`, `app/components/*`), blog
  (`app/(blog)/`), docs (`app/(docs)/`), news (`app/(news)/`), the experiments **gallery**
  (`app/design-experiments/page.module.css`), about (`app/about/`).
- NEVER touch: route structure, which sections exist, `app/design-experiments/(experiments)/*`,
  or `app/sketches/*`. These scope their own tokens and must look unchanged. A restyle
  that alters them is a bug.

## The theme contract (your primary levers)

Editing these tokens in `app/globals.css` cascades site-wide. Two blocks: `:root` (dark,
default) and `:root[data-theme='light']` (light). Token groups:

- **Color** (theme-aware): `--bg`, `--surface`, `--surface-raised`, `--surface-sunken`,
  `--text`, `--text-body`, `--text-muted`, `--text-faint`, `--border`, `--border-soft`,
  `--border-faint`, `--accent`, `--accent-contrast`, `--accent-soft`. `--accent` is the
  single source for the whole site.
- **Fonts** (roles): `--font-display`, `--font-serif`, `--font-body`, `--font-sans`,
  `--font-mono` — aliases of the `next/font` variables loaded in `app/layout.tsx`.
- **Feel knobs**: spacing scale `--space-1..9` (density), radius scale
  `--radius-sm/md/lg/pill/circle` (roundness), `--border-width` / `--border-width-strong`
  (border weight), `--shadow-sm/md/lg` (depth), `--ease` + `--dur-*` (motion).
- **Type scale**: `--text-xs..--text-xl`, `--text-title`, `--text-subtitle`.

Changing a font = edit the `next/font/google` import(s) in `app/layout.tsx` and, if the
role mapping changes, the `--font-*` aliases in `globals.css`. Only fonts available in
`next/font/google` can be statically imported.

Note: the homepage hero sits over a fixed dark photo and intentionally stays dark in both
themes; its accent is tokenized (recolorable) but its dark neutrals are literals. The home
network animation color lives in `app/components/NetworkCanvas.tsx` and the blog OG image
in `opengraph-image.tsx` use literal colors (canvas/satori can't read CSS vars) — update
those by hand if the accent changes and it matters.

## Procedure

### 1. Safety gate
- `git status` — if dirty, stop and ask the user to commit/stash first.
- `git switch -c restyle` (use `restyle-2`, etc. if it exists).

### 2. Read the current intent
Read `THEME.md` at the repo root first — it's the token snapshot + rationale + do's/don'ts
for the theme in place (format inspired by google-labs-code/design.md: machine-readable
front matter + human "why"). It tells you what's there and the constraints to respect.

### 3. Gather direction
From the args, pasted reference image(s), or `AskUserQuestion`. A wordless `/restyle <images>`
is a valid brief. Establish: mood/adjectives, light or dark default, font feeling (e.g.
geometric sans / soft serif / mono), and feel (sharp vs rounded, thin vs thick borders, tight
vs airy, flat vs shadowed). Note any must-keep elements.

**Reading reference images — extract STYLE, ignore CONTENT.** References are usually posters,
specimens, or screenshots full of subject matter. Pull only the visual *language*, not what
the image depicts:
- **Palette:** read the *ground* (background paper/canvas) and the *ink* (primary text) — those
  define the theme. Subject colors (a photo, an illustration, a textile pattern) are usually
  NOT the palette; at most sample ONE restrained hue as a candidate accent, and only if it
  reads intentional. Distinguish warm off-white from pure white, soft ink from pure black.
- **Type:** classify by ROLE and FORM (grotesque vs serif vs script; weight; tracking;
  stroke contrast), then pick the closest `next/font/google` family by character. Do NOT
  hard-adopt a font merely *named* in the image (e.g. a type specimen) — it's a sample, not a
  requirement, and may not be on Google Fonts.
- **Feel:** corner radius, rule/border weight, whitespace density, flat vs shadowed, grid.
- **IGNORE:** subject matter (animals, objects, people), the literal composition/poster
  layout, any headline copy or words shown, and logos. Those are content, not the system.
- **Multiple unrelated refs:** extract the *shared* DNA, name where they diverge, and ask
  which to favor rather than blending them into mush.

Then synthesize the inferred direction into a short written spec (palette + type trio + feel +
do's/don'ts) and **confirm it with the user before changing any code** — especially when the
brief was image-only. This is the checkpoint that prevents a confident wrong turn.

### 4. (Optional) Explore mode — divergent directions
When the user says `explore` or is unsure, generate 3–4 **distinct** complete directions in
parallel rather than iterating serially. Spawn parallel subagents (use `isolation: 'worktree'`
so each applies its own token set without colliding); each agent produces a full theme spec
(palette dark+light, font trio, feel knobs), applies it to the contract, builds, and reports.
Bring back a side-by-side summary (with screenshots if a dev server is available) and let the
user pick one to carry forward. For large/ambitious sweeps this is a good place to drive a
Workflow (deterministic fan-out + scoring); for the usual 3–4 options, parallel subagents are
simpler. Subagents and workflows can't ask the user mid-run — they generate, you present, the
user chooses here in the conversation.

### 5. Apply the chosen direction
- Primary: edit the contract tokens in `app/globals.css` (both theme blocks) and the font
  imports in `app/layout.tsx`. This cascades.
- Then, with full freedom, go deeper into base-site component CSS/markup as the look needs
  (e.g. flatten the cyan-glow cards into soft editorial cards, change card structure,
  adjust layout density). When the change spans many files, fan out with parallel subagents
  given the exact token list, the way the foundation migration was done.
- Keep both light and dark coherent. Watch for contrast traps (light text on a now-light
  surface). Respect the scope walls.
- Regenerate `THEME.md` to match: rewrite the YAML token snapshot from the new
  `globals.css` values, give the theme a name, and rewrite the rationale + do's/don'ts to
  explain the new direction (the "why / how to apply" — this is what keeps the freedom
  coherent for the next pass). Keep it the mirror of the contract, not a second source of
  truth.

### 6. Verify
- `npm run build` — fix until clean.
- Contrast lint (WCAG AA gate — catches light/dark traps automatically). For BOTH themes,
  compute the contrast ratio of the key token pairs and flag failures:
  `--text` on `--bg`, `--text-body` on `--bg`, `--text` on `--surface`/`--surface-raised`,
  `--text-muted` on `--bg`, and `--accent` on `--bg` + `--accent-contrast` on `--accent`.
  Targets: >= 4.5:1 for body text, >= 3:1 for large text / UI accents. Compute it
  dependency-free (relative luminance → ratio; resolve `color-mix`/alpha against the
  background it sits on) — a tiny inline node script is fine. Fix any failure by nudging the
  token, then record the results in `THEME.md`'s `contrast:` block (`checked: true`).
- Visual check in both themes. The user runs the dev server (do not start it). Ask them to
  review, or if a server is already running use the `agent-browser` skill to screenshot
  home, a blog post, docs, news, and the experiments gallery in both `data-theme` states;
  toggle via the theme button or by setting `data-theme` on `<html>`.
- Spot-check that an experiment and a sketch look unchanged (proves the walls held).

### 7. Iterate, then hand off
- Refine with the user in conversation until they're happy — this loop stays here, not in a
  subagent.
- Do not commit or push. Leave them on the `restyle` branch; suggest `git diff main --stat`.

## Reference

- The contract and how it was built: `app/globals.css`. Foundation migration pattern and
  the branch/build/no-commit safety shape: `.claude/skills/start-from-scratch/SKILL.md`.
- Design knowledge to lean on: the `typography-system` skill (font pairing, type scales) and
  the `frontend-design` skill (avoiding generic AI aesthetics).
