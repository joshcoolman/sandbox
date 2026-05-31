# sketches

Scratch space for `/sketch`. Rapid visual prototypes that are **not part of the site**.

## The contract

- Each sketch is a folder here with a `page.tsx` + `styles.css`, viewable live at `/design-experiments/sketches/<name>` while the dev server runs.
- Sketches are **never** registered in `lib/experiments/data.ts`, so they never appear in the gallery, sitemap, or homepage. The site discovers experiments from `data.ts` alone — it does not scan folders — so nothing here can leak into production.
- Because nothing links to them, **anything in this folder is safe to delete**. Removing a sketch breaks nothing.

## Lifecycle

```
/sketch              ->  app/design-experiments/sketches/<name>/   (here, unlinked, disposable)
/design-experiment   ->  app/design-experiments/(experiments)/<name>/ + entry in data.ts   (real experiment)
```

A sketch is a dead end by design — it doesn't graduate itself. When an idea is worth keeping, start a fresh `/design-experiment` that references the sketch; that builds the real, registered version in `(experiments)/`. The sketch stays here as scratch until you delete it, and clearing out stale ideas is a no-risk `rm`.
