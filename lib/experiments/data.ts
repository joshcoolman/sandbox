import type { Experiment } from '@/app/types/experiments'

export const experiments: Experiment[] = [
  {
    slug: 'image-to-ui',
    date: 'March 8, 2026',
    title: 'Image to UI',
    description:
      'Interactive components reverse-engineered from reference images. Each component is parameterized with inputs and open-ended outputs, designed as a family with shared dark-theme design tokens. Rotary selector, and more to come.',
    screenshot: '/screenshots/image-to-ui.png',
    tags: ['Components', 'Interactive', 'Dark UI', 'Animation'],
  },
  {
    slug: 'candy-icons',
    date: 'March 4, 2026',
    title: 'Candy Icons',
    description:
      'Ten 3D app icons crafted from pure CSS and SVG. Each squircle shell uses a four-layer gradient stack — specular streak, diffuse highlight, body gradient, and depth shadow — driven by a single --hue custom property. Inner glyphs float as icy raised elements with their own drop-shadow treatment. No 3D libraries, no canvas — just gradients all the way down.',
    screenshot: '/screenshots/candy-icons.png',
    tags: ['SVG', 'CSS Gradients', 'Specular', '3D Icons'],
    theme: 'light',
    bgTop: '#ffffff',
    bgBottom: '#d4d0c8',
  },
  {
    slug: 'card-stack',
    date: 'March 2, 2026',
    title: 'Card Stack',
    description: 'Scroll-driven card stack with seven colored cards. Scroll peels cards off the top to reveal the next. Each card expands to fullscreen with a GSAP-powered zoom transition. Built with GSAP ScrollTrigger.',
    screenshot: '/screenshots/card-stack.png',
    tags: ['GSAP', 'Scroll Animation', 'Cards', 'Interactive'],
  },
  {
    slug: 'retro-bento',
    date: 'February 23, 2026',
    title: 'Retro Bento',
    description: 'What if CrossFit Bento and Retro Tech had a baby? Nine fictional hardware modules in a bento grid -- the interactive widget layout of CrossFit Bento meets the brushed aluminum, LCD panels, and tactile controls of Retro Tech. Temporal gauge with animated needle, flux capacitor, spectral analyzer, neural pathways LED matrix with staggered animations, entropy engine with escalating states, phase scope with rotating arcs, memory bank with fader-driven scroll, resonance monitor, and stasis chamber. Knobs drag horizontally, toggles glow orange, tapping panels randomizes with smooth transitions.',
    screenshot: '/screenshots/retro-bento.png',
    tags: ['Bento Grid', 'Hardware UI', 'CRT Display', 'SVG Animation'],
    theme: 'light'
  },
  {
    slug: 'retro-tech',
    date: 'February 20, 2026',
    title: 'Retro Tech Control Panel',
    description: 'Hardware-inspired control panel rendered in CSS. Aluminum chassis with corner screws, OLED-style display with animated segmented LED meters, rotary knobs with drag interaction, vertical faders, toggle switches, tactile buttons, and a self-filling perf-grid speaker grille. Inspired by Teenage Engineering TP-7/TX-6, Braun noise gate pedal, and Work Louder numpad. DM Mono labels with Archivo Narrow model name. Warm gray surface palette with single orange accent.',
    screenshot: '/screenshots/retro-tech.png',
    tags: ['Hardware UI', 'Neumorphic', 'Interactive Controls', 'CSS Animation'],
    theme: 'light'
  },
  {
    slug: 'crossfit-bento',
    date: 'February 20, 2026',
    title: 'CrossFit Bento',
    description: 'Dark bento grid dashboard for CrossFit training data. Nine widget cards covering goal progress, calorie tracking, weekly training load bar chart, GitHub-style activity heatmap with flame icons on peak days, WOD stats, macro donut chart, exercise log with PR badges, heart rate zones, and sleep stages. DM Sans body with Geist Pixel Square for technical labels. Matte finish palette -- orange, olive, brown accents on near-black.',
    screenshot: '/screenshots/crossfit-bento.png',
    tags: ['Bento Grid', 'Dashboard', 'Geist Pixel', 'Dark Theme']
  },
  {
    slug: 'sticky-notes',
    date: 'February 18, 2026',
    title: 'Sticky Notes',
    description: 'Interactive sticky note stack component. Post-it notes rendered from markdown files with swipe-to-cycle animation, color variants (warm, cool, neutral), and Permanent Marker handwriting font. Click to expand, click to cycle, Escape to close. Portable design -- consumer passes a notes directory path, so any page can use it with its own content.',
    screenshot: '/screenshots/sticky-notes.png',
    tags: ['Component', 'CSS Animation', 'Markdown Content', 'Portable'],
    theme: 'light'
  },
  {
    slug: 'contact-sheet',
    date: 'February 17, 2026',
    title: 'Contact Sheet',
    description: 'Image folder browser for building file lists to share with LLMs. Pick a folder, click images to select them, and a sidebar shows your selections with thumbnails. Copy the filename list to clipboard with one click. Designed for the workflow of visually identifying images then telling an LLM which ones to work with. Everything runs client-side -- nothing gets uploaded.',
    screenshot: '/screenshots/contact-sheet.png',
    tags: ['Utility', 'File API', 'Client-Side', 'Dark Theme']
  },
  {
    slug: 'font-pairings',
    date: 'February 15, 2026',
    title: 'Font Pairings',
    description: 'A collection of 40 curated Google Font pairings, each displayed on its own color-palette card. Click any card to copy an LLM-ready specification prompt. Includes superfamily pairings, monospace+sans combos, and brand design system fonts. Avoids overused defaults -- no Montserrat, Roboto, Open Sans, Lato, Playfair Display, Raleway, Poppins, or Inter. Static HTML with inline CSS, no framework.',
    screenshot: '/screenshots/font-pairings.png',
    tags: ['Typography', 'Font Pairings', 'Static HTML', 'Copy-to-Clipboard']
  },
  {
    slug: 'modular-grid',
    date: 'February 14, 2026',
    title: 'Modular Grid',
    description: 'Swiss-inspired modular grid system for digital surfaces. 8px base unit, 4-column layout with proportional margins and gutters, strict vertical rhythm. Includes toggleable grid overlay, type specimen, image treatment demos, and system spec table. Dark mode adaptation of a print-precision layout methodology.',
    screenshot: '/screenshots/modular-grid.png',
    tags: ['Grid System', 'Swiss Design', 'Dark Mode', 'Typography']
  },
  {
    slug: 'day-at-a-glance',
    date: 'February 12, 2026',
    title: 'Day at a Glance',
    description: 'Time-aware workday timeline with dynamic now-line that tracks real time. Features 9am-5pm schedule with colored event bars that partially fill as the hour progresses -- gray above the now-line, color below. Past events auto-dim. Built with CSS grid, inline linear-gradient for the fill effect, and 60-second interval updates.',
    screenshot: '/screenshots/day-at-a-glance.png',
    tags: ['CSS Grid', 'Timeline', 'Dynamic State', 'Dark Theme']
  },
  {
    slug: 'crossfit-challenge',
    date: 'February 9, 2026',
    title: 'CrossFit Design Challenge',
    description: 'Four AI personas -- brutal/industrial, minimal/refined, editorial/magazine, and tech/data-forward -- each designed a CrossFit homepage for IRON REPUBLIC gym. Dark mode across all designs, meaningful animation (glitch effects, scroll reveals, chart animations), and data visualization (SVG charts, radial indicators, bar graphs). Pure CSS animations, no external libraries.',
    screenshot: '/screenshots/crossfit-challenge.png',
    tags: ['Dark Mode', 'CSS Animation', 'Data Viz', 'Agent Teams']
  },
  {
    slug: 'terminator',
    date: 'February 6, 2026',
    title: 'Terminator - Text Scramble',
    description: 'Interactive terminal-style text scramble effect with two-phase animation. Enter custom text to see it scramble chaotically for 1 second, then resolve sequentially line-by-line. Features balanced line breaking and automatic uppercase conversion. Default text: Ghost in the Shell quote on identity and consciousness.',
    screenshot: '/screenshots/terminator.png',
    tags: ['Text Animation', 'Terminal UI', 'Interactive', 'Split-Flap Effect']
  },
  {
    slug: 'brand-guidelines',
    date: 'February 6, 2026',
    title: 'Brand Guidelines',
    description: 'Interactive brand guidelines with live color and typography customization. Features animated Activity line chart and Analytics bar chart widgets with CSS-only animations. Click the gear icon for a push-in sidebar with color pickers using Chroma.js scale generation and 9 curated font pairings. All changes persist via localStorage.',
    screenshot: '/screenshots/brand-guidelines.png',
    tags: ['React Components', 'Animated Charts', 'Color Systems', 'Typography']
  },
  {
    slug: 'blend',
    date: 'February 2, 2026',
    title: 'Blend',
    description: 'Swiss modernist gradient specimen system featuring organic mesh gradients via SVG blur technique. Includes 27 gradient cards across linear and mesh styles, systematic labeling, scroll-triggered animations, and an analytics dashboard mockup.',
    screenshot: '/screenshots/blend.png',
    tags: ['Gradient Study', 'SVG Mesh', 'Swiss Design', 'Scroll Animation']
  }
]
