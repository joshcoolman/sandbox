---
name: update-my-work
description: Audit the user's public GitHub repos with `gh` and sync the /building page to match -- add new repos, refresh what changed, drop repos that went private or were deleted. Regenerates each repo's plain-fact detail (what it does, an ASCII structure, a few highlights) into lib/projects/data.ts. Report-first; never writes without approval. Use when the user says "update my work", "sync my repos", "I made a new repo", "refresh the building page", or "which repos are on my site".
---

# update-my-work

Keep the `/building` page in sync with the user's public GitHub repos. Run it after shipping, renaming, or creating a public repo; it reconciles the whole set in one pass. Assume public = belongs on the page (don't ask per repo) unless it's on the ignore list.

Everything lives in one typed file -- `lib/projects/data.ts` -- as a flat list of repos with plain facts. No status split, no editorial storytelling, no separate content directory.

## Usage

```
/update-my-work              # sync every eligible public repo
/update-my-work palette-forge  # refresh a single repo
```

## The shape of each entry

Each repo is one `Project` (`app/types/projects.ts`): `slug`, `name`, `repo`, optional `liveUrl`, `tagline`, `stack[]`, `whatItDoes`, `structure` (ASCII tree), `highlights[]`. The detail page at `/building/[slug]` renders these directly.

Voice: plain facts, present tense, no hype, no story. A stranger should be able to tell what the tool is and whether to open it.

- **tagline** -- one line, the hook under the name.
- **whatItDoes** -- one short paragraph. What you give it, what it returns, one thing that makes it interesting.
- **structure** -- a curated ASCII tree of the *meaningful* directories (usually 4-6), each with a short annotation. Never dump the raw top-level; drop config noise (`.github`, `eslint.config`, lockfiles, `.vscode`).
- **highlights** -- 2-4 bullets of decision-useful facts (deploy target, key constraint, a notable feature). Put the live URL in `liveUrl`, not a highlight.

## Steps

1. **Enumerate.** `gh repo list --visibility public --no-archived --json name,description,primaryLanguage,pushedAt,isFork --limit 100`
2. **Filter.** Drop forks, the sandbox site repo itself, and the ignore list. The user has excluded `bootstrap`. Ignore list is configurable -- when unsure, ask once, not per repo.
3. **Gather real facts** per repo (read-only `gh`):
   - `gh api repos/<owner>/<repo>/readme --jq .content | base64 -d | head -60` -- what it does, stack, live URL, status
   - `gh api repos/<owner>/<repo>/git/trees/HEAD --jq '.tree[] | select(.path | test("/") | not) | .path + " (" + .type + ")"'` -- top-level entries to curate the ASCII tree from
   - `gh api repos/<owner>/<repo>/commits --jq '.[0:12] | .[].commit.message'` -- recent work for highlights
4. **Reconcile** against `lib/projects/data.ts`:
   - *New repo* -> author a full entry.
   - *Existing repo* -> refresh any field that drifted (tagline, whatItDoes, stack, structure, highlights, liveUrl).
   - *Entry whose repo is gone/private/archived* -> propose removal.
5. **Report first.** Present findings grouped **Add / Update / Remove / No change**, showing current vs proposed for changed fields. WAIT for approval.
6. **Apply** approved edits to `lib/projects/data.ts` only. Then run the follow-ups below.

## Guardrails

- Never fabricate. The ASCII tree must reflect directories that exist (from the tree API); annotations come from the README, not imagination. If a repo is thin or empty, say so and give a minimal entry.
- One source of truth: `lib/projects/data.ts`. There is no `content/` layer and no dated log entries -- don't recreate them.
- Report-first always. No writes before approval.

## After applying

- Typecheck: `node_modules/.bin/tsc --noEmit` (the `tsc` binary isn't on PATH; call it directly).
- If repos were added/removed, check the SEO checklist in `CLAUDE.md` (`sitemap.ts`, `llms.txt`, `llms-full.txt`).
- End with the uncommitted-changes readout (the readout rule).

## Optional: align GitHub descriptions

Secondary, only if asked: after syncing the site, propose accurate (not cute) GitHub repo descriptions and apply with `gh repo edit <repo> --description "..."`. Keep it report-first too.
