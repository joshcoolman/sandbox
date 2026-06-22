---
title: "The verifier caught its own mistake"
date: 2026-06-22
phase: agent-loop
verdict: reversed
excerpt: "First real render, a loud red badge — and the tool flagged a bug in its own rulebook before a human noticed."
---

The goal for the first real session was to build the foundations and a first walkable version of the whole experience — without spending a single token. That sounds backwards for an AI tool, but it was the most important call of the day.

### Build the journey before you call the model

Everything sits behind one seam: a `PaletteEngine` interface. Behind it today is a *simulated* engine — deterministic, no API key, no cost — that produces palettes from plain math. The real Claude-powered engine drops in behind the same seam later.

Why fake it first? The thing that makes this app feel good — the animation, the scoring, the branching, the rhythm of watching the agent work — is all front-end. Tuning that against a live API would be slow and would burn tokens on every tiny iteration. The simulator pays for itself three more times over: it's the demo you see before you've added a key, the fallback when you don't have one, and the test fixture for the agent loop. It was the single most load-bearing decision.

The experience itself became a **vertical descent** rather than a flat grid of swatches. Each move the agent makes is a scene that animates in; you pick a fork; it scrolls to the next; the trail stays behind you as a record of how you got here. The first sketch was the obvious contact-sheet of N variations — rejected as generic. Making the agent's reasoning into something you can *walk* is the "designer who builds agents" idea made literal.

### The bet paid off in development, not just in the demo

Here's the part worth telling. The rule for which color pairings to check, and to what standard, lives in the knowledge markdown — not in code. I wrote one in: `text-on-accent` must hit AA contrast.

The very first generated palette rendered it failing at 2.41, a loud red badge. And it wasn't a fluke — that pairing is *physically unsatisfiable*. Dark text on a dark accent simply cannot reach the 4.5:1 line; even pure black on that accent caps out around 2.2. The rule itself was wrong.

The free verifier had caught a mistake in its own rulebook before any human had to notice it. That's the entire thesis — an agent that can check its own work — paying off during the build, for the builder. Reversed the rule to `background-on-accent` (a light label on the accent button), which is both realistic and achievable. Scores jumped from 85 to 89 the moment the impossible pairing was gone.

### Then: everything looked the same

The other honest stretch of the day. The first palettes were washed out and nearly indistinguishable from one another — two separate bugs. The neutrals were almost pure white, so light mode read as a stark field with a single accent and no real color presence. And the variation cards all showed the same mocked-up app with a tiny accent dot, so genuinely different palettes looked identical at thumbnail size.

This is where the *other* verifier — a human with taste — did its job, over two rounds of feedback. The fixes: give neutrals a perceptible tint with a hard floor so they can never go pure white; widen the gap between background and surface (two near-whites that sit too close read as one blob); rotate the *whole* palette's hue across the four variations instead of just nudging the accent; and rebuild the cards as color-forward swatch bands. The full app mock now appears only in the final detail view, where it earns its place.

### Where it stands

The full journey runs end to end on the simulated engine: a source color in, the agent's directions, scored variations, a final palette with honest light and dark previews. Still ahead: the interactive half (revisiting the trail, branching from any fork, a "more like this" refine bar), persistence and export, and then the real Claude engine behind that same seam. The heuristics the simulator is teaching us — the tint floors, the separation, the hue spread — are written to carry straight into the prompt we'll eventually give the model. The fake version is quietly writing the spec for the real one.
