---
name: sketch
description: Rapid visual prototyping. Paint with code — get ideas on screen fast from a text description or pasted image. No architecture, no data layer.
---

# sketch

Rapid visual prototyping. Paint with code — no architecture, no data layer, no framework opinions. Get ideas on screen fast and iterate until it feels right.

## Usage

```
/sketch A yoga breathing app with an animated circle and calming gradients
/sketch Dashboard sidebar with collapsible sections and icon nav
/sketch A music player card with progress bar and album art
/sketch [pasted image]
/sketch [pasted image] "Make it dark mode with rounder corners"
```

## Starting From an Image

When the user pastes an image (screenshot, Dribbble shot, photo of a whiteboard, UI mockup), that IS the brief. Don't ask clarifying questions. Don't write a plan. Just look at the image and start building what you see.

**Read the image for:**
- Layout structure (grid, sidebar, stacked, centered)
- Color palette (extract the dominant 3-5 colors, use them)
- Border radius, spacing density, visual weight
- Typography feel (tight/airy, serif/sans, bold/light)
- Component patterns (cards, lists, tabs, charts, navbars)
- Content — use the actual text from the image when visible, or invent realistic equivalents

**Don't try to be pixel-perfect.** Capture the spirit — proportions, color temperature, density, hierarchy. The user will refine from there. Get the first version on screen and let the back-and-forth begin.

If the user includes a note alongside the image (e.g., "like this but dark mode"), apply that as an overlay on what you see. The image is the base, the note is the modifier.

## Mindset

This is a design sketch, not an engineering task. The user is exploring — they don't know exactly what they want yet. They'll know it when they see it. Your job is to get something visual on screen immediately and then iterate fast based on what they react to.

**You are a design partner, not an engineer.** Think in terms of:
- Does this *look* right?
- Does the layout *feel* balanced?
- Is the visual hierarchy clear?
- Do the animations feel natural?

Do NOT think about:
- Type safety, prop interfaces, generics
- Component reusability or extraction
- Data fetching, API design, error handling
- Accessibility compliance, SEO, performance
- File organization, barrel exports, index files

All of that comes later. Right now, we're sketching.

## Rules

### Two Files: page.tsx + styles.css
Each sketch gets a `page.tsx` and a `styles.css` in the same directory. Import the stylesheet at the top of the page:

```tsx
import './styles.css';
```

Put layout, colors, typography, animations, hover states, pseudo-elements — everything visual — in `styles.css` with plain class names. Use inline `style={{}}` only for truly dynamic values (computed positions, state-driven transforms).

This gives full CSS power: pseudo-elements, media queries, complex selectors, keyframe animations, `:hover`/`:focus`/`:nth-child` — things that are impossible or awkward with inline styles alone.

**No Tailwind.** This project doesn't use it. No CSS Modules either — just plain `styles.css` with descriptive class names.

### No Component Libraries
Do NOT import shadcn, Radix, Headless UI, or any component library unless the user explicitly asks for it. Build visual elements from raw HTML + CSS:

- **Buttons**: `<button className="primary-btn">` styled in CSS
- **Dropdowns**: A `div` with `useState` toggle and absolute positioning
- **Tabs**: Buttons that swap a state variable, conditional rendering
- **Modals**: Fixed overlay with a centered card
- **Toggles**: A `div` with CSS transitions and onClick
- **Inputs**: Native `<input>` styled in CSS

This keeps the visual decisions in your hands, not a library's.

### Icons via Lucide
Use `lucide-react` (already installed) for icons. They're clean, consistent, and don't impose design opinions:

```tsx
import { Play, Pause, Settings, ChevronDown } from 'lucide-react';
<Play className="w-5 h-5" />
```

### Hardcoded Everything
No data fetching. No real API calls. No database. Hardcode all content directly in the JSX. Use realistic-looking content — real words, plausible numbers, actual labels — not "Lorem ipsum" or "Item 1, Item 2."

State is `useState` only. If something needs to persist across refreshes, `localStorage` is fine. That's the ceiling.

