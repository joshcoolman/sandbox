An agent-first utility that improves a prompt against a stated problem. "Too verbose, too many canned phrases, bland image results" goes in; a version that fixes exactly what you flagged comes out.

Its verifier comes from two honest places: **your complaint** — a checkable standard anchored to a real defect — and the standing `knowledge/` rubric of what good prompt-craft looks like. The loop improves, checks against both, and revises until satisfied. The most fun file is `anti-patterns.md`: a living blocklist of phrases that produce mush. The app literally gets better as you grow it.

The lane is welded: it improves a prompt against a problem. It is not a prompt library, not a chat playground, not a benchmark suite. You retune what good prompt-craft means via `knowledge/` only.

There are two depths, and the shallow one ships first: a complaint-driven improver now, and — only if it earns it — a later optimizer that treats a system prompt as the thing being optimized against a held-out test set, with a score you can watch climb.

Status: planned. Scaffolded and runnable; real development begins after palette-forge ships.
