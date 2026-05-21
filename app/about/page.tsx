// This page was generated from the /explore-repo Claude skill against ~/repos/sandbox.
// To regenerate: run `/explore-repo ~/repos/sandbox` in Claude Code, then re-port the
// resulting ~/repos/sandbox-analysis.html into this file (strip the app-ideas /
// "Porting to Other Projects" section).
// The skill is independent — updating it does not auto-update this page.

import type { Metadata } from "next";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About this repo",
  description:
    "Architectural review of the sandbox repo: shape of the app, gallery and experiment patterns, frontend conventions, cross-cutting concerns, and the file map.",
};

export default function AboutPage() {
  return (
    <main className={styles.root}>
      <div className={styles.wrap}>
        <header>
          <div className={styles.eyebrow}>Architectural Review</div>
          <h1>Sandbox: Design Experiments</h1>
          <p className={styles.lede}>
            A Next.js-based playground for rapid visual prototyping. Self-contained
            experiments, data-driven gallery, no test suite, shipping design patterns.
          </p>
        </header>

        <nav className={styles.toc}>
          <h3>Contents</h3>
          <ol>
            <li><a href="#shape">The Shape</a></li>
            <li><a href="#gallery">Gallery &amp; Experiments Architecture</a></li>
            <li><a href="#patterns">Per-Experiment Patterns</a></li>
            <li><a href="#frontend">Frontend Patterns</a></li>
            <li><a href="#cross-cutting">Cross-Cutting Concerns</a></li>
            <li><a href="#highlights">Patterns Worth Stealing</a></li>
            <li><a href="#concerns">Concerns &amp; Red Flags</a></li>
            <li><a href="#product">What This Really Is</a></li>
            <li><a href="#keyfiles">Key File Map</a></li>
          </ol>
        </nav>

        <h2 id="shape">1. The Shape</h2>

        <p>
          <strong>Framework &amp; Deployment:</strong> Next.js 16.1.6 on Vercel. Server
          components + client components, SSR-rendered, live at joshcoolman.com. View
          Transitions API for page curtain effects (globals.css, lines 39–143). Dynamic
          routes under <span className={styles.filepath}>app/design-experiments/(experiments)/</span>{" "}
          — parenthesized folders for route layout organization.
        </p>

        <p><strong>Stack:</strong></p>
        <ul>
          <li>Next.js 16.1.6 with React 19, TypeScript 5.9</li>
          <li>CSS Modules + raw CSS (no Tailwind lock-in)</li>
          <li>Animation: GSAP (ScrollTrigger, timeline), Motion (layout animations), vanilla JS/Canvas/WebGL</li>
          <li>Styling system: 4 Google Fonts (Karla, Bitter, Lora, Space Mono) + custom color tokens (globals.css)</li>
          <li>AI integration: Anthropic SDK (monono, chatroom experiments)</li>
          <li>Data sources: Markdown files, TypeScript data objects (static), Cloudflare Durable Objects (chatroom)</li>
          <li>Analytics: Vercel Analytics</li>
        </ul>

        <p>
          <strong>Build:</strong> <code>npm run dev</code> (port 3000),{" "}
          <code>npm run build</code>, <code>npm run start</code>. Next.js handles
          everything; no custom build step. Trailing slash disabled (next.config.js line
          4). View Transitions experimental flag enabled (line 6).
        </p>

        <p>
          <strong>Deployment:</strong> Vercel auto-builds on git push. Env vars for gated
          experiments (Monono, Chatroom). Rate limiting via Upstash Redis (optional
          local, required prod). Chatroom experiment also deploys a Cloudflare Worker
          with a Durable Object and SQLite state.
        </p>

        <h2 id="gallery">2. Gallery &amp; Experiments Architecture</h2>

        <h3>Discovery &amp; Registration</h3>

        <p>
          Hand-curated array in <span className={styles.filepath}>lib/experiments/data.ts</span> (228
          entries). Each experiment is a TypeScript object with slug, date, title,
          subtitle, description, screenshot path, tags, and optional theme/colors.
        </p>

        <table>
          <thead>
            <tr><th>Field</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td>slug</td><td>URL route identifier and data key</td></tr>
            <tr><td>date</td><td>Reverse-chronological ordering</td></tr>
            <tr><td>screenshot</td><td>Gallery thumbnail (next/image)</td></tr>
            <tr><td>tags</td><td>Filter / discovery hint</td></tr>
            <tr><td>theme / bgTop / bgBottom</td><td>Light/dark mode + gradient overrides for gallery card</td></tr>
          </tbody>
        </table>

        <p>
          No manifest generator or build-time discovery. Gallery is always{" "}
          <strong>manually updated</strong>. This is deliberate: experiments live in{" "}
          <span className={styles.filepath}>app/design-experiments/(experiments)/</span> and are
          registered by hand in the data array. New experiment = add folder + add entry
          to data.ts.
        </p>

        <h3>Gallery Rendering</h3>

        <p>
          <span className={styles.filepath}>app/design-experiments/page.tsx</span> (server) imports
          data and builds a runnable map, filtering gated experiments by env vars.{" "}
          <span className={styles.filepath}>GalleryClient.tsx</span> (client) renders:
        </p>
        <ul>
          <li>ExperimentRow for runnable experiments: screenshot thumbnail (next/image), title, date, full description, tag pills</li>
          <li>PlaceholderRow for gated experiments: &quot;requires setup&quot; stub, lists missing env vars</li>
          <li>IntersectionObserver for lazy stagger animations (visible class toggled on scroll)</li>
          <li>SessionStorage scroll restoration: returns user to same card after clicking back</li>
        </ul>

        <p>
          <span className={styles.filepath}>app/design-experiments/GalleryClient.tsx</span> line
          42–56: observer watches <code>.experiment</code> elements, adds visible class on
          10% threshold, staggered by data-delay attribute.
        </p>

        <h3>Metadata &amp; SEO</h3>

        <p>
          <span className={styles.filepath}>lib/experiments/metadata.ts</span>:{" "}
          <code>experimentMetadata(slug)</code> returns Next.js Metadata object with title,
          description, OG image. Called by each experiment&apos;s page.tsx (e.g.,{" "}
          <span className={styles.filepath}>
            app/design-experiments/(experiments)/leaderboard/page.tsx
          </span>{" "}
          line 5). Root layout has fallbacks; per-page metadata overrides.
        </p>

        <h3>Environment Gating</h3>

        <p>
          <span className={styles.filepath}>lib/experiments/runnable.ts</span>: hardcoded
          REQUIREMENTS map (lines 12–18) lists which experiments need which env vars.
          Monono needs VERCEL_AI_GATEWAY_KEY. Chatroom needs GATEWAY_KEY + WSS_URL +
          TICKET_SECRET. Galleries show placeholders for gated experiments with helpful
          error text.
        </p>

        <div className={`${styles.callout} ${styles.good}`}>
          <strong>Well-designed gating:</strong> Users see experiments are
          &quot;there&quot; and what&apos;s missing, not silent failures. Environment
          setup is honest and visible.
        </div>

        <h2 id="patterns">3. Per-Experiment Patterns</h2>

        <p>Typical per-experiment folder structure:</p>
        <pre>{`app/design-experiments/(experiments)/<name>/
├── page.tsx              # Server shell, metadata export
├── page.module.css       # Styles (or styles.css for global)
├── components/
│   ├── <Name>Content.tsx # Main client component
│   ├── Subcomponent.tsx  # Extracted components
│   └── *.module.css
├── hooks/
│   └── useCustom.ts
├── data/
│   ├── config.ts
│   └── items.ts
└── README.md             # Optional architect notes (Chatroom example)`}</pre>

        <h3>Representative Experiments</h3>

        <p>
          <strong>CrossFit Bento (Feb 20)</strong> —{" "}
          <span className={styles.filepath}>app/design-experiments/(experiments)/crossfit-bento/</span>
        </p>
        <ul>
          <li>What it demos: Dark bento grid dashboard (3-col, gap-14px), nine data viz widgets, animated count-up numbers, heatmap with randomized data, GitHub-style activity grid with flame icons.</li>
          <li>Techniques: CSS Module grid (page.module.css lines 18–24), Motion layout animations (useCountUp hook line 49), modulo coloring for heatmap (line 56), tabbed state (calories consumed/burned toggle).</li>
          <li>Fonts: DM Sans body + Geist Pixel Square for technical labels (monospace system metric display).</li>
          <li>Components: ProgressRing (SVG circle with rotation transform), StackedBarChart, DonutChart, Heatmap (grid of colored divs with random 0–4 scale), MetricTile, AnimatedCard (Motion wrapper with stagger delay).</li>
          <li>Reusable: ProgressRing, heatmap randomizer, chart components — extracted and could be portable to other dashboards.</li>
        </ul>

        <p>
          <strong>CrossFit Design Challenge (Feb 9)</strong> —{" "}
          <span className={styles.filepath}>app/design-experiments/(experiments)/crossfit-challenge/</span>
        </p>
        <ul>
          <li>What it demos: Four agentic designers each produced a dark-mode gym homepage. Day 2 iteration: added constraints (dark, animation, data viz). Gallery of cards that scale-transform to preview, click to fullscreen each design.</li>
          <li>Techniques: Global styles.css (no modules) with CSS animations (glitch, scroll reveals, chart animations). Four design components (Brutal, Minimal, Editorial, TechData) each with unique CSS feel. Persona data in TypeScript (designers.ts).</li>
          <li>Interesting: Each design is a complete standalone page component. Scale(0.35) on card preview with CSS origin. Accent color per designer (CSS var --accent).</li>
          <li>Code pipeline story: Showcase how different personas produce different outputs from same prompt. Shows &quot;agentic designer&quot; as a viable workflow.</li>
        </ul>

        <p>
          <strong>Kobold Blaster (May 13)</strong> —{" "}
          <span className={styles.filepath}>app/design-experiments/(experiments)/kobold-blaster/</span>
        </p>
        <ul>
          <li>What it demos: Canvas 2D horde shooter. Carl + Princess Donut vs. kobold waves. Chain explosions, combo scoring, CRT overlay, pixel death sequences.</li>
          <li>Techniques: Handwritten game loop (KoboldBlaster.tsx line 1–), sprite crops (hardcoded tight bounding boxes per frame), canvas rendering, physics for bombs.</li>
          <li>Sprite system: CARL_CROPS, KOBOLD_CROPS, DONUT_CROPS — arrays of [sx, sy, sw, sh] cropping rectangles (lines 18–49). Animation frames defined as row/cols/fps. GPT-image-1 generated the sprite sheets; Claude wrote the crop derivation.</li>
          <li>Clever: Decoupled art + code pipelines. GPT-image-1 generated sprites from prompts, returned chroma-keyed PNG. Claude built a pixel scanner to auto-crop tight bounds.</li>
        </ul>

        <p>
          <strong>Ripple Cycle (May 13)</strong> —{" "}
          <span className={styles.filepath}>app/design-experiments/(experiments)/ripple-cycle/</span>
        </p>
        <ul>
          <li>What it demos: Click anywhere, radial ripple wave distorts 6 photos, cross-fade to next. WebGL2 + GSAP animation.</li>
          <li>Techniques: Custom vertex + fragment shaders (VERT_SRC, FRAG_SRC lines 21–78). Aspect-aware ripple (corrects canvas AR so ripple stays circular). Sin-wave displacement with smooth falloff. Sampler with object-fit:contain letterbox logic.</li>
          <li>Interesting: uOrigin uniform tracks click coordinates. Wave frequency and ripple strength are tunable. Falloff guarantees clean start/end (no shimmer artifacts). Shows WebGL2 is still viable and clean for visual effects.</li>
        </ul>

        <h3>Shared Patterns Across Experiments</h3>

        <ul>
          <li><strong>Page.tsx shell:</strong> Always imports experimentMetadata(slug), renders <code>&lt;Content /&gt;</code> component. Server component.</li>
          <li><strong>Content component:</strong> Marked &apos;use client&apos;, imports CSS Modules, renders the UI tree.</li>
          <li><strong>CSS Modules for layout:</strong> Most use page.module.css. Some use component-scoped .module.css files.</li>
          <li><strong>Global styles.css:</strong> Only in a few (crossfit-challenge, ripple-cycle, etc.). Used when global animations or resets are needed.</li>
          <li><strong>Animation libraries:</strong> GSAP (15 experiments), Motion (17 experiments), vanilla CSS (most).</li>
          <li><strong>Image handling:</strong> next/image for thumbnails, public/ folder for experiment assets (public/design-experiments/*, public/ascii-reveal/*, etc.).</li>
        </ul>

        <h2 id="frontend">4. Frontend Patterns</h2>

        <h3>Component Organization</h3>

        <p>
          Per-experiment components live in{" "}
          <span className={styles.filepath}>(experiments)/&lt;name&gt;/components/</span>. Shared
          components (home page, nav, footer) live in{" "}
          <span className={styles.filepath}>app/components/</span>:
        </p>
        <table>
          <thead>
            <tr><th>Component</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td><span className={styles.filepath}>CurtainLink.tsx</span></td><td>View Transitions wrapper for page curtain effect</td></tr>
            <tr><td><span className={styles.filepath}>HomeExperimentCard.tsx</span></td><td>Home page experiment card with screenshot</td></tr>
            <tr><td><span className={styles.filepath}>Sidebar.tsx</span></td><td>Site navigation sidebar</td></tr>
            <tr><td><span className={styles.filepath}>SiteFooter.tsx</span></td><td>Footer with social/links</td></tr>
            <tr><td><span className={styles.filepath}>NetworkCanvas.tsx</span></td><td>Animated background network on home</td></tr>
          </tbody>
        </table>

        <p>
          CurtainLink (lines 1–51) is elegant: wraps Next.js Link, intercepts clicks,
          calls document.startViewTransition() with custom data attributes, cleans up
          after. Enables the wipe-up/down curtain CSS animations (globals.css).
        </p>

        <h3>Styling Conventions</h3>

        <p>
          <strong>CSS Modules dominant:</strong> 78 .module.css files across experiments.
          Each imports fonts locally (via @import url, lines like
          crossfit-bento/page.module.css line 1) or relies on root layout fonts.
        </p>

        <p>
          <strong>Design tokens:</strong> Per-experiment color palettes are inline (no
          global theme). Root globals.css (lines 1–11) defines --site-bg (#0d0d0d),
          --site-text, --light-* variants for light mode. Experiments override with their
          own palettes (crossfit-bento uses orange #e87000, brown #a06020, olive, etc.).
          Cards often have custom CSS vars for accent color.
        </p>

        <p>
          <strong>Typography:</strong> Root layout injects 4 fonts via next/font/google
          (layout.tsx lines 6–32):
        </p>
        <ul>
          <li>Karla (300–600 weight) — default body font</li>
          <li>Bitter (700–800 weight) — headings, serif</li>
          <li>Lora (400–500, italic) — editorial</li>
          <li>Space Mono (400–700) — monospace</li>
        </ul>
        <p>
          Each experiment may load additional fonts (DM Sans, Geist Pixel Square, etc.).
          No shared design system; each experiment is visually autonomous.
        </p>

        <h3>Animation Approach</h3>

        <p>
          <strong>Motion (Framer Motion successor):</strong> 17 experiments use it.
          Primarily for layout animations (reordering, stagger, springs). Leaderboard
          (line 7) uses Motion for row reordering when scores change. AnimatedCard in
          crossfit-bento wraps children with staggered delays.
        </p>

        <p>
          <strong>GSAP:</strong> 15 experiments. ScrollTrigger for scroll-driven
          animations (card-stack, blend). Timelines for complex sequences. Ripple-cycle
          uses GSAP for the animation loop, not DOM elements.
        </p>

        <p>
          <strong>Vanilla CSS:</strong> Most. @keyframes for entrance stagger
          (GalleryClient.tsx data-delay + CSS animation). View Transitions API for page
          transitions (globals.css).
        </p>

        <div className={`${styles.callout} ${styles.good}`}>
          <strong>No animation lock-in:</strong> Experiments freely mix GSAP, Motion, and
          vanilla CSS. Decisions are per-experiment, not architectural mandates. Reduces
          friction for rapid prototyping.
        </div>

        <h3>Image Handling</h3>

        <p>
          next/image for gallery thumbnails (GalleryClient.tsx line 126–132). Raw{" "}
          <code>&lt;img&gt;</code> or Canvas for experiment content. Public folder
          structure:
        </p>
        <ul>
          <li>public/screenshots/ — gallery thumbnails (280x210)</li>
          <li>public/design-experiments/* — per-experiment assets (kobold sprites, ascii photos, etc.)</li>
          <li>public/ascii-reveal/ — portrait photos</li>
          <li>public/staff-photos/ — contact-sheet experiment images</li>
        </ul>

        <p>No image optimization pipeline. Assets are committed to repo. Screenshot URLs hardcoded in data.ts.</p>

        <h2 id="cross-cutting">5. Cross-Cutting Concerns</h2>

        <h3>Tooling &amp; Linting</h3>

        <p>
          No ESLint, no Prettier. TypeScript strict mode (tsconfig.json, line 10). Vite
          in devDeps but not used in build (Next.js handles it). No test suite —
          intentionally omitted. This is a sketchbook, not production code.
        </p>

        <h3>Environment Management</h3>

        <p>.env.local.example (6 vars documented):</p>
        <ul>
          <li>VERCEL_AI_GATEWAY_KEY — Anthropic gateway (required for Monono)</li>
          <li>UPSTASH_REDIS_REST_* — Rate limiting (optional local, required prod)</li>
          <li>NEXT_PUBLIC_CHATROOM_WSS_URL — Cloudflare Worker WSS endpoint</li>
          <li>TICKET_SECRET — HMAC for signed WS upgrade tickets</li>
        </ul>

        <p>
          Env validation is implicit: experiments check <code>process.env[key]</code> and
          degrade gracefully (show placeholder or fallback behavior).
        </p>

        <h3>Rate Limiting &amp; Cost Control</h3>

        <p>
          Monono + Chatroom experiments have per-session budget caps (Upstash Redis).
          Monono has a character limit (Haiku, cheap) and a per-session conversation
          budget. Chatroom has per-IP session counter + global $ cap. See runnable.ts
          and api/monono/route.ts for implementation.
        </p>

        <h3>Deployment &amp; Monitoring</h3>

        <p>
          Vercel Analytics (layout.tsx line 84). Chatroom experiment also deploys a
          Cloudflare Worker (separate repo, not in this tree). Git push → Vercel
          auto-deploy. No staging environment; main branch is live.
        </p>

        <h3>Security</h3>

        <p>
          Chatroom uses signed HMAC tickets for WS upgrade (runnable.ts TICKET_SECRET).
          API routes check cost caps. .env.local is git-ignored. No public API keys
          exposed (Vercel AI Gateway key is secret).
        </p>

        <div className={`${styles.callout} ${styles.warn}`}>
          <strong>Single-env deployment:</strong> No staging; main branch is production.
          Experiments ship directly. For personal sandbox, acceptable; wouldn&apos;t
          scale to team.
        </div>

        <h2 id="highlights">6. Patterns Worth Stealing</h2>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h4>Data-Driven Gallery with Env Gating</h4>
            <p>
              Single TypeScript array (experiments/data.ts) controls what appears where.
              Runnable check determines if full card or placeholder renders. Gated
              experiments are <em>visible</em> but explain what&apos;s missing. Zero
              &quot;silent failures&quot; or hidden routes.
            </p>
            <p className={styles.small}>
              Reusable in: genzen (gating which models are runnable), any tool that ships
              experimental features.
            </p>
          </div>

          <div className={styles.card}>
            <h4>View Transitions API for Page Curtain</h4>
            <p>
              CurtainLink intercepts clicks, starts document.startViewTransition(),
              updates DOM. CSS animations (clip-path wipe) run during transition.
              Graceful fallback if browser doesn&apos;t support. Per-link opt-in, no
              framework overhead.
            </p>
            <p className={styles.small}>
              <span className={styles.filepath}>app/components/CurtainLink.tsx</span>,{" "}
              <span className={styles.filepath}>app/globals.css</span> lines 39–143
            </p>
          </div>

          <div className={styles.card}>
            <h4>SessionStorage Scroll Restoration</h4>
            <p>
              When you click an experiment, save slug to sessionStorage. On back, scroll
              to that experiment&apos;s id in DOM. IntersectionObserver re-triggers
              animations only on first visit (hasVisited flag). Feels fast and
              predictable.
            </p>
            <p className={styles.small}>
              <span className={styles.filepath}>app/design-experiments/GalleryClient.tsx</span> lines 32–72
            </p>
          </div>

          <div className={styles.card}>
            <h4>Decoupled Art + Code Pipelines (Kobold Blaster)</h4>
            <p>
              Claude wrote code (game loop, physics, rendering). GPT-image-1 generated
              sprites (text prompts → PNG sheets). Neither touched the other&apos;s
              output. Pixel scanner auto-derived crop bounds. Shows AI systems can work
              in parallel without tight coupling.
            </p>
            <p className={styles.small}>
              <span className={styles.filepath}>
                app/design-experiments/(experiments)/kobold-blaster/components/KoboldBlaster.tsx
              </span>{" "}
              lines 18–49
            </p>
          </div>

          <div className={styles.card}>
            <h4>CSS Module Scope Without Design System</h4>
            <p>
              Each experiment is visually autonomous. No shared component library, no
              theme file. Reduces friction for rapid iteration. Experiments can export
              portable components (card-stack/index.ts exports CardStack) when mature
              enough.
            </p>
            <p className={styles.small}>
              Typical pattern:{" "}
              <span className={styles.filepath}>
                app/design-experiments/(experiments)/retro-tech/page.module.css
              </span>
            </p>
          </div>

          <div className={styles.card}>
            <h4>Motion Layout Animations for Reordering</h4>
            <p>
              Leaderboard uses Motion&apos;s layout prop to animate row position changes.
              No manual spring math. Pass delay and overshoot, Motion handles the
              choreography. Cheap, reliable, feels responsive.
            </p>
            <p className={styles.small}>
              <span className={styles.filepath}>
                app/design-experiments/(experiments)/leaderboard/components/LeaderboardRow.tsx
              </span>
            </p>
          </div>

          <div className={styles.card}>
            <h4>Metadata Export Per Page</h4>
            <p>
              Each experiment exports Next.js Metadata with title + description.
              experimentMetadata(slug) helper looks up data.ts entry. OG image URLs point
              to public/screenshots/. Consistent, maintainable, crawlable.
            </p>
            <p className={styles.small}>
              <span className={styles.filepath}>lib/experiments/metadata.ts</span>
            </p>
          </div>

          <div className={styles.card}>
            <h4>WebGL2 Fragment Shaders for Visual Effects</h4>
            <p>
              Ripple Cycle demonstrates that custom shaders are tractable for one-off
              effects. Aspect-aware math, smooth falloffs, clean start/end. GLSL is
              verbose but expressive for creative work.
            </p>
            <p className={styles.small}>
              <span className={styles.filepath}>
                app/design-experiments/(experiments)/ripple-cycle/page.tsx
              </span>{" "}
              lines 21–78
            </p>
          </div>
        </div>

        <h2 id="concerns">7. Concerns &amp; Red Flags</h2>

        <div className={`${styles.callout} ${styles.warn}`}>
          <strong>Manual gallery registration:</strong> Adding an experiment requires
          edits to three places: folder creation, data.ts entry, and (for SEO)
          README.md/sitemap updates. Risk of desynchronization. Could be automated via
          folder scan + metadata frontmatter, but manual is fine for slow-moving personal
          project.
        </div>

        <div className={`${styles.callout} ${styles.warn}`}>
          <strong>No build-time asset optimization:</strong> Screenshots are committed to
          git. Sprites (kobold-blaster, monono) are committed. Repo size will grow. For a
          personal sandbox, acceptable; not viable at scale.
        </div>

        <div className={`${styles.callout} ${styles.warn}`}>
          <strong>Tight coupling to joshcoolman.com domain:</strong> Metadata hardcoded
          (layout.tsx line 35). Changing domain requires edits. Fine for personal site;
          wouldn&apos;t fork cleanly.
        </div>

        <div className={`${styles.callout} ${styles.warn}`}>
          <strong>No TypeScript at component boundaries:</strong> Many experiments accept
          loose props or don&apos;t export component types. Moving a component to
          portable status requires adding proper types. Workable but adds friction to
          extraction.
        </div>

        <div className={styles.callout}>
          <strong>Env vars are implicit:</strong> runnable.ts has a hardcoded REQUIREMENTS
          map. Adding a new gated experiment requires manual entry. Could be auto-detected
          via folder scan or file marker (e.g., // @requires VERCEL_AI_GATEWAY_KEY). Low
          risk but worth documenting.
        </div>

        <div className={styles.callout}>
          <strong>No staging environment:</strong> Experiments ship to production
          immediately. This is intentional (sandbox philosophy), but means a broken
          experiment is visible to visitors. Acceptable trade-off.
        </div>

        <h2 id="product">8. What This Really Is</h2>

        <p>
          Not just &quot;experiments folder.&quot; Sandbox is a{" "}
          <strong>design playground and code exhibition</strong> for one person learning
          in public. The real product is:
        </p>

        <ul>
          <li><strong>Rapid iteration loop:</strong> Idea → folder + page.tsx → gallery entry → screenshot → commit → live. Minimal ceremony.</li>
          <li><strong>Visual communication:</strong> Show what you build, not just write about it. Gallery + README.md showcase each work. GitHub links expose the code.</li>
          <li><strong>Pattern catalogue:</strong> 25 experiments covering CSS, WebGL, Canvas, React animations, AI chat, data viz, layout grids, UI components, agentic design. Each is a case study.</li>
          <li>
            <strong>Portability testing:</strong> Some experiments (Leaderboard, Retro
            Tech, Sticky Notes, Contact Sheet) are extracted to{" "}
            <span className={styles.filepath}>
              app/design-experiments/(experiments)/&lt;name&gt;/index.ts
            </span>{" "}
            as importable components. Tests whether patterns are reusable.
          </li>
          <li><strong>Agentic design showcase:</strong> Chatroom + CrossFit Challenge + Kobold Blaster show AI agents as active collaborators (not just tools). Multiple personas, parallel work, decoupled pipelines.</li>
        </ul>

        <p>The workflow from CLAUDE.md:</p>
        <ol>
          <li>/sketch — rapid prototype</li>
          <li>/ship-experiment — screenshot, gallery entry, commit, push</li>
        </ol>

        <p>/ship-experiment is a Claude Code skill that:</p>
        <ul>
          <li>Screenshots the experiment at a standard size</li>
          <li>Adds an entry to lib/experiments/data.ts</li>
          <li>Creates/updates README.md in the experiment folder</li>
          <li>Commits and pushes</li>
          <li>Triggers Vercel deploy</li>
        </ul>

        <p>
          The skill lives outside this repo, but it knows where to write (data.ts,
          public/screenshots/, README.md paths). Evidence: git log shows
          &quot;ship&quot; commits (e.g., a9e62f5 &quot;Ripple Cycle: WebGL
          ripple-transition experiment&quot; on May 13).
        </p>

        <h2 id="keyfiles">9. Key File Map</h2>

        <table>
          <thead>
            <tr><th>File</th><th>Lines</th><th>Why Read It</th></tr>
          </thead>
          <tbody>
            <tr><td><span className={styles.filepath}>package.json</span></td><td>1–42</td><td>All dependencies. GSAP, Motion, Anthropic SDK, Vercel Analytics, sharp-cli.</td></tr>
            <tr><td><span className={styles.filepath}>next.config.js</span></td><td>1–10</td><td>View Transitions enabled, trailing slash disabled, no rewrites or redirects.</td></tr>
            <tr><td><span className={styles.filepath}>app/layout.tsx</span></td><td>1–89</td><td>Root fonts (Karla, Bitter, Lora, Space Mono), metadata defaults, Analytics injection.</td></tr>
            <tr><td><span className={styles.filepath}>app/globals.css</span></td><td>1–161</td><td>Site-wide tokens (--site-bg, --site-text), View Transitions animations (curtain wipe + fade), reduced-motion fallback.</td></tr>
            <tr><td><span className={styles.filepath}>lib/experiments/data.ts</span></td><td>1–228</td><td>Gallery registry. 25 experiments with metadata. Manually maintained.</td></tr>
            <tr><td><span className={styles.filepath}>lib/experiments/runnable.ts</span></td><td>1–48</td><td>Env var gating logic. REQUIREMENTS map lists which experiments need which keys.</td></tr>
            <tr><td><span className={styles.filepath}>lib/experiments/metadata.ts</span></td><td>1–17</td><td>Per-experiment SEO metadata helper. Called by each experiment&apos;s page.tsx.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/page.tsx</span></td><td>1–20</td><td>Gallery server shell. Builds runnable map and passes to client.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/GalleryClient.tsx</span></td><td>1–205</td><td>Gallery rendering. IntersectionObserver stagger, sessionStorage scroll restoration, placeholder rows for gated experiments.</td></tr>
            <tr><td><span className={styles.filepath}>app/components/CurtainLink.tsx</span></td><td>1–51</td><td>View Transitions wrapper. Intercepts clicks, triggers startViewTransition, cleans up data attributes.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/(experiments)/crossfit-bento/page.tsx</span></td><td>1–10</td><td>Typical experiment server shell. Metadata + Content component render.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/(experiments)/crossfit-bento/components/CrossfitBentoContent.tsx</span></td><td>1–100+</td><td>Complex example: Motion + CSS Modules + data viz (heatmap, charts, count-up).</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/(experiments)/ripple-cycle/page.tsx</span></td><td>21–78</td><td>WebGL2 shaders. Aspect-aware ripple, smooth falloff, UOrigin uniform for click tracking.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/(experiments)/kobold-blaster/components/KoboldBlaster.tsx</span></td><td>18–49</td><td>Sprite crop system. Demonstrates decoupled art + code pipelines.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/(experiments)/leaderboard/components/LeaderboardRow.tsx</span></td><td>–</td><td>Motion layout animation example. Row reordering with spring.</td></tr>
            <tr><td><span className={styles.filepath}>app/design-experiments/(experiments)/chatroom/README.md</span></td><td>1–80</td><td>Architecture document for ambitious experiment. Phase milestones, Durable Object design, SQLite state, WS hibernation.</td></tr>
            <tr><td><span className={styles.filepath}>.env.local.example</span></td><td>1–15</td><td>Required + optional env vars. Vercel AI Gateway, Upstash Redis, Chatroom WSS, HMAC secret.</td></tr>
            <tr><td><span className={styles.filepath}>CLAUDE.md</span></td><td>1–55</td><td>Repo conventions. Workflow (sketch → ship-experiment). Structure. Component extraction thresholds.</td></tr>
            <tr><td><span className={styles.filepath}>app/types/experiments.ts</span></td><td>1–12</td><td>Experiment TypeScript interface. All gallery metadata flows from this type.</td></tr>
          </tbody>
        </table>

        <div className={styles.footnote}>
          Last regenerated on 2026-05-21 via the /explore-repo Claude skill.
        </div>
      </div>
    </main>
  );
}