### No Build Checks
Do NOT run `npm run build` between iterations. The user is running the dev server and watching changes live. Just edit the file and let hot reload do its thing. Only run a build when the user says the sketch is done.

## Workflow

### Getting Started

1. Create `app/design-experiments/[name]/styles.css` with the visual foundation
2. Create `app/design-experiments/[name]/page.tsx` with `'use client';` and `import './styles.css';`
3. Get the first version on screen — fast. Something visible. Don't overthink it.
4. Tell the user what's on screen and wait for direction.

Do NOT add the experiment to the gallery. This is a sketch — it's not shipped yet.

### Iterating

The user will give loose, visual direction:
- "Make the corners rounder"
- "Add a gradient, something warm"
- "I need a settings gear icon in the top right"
- "This needs a spring-like bounce animation"
- "The spacing feels too tight"
- "Can we try a dark version?"
- "Add tabs here — maybe 3 tabs"

Respond to these quickly. Small, targeted edits. Don't refactor surrounding code while making visual changes. Touch only what was asked about.

If the user says something vague like "this doesn't feel right" or "something's off," make your best design judgment call and show them a change. It's easier to react to something concrete than to articulate what's wrong with an abstract feeling.

### Animations

CSS transitions and animations are a key part of sketching. Define them in `styles.css`:

```css
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}
.breathe { animation: breathe 4s ease-in-out infinite; }

.card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
```

- **Spring effects**: Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for overshoot
- **Staggered entries**: Use `transition-delay` with incrementing values or `:nth-child` selectors

### When It's Done

The user will say something like "this is it" or "I'm happy with this." At that point:

1. Run `npm run build` to verify it compiles
2. Suggest next steps:
   - `/ship-experiment` to screenshot and publish as-is
   - `/promote` to extract the reusable component with proper TypeScript
   - Keep iterating if there's more to explore

## What Good Sketches Look Like

- **Visually complete** — looks like a real UI, not a wireframe
- **Fake-interactive** — buttons highlight on hover, tabs switch, dropdowns open
- **Opinionated** — you made color/spacing/typography choices, not defaults
- **Cohesive** — consistent border radius, color palette, spacing scale
- **Alive** — subtle transitions, hover states, maybe a micro-animation or two

## What Sketches Are NOT

- Production code
- Accessible
- Responsive (unless the user asks)
- Type-safe
- Well-organized
- Reusable
- Tested

All of that comes later. This is the napkin drawing.

## Example Interactions

### From a text description
```
User: /sketch A yoga breathing app with an animated circle

[Create page.tsx with a centered circle that scales up/down
 on a calming gradient background, a play/pause button below,
 "Breathe In / Breathe Out" text that alternates]

You: Breathing circle is on screen — pulsing animation on a
soft blue-to-purple gradient, play/pause toggle below.
Take a look and tell me what direction to go.

User: Love the gradient. Circle needs to be bigger, and
I want the text to fade in/out, not just switch

[Edit: scale up the circle, add opacity transition to text]

User: Yes. Now add a settings panel — maybe a
bottom sheet with timing controls

[Add a slide-up panel with fake sliders for inhale/exhale duration]
```

### From a pasted image
```
User: /sketch [pasted image of a calendar timeline widget]

[Look at the image. See: dark background, vertical timeline,
 colored bars for events, hour labels on the left, card details
 on the right. Build it immediately — match the colors, spacing,
 layout proportions]

You: Timeline is on screen — dark background, 8 hour slots
with colored event bars and cards. Matched the layout from
your image. What do you want to change?

User: The event bars should be thinner, and add icons
inside them

[Edit: reduce bar width, add Lucide icons per event type]

User: Now I want a "now" line that shows the current time

[Add a horizontal red line positioned by current hour/minute]
```

## Notes

- This skill is the starting point of the pipeline: `/sketch` → `/promote` → production component
- Don't add to the experiments gallery until the user ships with `/ship-experiment`
- If the user wants to switch from sketch mode to proper development mid-stream, that's fine — the sketch becomes the starting point and you can begin structuring it
- Google Fonts can be added via `next/font/google` import if the user wants specific typography — keep it to 1-2 fonts max during sketching
