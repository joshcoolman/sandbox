---
title: Sandbox Skills — Top 3 Moves From Reviewing Matt Pocock's Skills Repo
description: Comparing sandbox's skills against Matt Pocock's repo, with a strict filter on what's worth porting or refactoring.
status: in-progress
---

<Callout type="tldr">
After auditing both repos, three skill-level moves are worth doing — plus a viewer (Move 0) so future plans like this are easier to read. Move 0 is shipped; Moves 1–3 are still on the table.
</Callout>

## Context

You asked for an exploratory comparison of Pocock's `~/repos/skills` against sandbox's 16 skills, with a strong filter: don't suggest much, and only port things with clear rationale. After mapping both repos, three moves stand out as high-leverage. Everything else either duplicates what sandbox already does well (the design pipeline is genuinely good), or doesn't fit sandbox's character as a low-friction visual prototype playground (e.g. Pocock's `tdd`, `to-issues`, `to-prd`, `triage`, `git-guardrails`, `setup-pre-commit`).

You also asked, as a precursor to reviewing this plan, to render it (and future plans) as HTML in the sandbox app so they're easier to scan in a browser. That's **Move 0** below — it sets up the viewing infrastructure before we touch any skill content.

---

## Move 0 — Add a `/plans` route to the sandbox app (one-time setup)

**Goal.** A URL-accessible viewer for markdown plan files. Not linked from any nav, but discoverable via the URL `/plans`. Reusable for every future plan.

**Why mirror `(docs)`.** Sandbox already has a working markdown loader/renderer for `app/(docs)/docs/[...slug]/page.tsx` with primitives in `lib/docs/` (`loadDocs.ts`, `parseFileName.ts`, `extractHeadings.ts`, `slugify.ts`, `parseDocTitle.ts`). The plans route is the same problem with a different base directory.

**Structure.**

- Route: `app/(plans)/plans/[[...slug]]/page.tsx` — catchall with optional slug.
  - `/plans` → list of all plan files (title + date).
  - `/plans/<slug>` → rendered markdown.
- Layout: `app/(plans)/layout.tsx` — minimal, no sidebar (plans are flat and ephemeral, unlike docs which need navigation).
- Content directory: `plans/` at the sandbox repo root. Each plan is `plans/<slug>.md`. Committed to the repo.
- Loader: either a thin wrapper around `lib/docs/loadDocs.ts` pointed at `plans/`, or a small `lib/plans/loadPlans.ts` that reuses the lower-level primitives in `lib/docs/`.
- No nav entry added in the homepage, blog, or docs layouts.

<Callout type="decision" title="Naming">
`/plans` matches the existing `~/.claude/plans/` convention. Chose this over `/planning` (reads as ongoing activity) and `/notes` (already taken under `(blog)`).
</Callout>

**This plan's file.** Copy `~/.claude/plans/skills-it-is-a-dynamic-robin.md` to `sandbox/plans/skills-it-is-a-dynamic-robin.md` after the route is built; it will render at `/plans/skills-it-is-a-dynamic-robin`.

