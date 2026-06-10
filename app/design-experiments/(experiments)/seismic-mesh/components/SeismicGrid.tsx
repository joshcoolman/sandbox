// A static "magnetic" backdrop layered beneath the seismic mesh. A full-bleed
// square lattice of short segments that rotate to wrap tangentially around the
// pointer (iron-filings / field-line look). It is fully decoupled from the
// mesh's click-deformation physics — it only reads pointer position, never the
// mesh state, so clicks warp the mesh but leave this layer untouched.
'use client';

import { useEffect, useRef } from 'react';
import { CELL_SIZE, meshGrid } from '../meshLayout';

// --- Tunables (adjust these live against the reference) ---------------------
// Segments sit on the shared mesh lattice (meshLayout) so each rotation point
// lands exactly on a mesh node — the two layers line up at rest.
const SEG_LEN = CELL_SIZE * 0.6; // segment length (codepen bars are ~1:6)
const EASE = 0.12; // angle settle per frame: 1 = instant snap, lower = gentler
const ORIENT: 'tangent' | 'radial' = 'tangent'; // wrap-around vs point-at
const TONE = 'rgba(255,30,30,0.35)'; // bright red at 35% opacity
const LINE_WIDTH = 1;

type Seg = { x: number; y: number; angle: number };

// Rotate `from` toward `to` by `t`, taking the shortest path around the circle.
function easeAngle(from: number, to: number, t: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  else if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

export function SeismicGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let segs: Seg[] = [];
    // Default the pointer to viewport center so the resting field is coherent
    // before the first pointermove.
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let raf = 0;

    function build() {
      if (!canvas || !ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);

      // Same hex node positions the mesh uses — rotation points coincide.
      segs = meshGrid(W, H).points.map(p => ({ x: p.x, y: p.y, angle: 0 }));
    }
    build();
    window.addEventListener('resize', build);

    function onPointerMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }
    window.addEventListener('pointermove', onPointerMove);

    function draw() {
      if (!canvas || !ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      const tangent = ORIENT === 'tangent' ? Math.PI / 2 : 0;
      ctx.strokeStyle = TONE;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const h = SEG_LEN / 2;
      for (const seg of segs) {
        const target = Math.atan2(seg.y - pointer.y, seg.x - pointer.x) + tangent;
        seg.angle = easeAngle(seg.angle, target, EASE);
        const c = Math.cos(seg.angle);
        const s = Math.sin(seg.angle);
        ctx.moveTo(seg.x - c * h, seg.y - s * h);
        ctx.lineTo(seg.x + c * h, seg.y + s * h);
      }
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', build);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="seismic-grid-canvas" />;
}
