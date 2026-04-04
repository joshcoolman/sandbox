---
name: blog-post
description: Draft a blog post from conversation context. Creates a markdown file with frontmatter and placeholder image so it's immediately visible on the homepage and blog index.
---

# blog-post

Draft a blog post from conversation context. Creates the markdown file with a placeholder image so it's immediately visible on the homepage and blog index.

## Usage

```
/blog-post                              # Interactive -- asks what to write about
/blog-post "Design as Dialogue"         # Title provided, drafts from conversation context
```

## Workflow

### 1. Gather Inputs

- **Title** (required) -- from argument or ask the user
- **Subtitle** (optional) -- ask if not obvious from context
- **Slug** -- derive from title: lowercase, hyphens, no special chars

### 2. Research

Before writing, gather context:
- Read existing posts in `blog/` to match voice and editorial style
- Check conversation history and any relevant Wispr Flow transcripts
- Check auto memory for notes on the topic

### 3. Draft the Post

Write in the style of the existing posts in `blog/`. The writing philosophy:

- **Short paragraphs.** 2-4 sentences max. White space is structure.
- **Concrete over abstract.** "200 pixels to 100 pixels" not "iterative refinement." Specific details from real work, not theory.
- **One thesis.** Every post makes one point. Say it early, support it with examples, end when the point is made.
- **Conversational but declarative.** Write like you talk, but land on strong statements. No hedging, no "in conclusion."
- **No preamble.** Start with the meat. Open with a concrete observation, not a setup.
- **End sharp.** The last line should hit. One sentence. Sometimes one word.
- **200-400 words is the sweet spot.** If it's longer, you're probably making two points. Split it.
- **Essays, not documentation.** No headers unless the post genuinely needs sections. Most don't.

**Example of a well-written personal post:**

> I don't code much anymore, if at all, but I sure do talk a lot. You hear this from more and more engineers, and it's true. The shift has gone from trying to get AI to do what I want, to talking with AI to figure out what the hell it is I'm doing. It's much more conversational.
>
> I remember when I first started, I was like, make a button, make it bigger, move it over here, no, there, no, you're doing it wrong. I thought AI was stupid, and I just didn't get AI.
>
> Everything changed when I replaced my keyboard with a microphone. The light went on. I'm looking at code, talking about the code, making decisions, correcting the AI when it makes plans. As far as code is concerned, I'm just a spectator.
>
> It's not about the code. It's about the conversation.
>
> Back in the day — which was like a year and a half ago — I used to pride myself on knowing the ins and outs. Prop drilling. Custom hooks. The difference between SSR and CSR. How to make shadcn components look bespoke instead of off-the-shelf. All that became a liability. I was too busy telling AI what to do instead of working with AI on what I wanted.
>
> There's this Seinfeld episode where Kramer's phone number is too close to Moviefone, so he just starts being the movie phone guy. He's reading the newspaper trying to help callers, doing the whole "Press one for Firestorm, press two..." thing. People get confused. Eventually he just says, "Why don't you just tell me what movie you want to see?"
>
> That's where we are right now. We're all learning to just talk to AI. Learning to use our words. Everything changed, and we're still figuring it out.

### 4. Generate Front Matter

```yaml
---
title: "Post Title"
subtitle: "Optional subtitle"
date: YYYY-MM-DD  # today's date
author: Josh Coolman
---
```

### 5. Write File

Save to `blog/{slug}.md` in the sandbox root.

### 7. Create Placeholder Image

Copy the master placeholder to `public/blog/{slug}.png`:

```bash
cp public/blog/placeholder.png public/blog/{slug}.png
```

This is a real 1200x630 dark gray PNG. It shows up correctly in blog cards and on the homepage. To replace it, the user just saves a real image to the same path -- same name, same extension. Everything just works.

### 7. Production Build

```bash
npm run build
```

Fix any errors before reporting success.

### 8. Report

Confirm:
- Post drafted at `blog/{slug}.md`
- Placeholder image at `public/blog/{slug}.png`
- Viewable at `/blog/{slug}`
- Appears on homepage Blog column and blog index
- Build passed
- Remind: replace placeholder with real image at `public/blog/{slug}.{png,jpg,webp}`

## Key Decisions

- **This is a draft** -- the post will be iterated on after creation
- **Does NOT auto-commit** -- review before committing
- **Does run build** -- catches errors immediately
- **Always creates placeholder image** -- so cards render properly from the start
- **Reads conversation context** -- the best posts come from real conversations

## File Locations

- Posts: `blog/{slug}.md`
- Master placeholder: `public/blog/placeholder.png` (1200x630 dark gray PNG)
- Post images: `public/blog/{slug}.png` (placeholder initially, save over with real image)
- Blog index: `/blog`
- Individual post: `/blog/{slug}`
