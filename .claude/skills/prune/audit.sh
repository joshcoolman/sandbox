#!/bin/sh
# Read-only dead-code audit for the sandbox. NEVER deletes anything.
# Used by the /prune skill (full report) and the pre-push hook (--summary).
#
#   sh .claude/skills/prune/audit.sh            # full report, all categories
#   sh .claude/skills/prune/audit.sh --summary  # one-line nudge iff high-confidence orphans; silent otherwise
#
# Always exits 0 — this is a signal, never a gate.

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0

registered=$(grep -oE "slug: '[^']+'" lib/experiments/data.ts 2>/dev/null | sed "s/slug: '//;s/'//")

unregistered=""
for d in app/design-experiments/\(experiments\)/*/; do
  [ -d "$d" ] || continue
  slug=$(basename "$d")
  echo "$registered" | grep -qx "$slug" || unregistered="$unregistered $slug"
done

orphan_shots=""
for f in public/screenshots/*.png; do
  [ -f "$f" ] || continue
  base=$(basename "$f" .png)
  echo "$registered" | grep -qx "$base" || orphan_shots="$orphan_shots $f"
done

unused_components=""
for c in app/design-experiments/components/*/; do
  [ -d "$c" ] || continue
  name=$(basename "$c")
  refs=$(grep -rl "$name" --include='*.tsx' --include='*.ts' app lib 2>/dev/null | grep -v "components/$name/")
  [ -z "$refs" ] && unused_components="$unused_components $name"
done

# Categories 1-3 are high-confidence (drive the nudge). Category 4 is review-only.
high=$(printf '%s%s%s' "$unregistered" "$orphan_shots" "$unused_components" | tr -s ' ')

if [ "$1" = "--summary" ]; then
  [ -z "$high" ] && exit 0
  n=$(printf '%s' "$high" | wc -w | tr -d ' ')
  echo "Prune audit: $n possible orphan(s) ($(printf '%s' "$unregistered$orphan_shots$unused_components" | xargs)) — run /prune to review (non-blocking)"
  exit 0
fi

# Full report
echo "=== Unregistered experiments (not in data.ts) ==="
[ -n "$unregistered" ] && for s in $unregistered; do echo "  $s"; done || echo "  none"
echo "=== Orphan screenshots ==="
[ -n "$orphan_shots" ] && for s in $orphan_shots; do echo "  $s"; done || echo "  none"
echo "=== Unused shared components ==="
[ -n "$unused_components" ] && for s in $unused_components; do echo "  $s"; done || echo "  none"
echo "=== Maybe-orphan public dirs (review manually — many are CSS/asset-referenced) ==="
for d in public/*/; do
  [ -d "$d" ] || continue
  name=$(basename "$d")
  grep -rq "/$name/" --include='*.tsx' --include='*.ts' app lib 2>/dev/null || echo "  $d"
done
exit 0
