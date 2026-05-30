---
title: "Shadcn has an AI problem"
subtitle: "The library everyone loves was built for a world that's ending."
date: 2026-05-28
author: Josh Coolman
readingTime: 6 min
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

## The Elephant in the Room

Tailwind. Love it or hate it, it was a great answer to a real question: how do I style things fast without leaving my markup or inventing a hundred class names? For a human hand-coding all day, that was a genuine win.

But that was the bottleneck then. It isn't the bottleneck now. I'm not hand-coding. I don't need utility classes to save me keystrokes. I need code a machine can read, reason about, and change without breaking. That's a different test, and the wall of utilities was never built to pass it.

## It's not the tokens. It's the indirection.

Let me be precise, because this is where the argument usually goes wrong. People say the megastring costs more tokens to read. It doesn't, really. A Tailwind class is *shorter* than the CSS it stands for. I'll give it that.

The tax isn't the reading. It's the changing. And remember, I'm not the one changing it anymore. The agent is.

So watch what the agent has to do for a single style tweak. Read the class. Recall what `rounded-md` actually resolves to. Hunt for the token that lands where I asked. Is it `rounded-lg`? `rounded-xl`? Then hope it picked the right step on a scale it's holding in its head. And before it touches any of it, sort out which classes are taste and which are the load-bearing `focus-visible:ring-2` it must not break. Every edit is a round-trip through a vocabulary it has to translate, in both directions.

A plain CSS module has no vocabulary. The property name *is* the concept. The brand color, the radius, the hover state, all sitting in the open. The agent changes the value and moves on. It works with confidence, and so I ask with confidence.

And it gets worse exactly where it should get better. The moment I want something off the grid, say a bespoke radius or an organic gradient, Tailwind either snaps the agent to the nearest preset, silently wrong, or leaves it writing `rounded-[14px] bg-[radial-gradient(...)]`. CSS through a straw. Now it's paying the translation tax just to get back to what plain CSS would have handed it for free.

So here's the whole thing in one line. Tailwind compressed the writing. It taxed the changing. That was a brilliant trade when a human did the writing. It stopped making sense when a machine took over the changing.

And look at what nearly everyone does with all that owned, customizable code: they recolor it and ship. That's why every Shadcn site looks like every other Shadcn site. The customization story is a story.

## The Smoking Gun

Have a quick read of the Shadcn skill. It's a confession.

The skill is a set of instructions for AI agents on how to use the library. I went in expecting documentation. It's not documentation. It's a list of rules. Don't override the colors. Don't touch the typography. Don't use this spacing utility, use that one. Don't put a z-index there. className is for layout, not styling. Page after page of don't.

You don't write a wall of guardrails for something that's easy to work with. You write guardrails because the abstraction makes the wrong move easy and the right move invisible, and you're terrified the agent is going to wander into the megastring and break something. The skill isn't teaching the AI to use Shadcn. It's babysitting the AI inside an abstraction that was never built for it.

## Back to Basics

Boring works. Syntactic sugar and utility classes worked for me when I did everything by hand. Now I don't, and the bottleneck moved. What I need is code an agent can read at a glance.

None of this is Shadcn's fault, exactly. It's a human-era library, and a good one. It just landed in an agentic era it wasn't designed for, and the seams are showing.

So here's my actual proposal, and I'm not hiding my cards. Build your own library. Keep it stupidly simple. Markdown and CSS modules.

Keep the one genuinely hard part. But keep the *knowledge*, not the *dependency*. The accessibility contract is real: what a focus trap has to do, which keys move focus, what a screen reader needs to hear. That's the part you don't get to wing. So learn it from the references, then write it plainly yourself. The contract is the asset. The library was only ever one way to ship it.

Throw out the styling cleverness. Flat code. Legible CSS. Document each component in a little markdown file that lives right next to it, so the thing is self-documenting. The agent reads one folder and knows exactly what the component does, how to restyle it, how to add a feature. Not "here's what you're not allowed to touch." "Here's how to change it."

The basic idea is this.

```
ui/
└── Button/
    ├── Button.tsx
    ├── Button.module.css
    └── Button.md
```

Markup. Style. Instructions. Three files an agent can read without guessing.

## What's in the repo is the convention

Use Shadcn as a reference, not a dependency. Mine it for the good ideas, leave the abstraction behind.

And it has to be reference and not dependency for a reason beyond taste. An agent doesn't learn your conventions from a rules file. It learns them from what's already sitting in the repo. Whatever's installed *is* the convention. It sees Tailwind and Shadcn there and reasonably concludes that's how things are done here, and reaches for them, whatever your guardrails say. Presence is endorsement.

So the most powerful thing about a from-scratch library isn't what it adds. It's what it leaves out. Strip the escape hatches and the only thing left to imitate is your own legible code. The empty space does the work.

## It compounds

Here's the part I didn't expect. When the code is flat and the patterns repeat, the codebase itself becomes the source of truth. The agent doesn't need a separate style guide. It reads what's already there, picks up the rules by example, and builds the next thing to match. Every component you add makes the next one easier, because there's one more honest reference sitting in the open.

Abstraction breaks that loop. When the real decisions are buried in an upper-level library, your own code stops being able to teach. The agent has to go spelunking through a dependency just to understand a button, and the bigger your app gets, the more of it is hidden somewhere else. Flat code keeps the decisions in plain sight, where they can be read, copied, and extended. The codebase gets more useful as it grows, not less.

Flat is the new black.

Because that's the quiet shift. We spent fifteen years optimizing code for how fast a human could write it. The bottleneck moved. Now the question is how cheaply a machine can understand it. And on that test, all our beautiful abstractions are starting to look expensive.

Shadcn won the last era. I just don't think it's built for this one.

P.S. This site you're reading? No Shadcn. No Tailwind. No Radix. Just CSS modules and markdown. It was easier than you'd think.
