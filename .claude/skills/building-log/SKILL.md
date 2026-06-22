---
name: building-log
description: Distill a project's raw repo log/ into an editorial progress entry for its /building page. Reads the sibling repo's log/, git history, and README/SPEC, then drafts a consumable "follow along" entry for review.
---

# building-log

Turn a project repo's raw working log into an editorial progress entry on its `/building/<project>` page.

The raw `log/` in each project repo is a faithful, jargon-heavy record (the "why" behind the diffs). The sandbox tells the *story*. This skill bridges them: it reads the raw material and drafts a consumable entry. It never publishes the raw log verbatim.

## Usage

```
/building-log palette-forge
/building-log            # infers the project if obvious from context
```

## What it does

1. Resolve the project slug. It must exist in `lib/projects/data.ts` with status `in-development`. The repo is a sibling clone at `../<slug>/`.
2. Read the source material:
   - Raw entries: `../<slug>/log/*.md` (skip `log/README.md`).
   - Recent history: `git -C ../<slug> log --pretty=format:"%h | %ad | %s" --date=short` (last ~15).
   - Framing, if needed: `../<slug>/README.md`, `../<slug>/docs/OVERVIEW.md`, `../<slug>/docs/SPEC.md`.
3. Determine what's new since the last published entry by comparing dates against existing files in `content/building/<slug>/`.
4. Draft ONE editorial entry covering the new ground.
5. Write it to `content/building/<slug>/YYYY-MM-DD-slug.md` (today's date — run `date +%Y-%m-%d`). If that filename exists, append `-2`, `-3`, etc.
6. Show the draft and stop. Do NOT commit — Josh edits first.

If the repo has no `log/` yet, fall back to README/SPEC + git history and say so.

## Entry format

```markdown
---
title: "Short, evocative — a headline, not a filename"
date: YYYY-MM-DD
phase: agent-loop        # scaffolding | agent-loop | knowledge | byok | shipped
verdict: reversed        # optional: kept | reversed | open
excerpt: "One-line teaser for the timeline."
---

Editorial body in the documentary beat (see below).
```

- `phase` = where the project is in its arc (match the dominant phase of the work covered).
- `verdict` = use `reversed` when the entry's main story is an approach tried and abandoned (the highest-value beats). Omit if it doesn't apply.

## The documentary beat (the body)

Shape each entry as a story, not a changelog:

- **Where we were / what we set out to do.**
- **The question or problem.**
- **The bet — the direction taken, and *why*** (the part the diff can't show).
- **What happened** — including, prominently, anything that didn't work and what was learned. Dead-ends and reversals are the best material.
- **Where it stands / what's next.**

## Voice

- Editorial and consumable. Technical terms are fine; this isn't dumbed down. But it is NOT the raw log.
- **Cut the insider noise.** Drop file paths, exact error codes, tool/config quirks, port numbers — anything that only matters to someone in the code. Keep the reasoning and the human story.
- Lead with the strongest beat. If the free verifier caught a real bug, or a confident approach collapsed, open there.
- Plain and direct over clever. No marketing, no hype, no emojis.
- One entry tells one or two beats well. Don't try to cover everything in the log — that's what the log is for.

## After drafting

Remind Josh the draft is uncommitted and the entry renders at `/building/<slug>` once saved. The dev server for sandbox is `npm run dev` (:3000); project repos may use other ports (palette-forge is :3001).
