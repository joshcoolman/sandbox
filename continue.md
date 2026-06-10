# Continue: Promote water-mesh sketch to experiment

## What we built

Over a long exploratory session we developed a canvas sketch at `app/sketches/water-mesh/` that has arrived at something genuinely interesting. It is committed and stable on `main`.

**What it does:** A hexagonal mesh viewed from directly above. Nodes are fixed in XY — the only movement is on the Z axis (depth), visualized through a perspective camera. Clicking extrudes nodes toward the camera; shift-clicking dents them away. The mesh recovers back to flat via linear decay (~7 seconds for a full extrusion). Contained within the viewport with 80px padding so it reads as a visible object, not a wallpaper texture.

**Key technical facts:**
- `app/sketches/water-mesh/page.tsx` — single file, ~240 lines
- `app/sketches/water-mesh/styles.css` — minimal, full-bleed canvas
- Hex grid, XY positions frozen, Z-axis physics only
- Perspective projection: `scale = CAM_Z / (CAM_Z + node.z)`
- Linear decay: `Z_LINEAR_DECAY = 5` units/frame — constant rate, reaches zero in finite time
- Dead zone snap: `if (Math.abs(node.z) < 1.0) { node.z = 0; node.vz = 0; }`
- Weak Z neighbor coupling (`Z_NEIGHBOR_K = 0.004`) keeps surface coherent without over-smoothing
- `BLAST_FORCE = CAM_Z * (1 - Z_DAMPING)` — one click targets the camera plane
- Click: extrude toward camera. Shift-click: dent away at 3x force.

## Goal for next session

**Promote this sketch to a proper design experiment** using the `/design-experiment` skill as a guide.

## What "promoting" involves

### 1. Move files

Because this is a fullscreen immersive canvas (conflicts with the shared layout wrapper), it should live **outside** the `(experiments)` route group per the skill instructions:

```
app/design-experiments/water-mesh/
├── page.tsx      (moved + cleaned from sketch)
└── styles.css    (moved as-is)
```

Add a comment in `page.tsx` explaining why it's outside `(experiments)/`.

### 2. Add to data.ts

Add an entry at the top of the experiments array in `lib/experiments/data.ts`:

```ts
{
  slug: 'water-mesh',
  date: 'June 10, 2026',
  title: 'Water Mesh',
  subtitle: 'A hexagonal surface you press and pull — each click leaves a permanent impression.',
  description: 'A hexagonal mesh viewed from directly above. Nodes are fixed in the plane; clicking pushes them toward you in Z, shift-clicking dents them away. The perspective camera turns Z displacement into foreshortening — dents compress the cells, extrusions expand them. Deformations decay back to flat over about seven seconds via linear decay.',
  screenshot: '/screenshots/water-mesh.png',
  tags: ['Canvas', 'Physics', 'Interactive', '3D', 'Generative'],
  theme: 'dark',
}
```

### 3. Code cleanup for the promotion

- Update the comment at line 1 (currently says `// sketch:`)
- Verify `nx`/`ny` terrain sampling (`rx / W`, `ry / H`) still makes sense with `MESH_PADDING = 80` — nodes no longer start near 0,0 so the terrain snapshot may look different; eyeball it
- No physics or interaction changes — it's dialed in

### 4. SEO checklist (per CLAUDE.md)

- `app/sitemap.ts` — confirm dynamic experiments are auto-discovered (likely fine, no manual entry needed)
- `public/llms.txt` — concise entry
- `public/llms-full.txt` — expanded entry

### 5. Ship it

Use `/ship-experiment` after verifying the promoted experiment looks right. It handles screenshot, README update, commit, and push.

## What NOT to do

- Do not change the physics or interaction
- Do not add UI controls or overlays
- Do not add the shared layout wrapper manually — go fullscreen and skip it
- Do not run `npm run dev` — the user will start the server
