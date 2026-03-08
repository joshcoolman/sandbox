Continuing work on the "image-to-ui" design experiment at app/design-experiments/image-to-ui/. Read all files in that directory and its components/ folder to get up to speed.

**What this is:** A collection of interactive UI components reverse-engineered from reference images (FAL.ai video generation UI). User provides screenshots, Claude builds faithful interactive versions. Components share design tokens, are composable, and have parameterized inputs with open-ended outputs.

**Files (all uncommitted/untracked except data.ts which is modified):**
- `app/design-experiments/image-to-ui/page.tsx` -- two-column layout: components on left, description panel on right. DM Sans + DM Mono fonts. MODEL_SECTIONS JSON data defined here.
- `app/design-experiments/image-to-ui/styles.css` -- shared design tokens. `--ui-primary: #ff8c2a` (fluorescent orange). Radius tokens: sm 4px, md 7px, lg 10px. All wrapper containers use --ui-radius-md. Two-column layout via .page-columns flexbox. Description panel has -10px margin-top for optical alignment.
- `app/design-experiments/image-to-ui/components/RotarySelector.tsx` -- circular dial with radial labels (max 4), spring-eased rotation
- `app/design-experiments/image-to-ui/components/DurationSlider.tsx` -- popover snap slider (3s/6s/9s/12s/15s)
- `app/design-experiments/image-to-ui/components/ListSelector.tsx` -- popover list with checkmark, optional badge
- `app/design-experiments/image-to-ui/components/ModelSelector.tsx` -- two-level flyout model selector, JSON-driven. Flyout opens to the RIGHT of trigger, vertically centered (top: 50%, translateY(-50%)). Viewport-aware: flips left or clamps vertically if overflowing. Submenu also viewport-aware.
- `lib/experiments/data.ts` -- gallery entry added at top

**Changes made this session:**
- Standardized all wrapper container border-radius to --ui-radius-md (7px) matching ModelSelector trigger
- Tightened page gap from 48px to 20px
- ModelSelector flyout repositioned: was opening above trigger, now opens to the right, vertically centered
- Added viewport-aware positioning (useEffect with getBoundingClientRect) for both flyout and submenu -- flips horizontally, clamps vertically
- Removed "Exclusive" badges from model data
- Changed --ui-primary from #b4f74a (green) to #ff8c2a (fluorescent orange)
- Added two-column layout: components left, description right
- "Image to UI" moved from centered page label to h1 headline in description panel, 22px/600 weight
- Description: two paragraphs about the collaborative image-to-code process
- Tried glassmorphism (backdrop-filter blur) on flyout -- removed, didn't work well

**Key decisions:**
- --ui-primary is single brand color source of truth, currently orange. All accent tokens derive from it.
- Wrapper containers (component-card, param-toolbar, model-trigger) all share --ui-radius-md (7px)
- ModelSelector flyout direction: RIGHT of trigger (not above), vertically centered
- styled-jsx scoping: ModelIcon and TagPill use inline styles (not in style jsx block)
- Description panel uses negative margin-top (-10px) for optical alignment with first component

**Outstanding / next session:**
- User has "minor changes" to make -- unspecified
- No commit yet -- user will review and use /ship-experiment when ready
- Build should pass cleanly (not verified this session)
- May want to refine submenu hover zones
- Could add keyboard navigation to ModelSelector

**Git state:** Branch main, all experiment files are untracked (new), gallery entry in data.ts is the only modified tracked file. Nothing committed this session.