**Future convention.** When a plan is worth viewing in HTML, drop the `.md` into `sandbox/plans/`. (A tiny `/save-plan-to-sandbox` skill could automate the copy from `~/.claude/plans/`, but that's a nice-to-have, not required.)

<Callout type="caveat" title="Public repo">
`sandbox/plans/*.md` is committed to the public sandbox repo. Fine for design/architecture plans like this one. Don't drop in any plan that contains credentials, internal product strategy, or anything else you wouldn't put in a public README.
</Callout>

**Critical files (read-only references for implementation).**

- `app/(docs)/layout.tsx` — minimal layout pattern (drop the sidebar for plans).
- `app/(docs)/docs/[...slug]/page.tsx` — the render-from-slug pattern.
- `lib/docs/loadDocs.ts` — content discovery + indexing (the function to either reuse with a `baseDir` argument or fork into `lib/plans/`).
- `lib/docs/parseFileName.ts`, `parseDocTitle.ts`, `slugify.ts`, `extractHeadings.ts` — primitives, almost certainly reusable as-is.

**Verification.**

1. Visit `/plans` locally — see this plan listed.
2. Visit `/plans/skills-it-is-a-dynamic-robin` — markdown renders to HTML with code blocks, headings, lists styled.
3. Confirm no nav link references `/plans` anywhere in the homepage or layouts.
4. Production build succeeds (`pnpm build` or whatever the sandbox uses).

---

Pocock's distinctive moves, in case useful as backdrop:
- **Progressive disclosure**: SKILL.md stays short; details live in sibling `.md` files (LANGUAGE.md, ANTI-PATTERNS.md, INTERFACE-DESIGN.md, etc.) loaded only when needed.
- **Vertical slices over horizontal layers** in TDD, to-issues, prototype.
- **Interview-style skills** (grill-me, grill-with-docs) as one-question-at-a-time dialogues with recommended answers.
- **Domain glossaries (CONTEXT.md)** as shared vocabulary across skills.

The vertical-slice and glossary patterns don't transplant — sandbox's experiments are already vertical by construction, and a shared glossary is overkill for one-shot prototypes. The three moves below are the ones where Pocock's repo genuinely improves on what sandbox has.

---

## Move 1 — Apply progressive disclosure to the biggest sandbox skills

**The pattern.** Pocock's larger skills (`tdd`, `improve-codebase-architecture`, `diagnose`) keep SKILL.md to 70–120 lines and offload depth to sibling reference files. The SKILL.md routes; the references explain. Claude loads the reference file only when the relevant phase of the skill is active.

**Sandbox candidates, by size:**
- `vercel-react-best-practices` — 6.2K lines, 60 files. Already follows this pattern (it's an external library). Leave it.
- `supabase` — **773 lines, single file.** The standout case. Mixes a top-level routing layer with migration recipes, type-gen workflows, edge function snippets, and schema-validation playbooks. Most of that is reference material — it doesn't need to sit in the trigger payload every time the skill loads.
- `sketch` — 225 lines. Narrative-heavy. Could split into `SKILL.md` (when to use, kickoff prompts) + `ANTI-PATTERNS.md` (no data layer, no routing, no premature componentization).
- `promote` — 200 lines. Full pipeline doc. Candidate to split into `SKILL.md` (the pipeline steps) + `QUALITY-CHECKLIST.md` (the per-step criteria).
- `animation-audit` — 190 lines. Candidate to split: `SKILL.md` (audit flow) + `MOTION-RECIPES.md` (spring presets, stagger patterns).
- `sanity-check` — 182 lines. Could split into `SKILL.md` + `CHECKLIST.md` (React/TS/Next.js red flags).

**Rationale.** Sandbox's CLAUDE.md is explicit about terseness, and several skills are doing the opposite — front-loading reference material into the trigger context. Splitting reduces tokens at load, makes each skill scannable, and makes the reference material editable without churning the SKILL.md trigger description. `supabase` alone is the strongest case: 773 lines is the kind of thing Pocock would refactor first.

**Suggested order.** Start with `supabase` (highest ROI, clearest separation between routing and recipes). Then `sketch` and `promote` since they're load-bearing in the design pipeline. Defer the audit skills unless the pattern proves itself.

---

## Move 2 — Port `write-a-skill` (adapted for sandbox conventions)

**Source:** `skills/skills/productivity/write-a-skill/` (117 lines, single SKILL.md).

**What it does.** Walks the user through authoring a new skill: gather requirements, draft SKILL.md with proper frontmatter, decide whether sibling reference files are needed, review against examples.

**Why it fits sandbox.** Sandbox has 16 skills and clearly accumulates more (`gen-image`, `replace`, `link`, `note` look recent). They're inconsistent in shape: some are tight and narrative (`note`, `replace`), some are sprawling single files (`supabase`, `sketch`). A scaffolder establishes a house style. Combined with Move 1, this becomes the lever that prevents the next sandbox skill from being another 773-line monolith.

**Adaptation.** Don't lift verbatim — Pocock's version assumes his glossary and ADR culture. The sandbox version should:
- Default to single-file SKILL.md unless the skill exceeds ~150 lines, then prompt for splits.
- Match sandbox frontmatter conventions (`name`, `description`, optional `metadata`).
- Encode the design-pipeline aesthetic (narrative kickoff, terse rules, no emojis per CLAUDE.md).

---

## Move 3 — Port `grill-me` verbatim (10 lines)

**Source:** `skills/skills/productivity/grill-me/SKILL.md` (~10 lines).

**What it does.** Interviews the user about a plan one question at a time, providing a recommended answer with each question. Lets the user say "yes, that one" instead of writing prose.

**Why it fits sandbox.** The design-experiment pipeline currently jumps from "I have an idea" straight to `sketch` or `design-experiment`. When the brief is vague — "something with cards but more architectural" — the prototyping pass wastes iterations on resolvable ambiguity. A 10-line grill skill in front of the pipeline costs nothing and reduces wasted sketches. It's the cheapest possible port from Pocock's repo, and its pattern (one question + recommended answer) suits a solo developer who doesn't want to write specs.

**Adaptation.** None needed. Lift the file as-is.

---

## What I'm explicitly NOT recommending

- **`tdd`, `to-issues`, `to-prd`, `triage`** — sandbox doesn't use TDD or an issue tracker workflow. Wrong tool for the repo's character.
- **`diagnose`** — designed for production bugs with reproducible feedback loops. Sandbox is a sketchpad; diagnose's overhead doesn't pay off here.
- **`git-guardrails-claude-code`** — adds friction to a solo direct-push workflow.
- **`setup-pre-commit`** — same. Sandbox values iteration speed over guardrails.
- **`caveman`** — sandbox CLAUDE.md already establishes terseness.
- **`handoff`** — redundant with the global `continue-prompt` skill you already have.
- **`zoom-out`** — depends on a CONTEXT.md glossary that sandbox doesn't have and shouldn't need.
- **`prototype`** — sandbox's `sketch` + `design-experiment` already cover this beat, and arguably better for visual work.
- **`improve-codebase-architecture`** — its "deepening opportunities" framing could subtly improve sandbox's `promote` skill, but porting the whole skill is overkill. Worth keeping in mind as a one-line addition to `promote` if Move 1 happens.

---

## Critical files (read-only references)

- Pocock's `write-a-skill` source: `/Users/joshcoolman/repos/skills/skills/productivity/write-a-skill/SKILL.md`
- Pocock's `grill-me` source: `/Users/joshcoolman/repos/skills/skills/productivity/grill-me/SKILL.md`
- Pocock's progressive disclosure example: `/Users/joshcoolman/repos/skills/skills/engineering/tdd/` (SKILL.md + 5 reference files)
- Sandbox `supabase` (heaviest split candidate): `/Users/joshcoolman/repos/sandbox/.claude/skills/supabase/SKILL.md`
- Sandbox `sketch`: `/Users/joshcoolman/repos/sandbox/.claude/skills/sketch/SKILL.md`

## Verification (if/when implemented)

- **Move 1 (split):** After splitting, the skill still works end-to-end — invoke it the way you normally do and confirm reference files get pulled in at the right phase. No behavior regressions.
- **Move 2 (`write-a-skill` port):** Use it to author a tiny test skill in sandbox; confirm the resulting skill loads, has valid frontmatter, and matches sandbox conventions.
- **Move 3 (`grill-me` port):** Invoke it before `sketch` on a deliberately vague brief; confirm it asks single questions with recommended answers and that the resulting `sketch` prompt is sharper than the original brief.

---

## Recommended order

1. **Move 0** — `/plans` route in sandbox (so we can view this and future plans as HTML).
2. **Move 3** — port `grill-me` (cheapest, 10 lines, immediate value).
3. **Move 1** — split `supabase` (biggest single token-cost reduction).
4. **Move 2** — port `write-a-skill` adapted (compounds with Move 1 going forward).
