An agent-first utility for building accessible color palettes. You hand it an image or a single seed color; it proposes refined light and dark palettes, checks every pairing against WCAG contrast itself, self-corrects until it passes, and fans out variations. You are the final word on taste.

The reason an agent earns its place here — and doesn't in most apps that bolt one into a sidebar — is that color has a **free, automatic verifier**: contrast ratio is math, not opinion. So there are two checks stacked on every output: contrast (non-negotiable, the machine's job) and you (taste, live). Delete the agent and what's left is a color picker. The agent *is* the product.

The distinctive bet is the `knowledge/` folder: plain markdown you can read and rewrite. It both guides what the agent proposes and is the rubric it judges against. Change the markdown, change the output — no code required. That's the whole thing made legible.

The lane is welded: image or seed color in, palettes out. Not a design-system builder, not an image editor, not a SaaS. You can retune *what good color means*; you can't talk it into being something else.

This is the flagship of three small agent-first tools being built in public. It goes first, all the way to shipped, before the others get real attention — one shipped tile beats three planned ones.
