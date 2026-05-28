---
title: "Shadcn has an AI problem"
subtitle: "The library everyone loves was built for a world that's ending."
date: 2026-05-28
author: Josh Coolman
readingTime: 5 min
---

I used Shadcn for a long time. I don't anymore. And the reason I stopped is the same reason I think the whole project is quietly on the wrong side of history.

Let me be fair to it first, because it earned that. Shadcn is genuinely well made. It's composable, it grows, you copy the components into your repo and you own them. If all you want is to read the docs, follow the conventions, and skin the thing with your brand colors, it's about as smooth as it gets. I'm not here to dunk on the craft. The craft is real.

## It's not magic. It's a formula.

People talk about Shadcn like it's some singular invention. It isn't. And realizing that is the whole key to seeing the problem.

Shadcn is a combination. Radix UI for accessible behavior, plus Tailwind for styling, plus React for composition. That's it. That's the recipe. Radix + Tailwind + React = Shadcn.

And it goes further than that. The moment you reach for one of the more sophisticated components, you find it's not really Shadcn at all. The calendar is react-day-picker. The carousel is Embla. The charts are Recharts. Shadcn didn't build a calendar. It wrapped one that already existed and gave it a coat of Tailwind. The component you copied into your repo is, underneath, a skin over a mature library you didn't know you were depending on.

I'm not saying that to knock it. Standing on the shoulders of well-built libraries is the right instinct. You don't rewrite a date picker for fun. But it does dispel the magic. There's no secret sauce in there. It's good plumbing and a consistent paint job.

And at the time, that was a genuinely sharp move. We were all crawling out from under the monolithic component libraries: the big, opinionated, all-or-nothing kits that fought you the moment you wanted something they didn't ship. Shadcn said: don't install a library, copy the code, own it, and let best-in-class tools each do the one thing they're great at. That was fresh. That was wise. I'm not revising history. It deserved the hype it got.

But a formula that was perfect for one moment can quietly become wrong for the next. The combination didn't change. The world reading it did. And now that same clever stack is starting to come at a cost.

## Humans don't write the code anymore

Here's the thing nobody's saying out loud: I'm not the one typing anymore.

When I open a Shadcn component now, I'm not reading it. The AI is. And what the AI finds is a 60-line button where the actual button is one line and the rest is a Tailwind megastring. A single undifferentiated blob where the focus ring, the disabled state, the brand color, and the icon-sizing hack are all smashed together with no seams. A human wrote that once and never had to look at it again. The AI has to read it every single time.

## The Elephant in The Room

Tailwind. Love it or hate it, it was a great answer to a real question: how do I style things fast without leaving my markup or inventing a hundred class names? For a human hand-coding all day, that was a genuine win.

But that was the bottleneck then. It isn't the bottleneck now. I'm not hand-coding. I don't need utility classes to save me keystrokes. I need code a machine can read and reason about. And a wall of utilities is the opposite of that. We're still paying for a convenience nobody at my desk is using.

## The token problem

This is the part that actually matters. Abstraction, for a human, is compression. It saves you typing and remembering. Abstraction, for an agent, is a tax you pay on every read.

The AI has to load that megastring, mentally expand it, and sort out which classes are taste and which are load-bearing accessibility contract. The format threw that distinction away. Every. Single. Time. You don't save anything. You hand the model a puzzle and ask it to re-solve it forever.

Compare it to a plain CSS module. You open it and go "oh, that's the brand color, that's the radius, that's the hover state." You change it with confidence. You ask for changes with confidence. The whole point of Shadcn was ownership, but in practice almost nobody radically customizes it. They recolor it and ship. That's why every Shadcn site looks like every other Shadcn site. The customization story is a story.

## The Smoking Gun

Have a quick read of the Shadcn skill. It's a confession.

The skill is a set of instructions for AI agents on how to use the library. I went in expecting documentation. It's not documentation. It's a list of rules. Don't override the colors. Don't touch the typography. Don't use this spacing utility, use that one. Don't put a z-index there. className is for layout, not styling. Page after page of don't.

You don't write a wall of guardrails for something that's easy to work with. You write guardrails because the abstraction makes the wrong move easy and the right move invisible, and you're terrified the agent is going to wander into the megastring and break something. The skill isn't teaching the AI to use Shadcn. It's babysitting the AI inside an abstraction that was never built for it.

## Back to Basics

Boring works. Syntactic sugar and utility classes worked for me when I did everything by hand. Now I don't, and the bottleneck moved. What I need is code an agent can read at a glance.

None of this is Shadcn's fault, exactly. It's a human-era library, and a good one. It just landed in an agentic era it wasn't designed for, and the seams are showing.

So here's my actual proposal, and I'm not hiding my cards. Build your own library. Keep it stupidly simple. Markdown and CSS modules.

Make it agent-first from the ground up. Keep the one genuinely hard part. The headless accessible behavior. Rewriting focus traps from scratch is how you hurt yourself. Throw out the styling cleverness. Flat code. Legible CSS. Document each component in a little markdown file that lives right next to it, so the thing is self-documenting. The AI reads one folder and knows exactly what the component does, how to restyle it, how to add a feature. Not "here's what you're not allowed to touch." "Here's how to change it."

Use Shadcn as a reference, not a dependency. Mine it for the good ideas, leave the abstraction behind.

The basic idea is this.

```
ui/
└── Button/
    ├── Button.tsx
    ├── Button.module.css
    └── Button.md
```

Markup. Style. Instructions. Three files an agent can read without guessing.

Because that's the quiet shift. We spent fifteen years optimizing code for how fast a human could write it. The bottleneck moved. Now the question is how cheaply a machine can understand it. And on that test, all our beautiful abstractions are starting to look expensive.

Shadcn won the last era. I just don't think it's built for this one.

P.S. This site you're reading? No Shadcn. No Tailwind. No Radix. Just CSS modules and markdown. It was easier than you'd think.
