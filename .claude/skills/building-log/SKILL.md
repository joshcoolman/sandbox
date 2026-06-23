---
name: building-log
description: Distill a project's raw repo log/ into an editorial progress entry for its /building page. Reads the sibling repo's log/, git history, and README/SPEC, then drafts a consumable "follow along" entry for review.
---

# building-log

Turn a project repo's raw working log into an editorial progress entry on its `/building/<project>` page.

The raw `log/` in each project repo is a faithful, jargon-heavy record (the "why" behind the diffs). The sandbox tells the *story*. This skill bridges them: it reads the raw material and drafts a consumable entry. It never publishes the raw log verbatim.

**Log shape (current):** repos keep **one file per date** — `log/YYYY-MM-DD.md` — holding many short recap-shaped beats (Changed / recap / **Why**), newest at the bottom. A single day's file can cover the whole arc. This skill maps **one log date → one editorial entry**, picking the 2-3 strongest beats from that day rather than narrating all of them.

## Usage

```
/building-log palette-forge
/building-log            # infers the project if obvious from context
```

## What it does

1. Resolve the project slug. It must exist in `lib/projects/data.ts` with status `in-development`. The repo is a sibling clone at `../<slug>/`.
2. Read the source material:
   - Daily logs: `../<slug>/log/YYYY-MM-DD.md` (skip `log/README.md`).
   - Recent history: `git -C ../<slug> log --pretty=format:"%h | %ad | %s" --date=short` (last ~15).
   - Framing, if needed: `../<slug>/README.md`, `../<slug>/docs/OVERVIEW.md`, `../<slug>/docs/SPEC.md`.
3. Find the uncovered log dates: list `log/*.md` dates, list the dates already published in `content/building/<slug>/`, and target the log dates that have no entry yet. (One log date → one editorial entry. If a published entry exists for a date but the log gained material since, regenerate that one entry rather than adding a second for the same date.)
4. For each uncovered log date, draft ONE editorial entry — pick the **2-3 strongest beats** from that day (reversals and free-verifier catches first); don't narrate every beat. Honor the ~200-300 word skim budget below.
5. Write each to `content/building/<slug>/YYYY-MM-DD-<headline-slug>.md`, where the date is the **log date** (not today's), and `<headline-slug>` is a short slug from the entry's headline. One entry per date keeps the timeline ordering clean (the loader sorts by date).
6. Show the draft(s) and stop. Do NOT commit — Josh edits first.

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
- **Sub-sections inside the body use `###` (h3), not `##`.** The entry title already renders at the section-head (h2) size, so a `##` in the body competes with it; `###` sits correctly beneath.

## The documentary beat (the body)

Shape each entry as a story, not a changelog:

- **Where we were / what we set out to do.**
- **The question or problem.**
- **The bet — the direction taken, and *why*** (the part the diff can't show).
- **What happened** — including, prominently, anything that didn't work and what was learned. Dead-ends and reversals are the best material.
- **Where it stands / what's next.**

## Voice

- **Short and skimmable.** A reader should get the gist running their eye down the page — highlight-first, not an essay. Tight paragraphs (2-4 sentences), the lead sentence carrying the point. Aim for ~200-300 words total. Cut anything that isn't a meaningful highlight.
- Editorial and consumable. Technical terms are fine; this isn't dumbed down. But it is NOT the raw log.
- **Cut the insider noise.** Drop file paths, exact error codes, tool/config quirks, port numbers — anything that only matters to someone in the code. Keep the reasoning and the human story.
- Lead with the strongest beat. If the free verifier caught a real bug, or a confident approach collapsed, open there.
- Plain and direct over clever. No marketing, no hype, no emojis.
- One entry tells one or two beats well. Don't try to cover everything in the log — that's what the log is for.

## After drafting

Remind Josh the draft is uncommitted and the entry renders at `/building/<slug>` once saved. The dev server for sandbox is `npm run dev` (:3000); project repos may use other ports (palette-forge is :3001).
