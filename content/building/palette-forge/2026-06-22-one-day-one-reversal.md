---
title: "The whole build in a day — and one idea thrown out"
date: 2026-06-22
phase: byok
verdict: reversed
excerpt: "The tool caught a bug in its own rulebook, the real engine dropped in on the first try — and the color-theory idea it was built on got cut."
---

### The agent has a free referee

The whole bet is that an agent earns its place here only because color has a free, automatic verifier — contrast is math, not opinion. The first real palette proved it. A rule I'd written by hand — "text on the accent must hit AA" — rendered a loud red failure on the very first render. Not a fluke: that pairing is physically unsatisfiable (dark text on a dark accent can't reach 4.5:1). The tool caught a mistake in its own rulebook before I did. I reversed the rule to a light label on the accent, and scores jumped.

### Faking it first paid off twice

The entire journey — animation, scoring, branching, the feel of watching the agent work — was built against a deterministic simulator behind one engine seam: no key, no tokens. When the real Claude engine dropped into that exact socket, it worked on the first run. The simulator didn't get thrown away; it's now the no-key demo, the fallback, and the test fixture. Code owns the verifier and picks the winner — Claude composes and explains, but never grades its own work.

### Then I cut the core idea

The hard part. The app was built on color theory — triadic, complementary, the wheel. In a single-accent UI palette those types are invisible: every variation collapsed to "neutrals plus one accent." People don't think in wheel types anyway; they think in vibes — Braun, Teenage Engineering. So v1 got reframed: image in, four distinct UI palettes, "surprise me," characters instead of taxonomy. Fewer concepts, less code, better output. The contrast engine, the six roles, light and dark, the refine-and-branch trail all stayed welded — only the framing that never worked got removed.

Where it stands: live on a real key, "surprise me" shipped, the geometric library cards next.
