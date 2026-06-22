An agent-first utility that extends an image to a new aspect ratio so the added region looks intentional, not pasted. The "I have this, I need it at 21:9 for the hero" problem.

Its verifier is **vision**: the agent generates the extension, looks at the seam, regenerates the region that doesn't hold up, and repeats — under a hard iteration cap. That loop is the whole point; without it you have a one-shot generate button and a lot of bad seams.

Like its sibling tools, its expertise lives in a legible `knowledge/` folder. A photographer's outpainter and an architect's outpainter run the exact same mechanism and differ only in that markdown — which makes this the clearest demonstration of knowledge as an extension surface.

The lane is welded: it adds believable surrounding content and repairs the seam. It does not generate from scratch, edit what's inside the original, remove objects, restyle, or upscale.

Status: planned. Scaffolded and runnable, but real development begins after palette-forge ships. This repo holds the shape while the flagship proves the pattern.
