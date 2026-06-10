---
name: prune
description: Audit the sandbox for dead code — unregistered experiments, orphan screenshots/assets, unused shared components — and safely remove confirmed cruft. Report-first; never deletes without showing findings and confirming.
---

# prune

Find and (after confirmation) remove dead code in the sandbox. The hazard isn't finding orphans — it's deleting something that only *looks* orphaned (a sketch is unlinked on purpose; a component is imported by one experiment). This skill encodes what's safe to flag, what to never touch, and how to verify before committing.

## Usage

```
/prune              # audit + report, then ask before removing anything
/prune --report     # audit only, never delete
```

## Golden rules

1. **Report first, delete never-by-default.** Always print the findings table and get explicit confirmation per category before removing anything.
2. **Unregistered ≠ dead.** Sketches and barrel-imported components are unregistered yet alive. Verify before flagging.
3. **Code lives in git history.** Deletion is recoverable, so prefer removing confirmed cruft over leaving it — but only what the checks below prove is orphaned.
4. **Never flag the safelist** (see below).

## Safelist — never flag these

- `app/sketches/**` — intentionally unlinked from the site (CLAUDE.md). Not dead code.
- Anything under `app/(blog)/`, `app/(news)/`, `app/(docs)/`, `app/x/` content — these are content surfaces, not experiments.
- A shared component that *any* file imports — confirm with the usage check before flagging (the `EditorialBrief` → `retro-tech` lesson).
- `layout.tsx` / `layout.module.css` in the experiments route group.

## Audit

Run the shared detection script — it's the single source of truth (the pre-push hook calls the same script in `--summary` mode):

```bash
sh .claude/skills/prune/audit.sh
```

It prints the four categories below. The logic, for reference (keep `audit.sh` and this in sync if you change either):

```bash
# Registered experiment slugs are the source of truth for what's "live".
registered=$(grep -oE "slug: '[^']+'" lib/experiments/data.ts | sed "s/slug: '//;s/'//")

# 1. Unregistered experiments — on disk under (experiments)/ but not in data.ts.
#    These are built-then-abandoned routes (invisible to gallery/home/sitemap).
for d in app/design-experiments/\(experiments\)/*/; do
  slug=$(basename "$d")
  echo "$registered" | grep -qx "$slug" || echo "UNREGISTERED experiment: $slug"
done

# 2. Orphan screenshots — public/screenshots/*.png with no matching registered slug.
for f in public/screenshots/*.png; do
  base=$(basename "$f" .png)
  echo "$registered" | grep -qx "$base" || echo "ORPHAN screenshot: $f"
done

# 3. Unused shared components — in components/ but imported by nothing.
for c in app/design-experiments/components/*/; do
  name=$(basename "$c")
  refs=$(grep -rl "$name" --include='*.tsx' --include='*.ts' app lib | grep -v "components/$name/")
  [ -z "$refs" ] && echo "UNUSED component: $name"
done

# 4. Maybe-orphan public asset dirs — a /dir/ in public not referenced in code.
#    LOWER confidence (screenshots/, fonts, etc. are referenced indirectly) —
#    always eyeball each before removing.
for d in public/*/; do
  name=$(basename "$d")
  grep -rq "/$name/" --include='*.tsx' --include='*.ts' app lib 2>/dev/null \
    || echo "MAYBE-orphan public dir: $d (review manually)"
done
```

For each **unregistered experiment**, before calling it dead, also confirm it's referenced nowhere else:

```bash
grep -rn "<slug>" --include='*.ts' --include='*.tsx' --include='*.md' --include='*.json' . \
  | grep -v node_modules | grep -v "/<slug>/"
```

No hits → truly orphaned. Hits in `data.ts`/sitemap/README → it's actually wired in; do not flag.

## Report

Print a table: item, category, confidence, evidence (e.g. "no refs outside its own dir", "imported by retro-tech → keep"). Then ask the user which categories to remove. An unregistered-but-finished experiment has a second option — **ship it** instead of deleting (register in `data.ts` + SEO files via `/ship-experiment`).

## Remove (only confirmed items)

```bash
git rm -r <paths...>          # route dir, its public/<slug>/ assets, its screenshot
```

## Verify before committing — REQUIRED

Deleting a route leaves a stale Next.js route validator that fails `tsc`. Clear it first:

```bash
rm -rf .next/dev/types .next/types   # drop stale generated route types (the pre-push gotcha)
npm run typecheck                    # must pass
npm run build                        # must succeed
```

If `typecheck` errors with `Cannot find module '.../<deleted>/page.js'`, that's the stale cache — the `rm -rf` above fixes it. (The user's dev server can also regenerate it; re-run the `rm` + typecheck if it reappears.)

## Commit

```bash
git add -A
git commit -m "Prune <what> — <why orphaned>"
git push   # pre-push hook re-runs typecheck
```

Describe in the body what was removed and the evidence it was dead, and note "code remains in git history if needed."

## Auto-nudge (pre-push hook)

The `.git/hooks/pre-push` hook runs `audit.sh --summary` after typecheck. If high-confidence orphans (categories 1–3) exist, it prints a one-line "run /prune" heads-up and lets the push proceed — it never blocks, and stays silent when clean. Category 4 (maybe-orphan public dirs) never triggers the nudge.

Git hooks live in `.git/hooks/` (untracked), so a fresh clone won't have it. `audit.sh` itself is tracked, so the skill always works; only the auto-nudge needs the hook line re-added after `npm run typecheck`:

```sh
sh .claude/skills/prune/audit.sh --summary 2>/dev/null
```

## Notes

- This audit is intentionally narrow — it targets the orphan classes that actually occur in this repo, not generic unused-export hunting. Widen it only when a new orphan class shows up.
- `app/design-experiments/(experiments)/` is the only place experiments live now; if that ever splits again, update audit step 1's glob.
