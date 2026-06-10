// sketch: Aerial seismic mesh — static topographic ground, blast physics on click.
'use client';

import { useEffect, useRef } from 'react';
import './styles.css';

const CELL_SIZE = 30;
const BLEED = 2;
const DAMPING = 0.97;     // high — displacement travels far, settles slowly
const ALPHA_BUCKETS = 12;
const TERRAIN_T = 1.4;    // frozen terrain snapshot

function terrain(nx: number, ny: number, t: number): number {
  const x = nx * 7;
  const y = ny * 5;
  const h1 = Math.sin(x * 0.8 + t * 0.9) * Math.cos(y * 0.6 + t * 0.7);
  const h2 = Math.sin(x * 1.5 - y * 1.1  + t * 0.5) * 0.5;
  const h3 = Math.cos(x * 0.4 + y * 1.3  + t * 0.3) * 0.35;
  const h4 = Math.sin(x * 2.2 + y * 0.7  + t * 0.8) * 0.15;
  return (h1 + h2 + h3 + h4) / 2.0;
}

const ROW_SPACING = CELL_SIZE * (Math.sqrt(3) / 2);

function buildMesh(W: number, H: number) {
  const cols = Math.ceil(W / CELL_SIZE) + BLEED * 2 + 2;
  const rows = Math.ceil(H / ROW_SPACING) + BLEED * 2 + 2;
  const startX = -(BLEED * CELL_SIZE);
  const startY = -(BLEED * ROW_SPACING);

  const nodes = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rx = startX + col * CELL_SIZE + (row % 2) * (CELL_SIZE / 2);
      const ry = startY + row * ROW_SPACING;
      nodes.push({
        restX: rx, restY: ry,
        x: rx,     y: ry,
        vx: 0,     vy: 0,
        nx: rx / W,
        ny: ry / H,
      });
    }
  }

  const edges: [number, number][] = [];
  const idx = (r: number, c: number) => r * cols + c;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Horizontal neighbor
      if (col < cols - 1) edges.push([idx(row, col), idx(row, col + 1)]);
      if (row < rows - 1) {
        if (row % 2 === 0) {
          // Even row: lower-left and lower-right
          if (col > 0) edges.push([idx(row, col), idx(row + 1, col - 1)]);
          edges.push([idx(row, col), idx(row + 1, col)]);
        } else {
          // Odd row: lower-left and lower-right
          edges.push([idx(row, col), idx(row + 1, col)]);
          if (col < cols - 1) edges.push([idx(row, col), idx(row + 1, col + 1)]);
        }
      }
    }
  }

  return { nodes, edges };
}

interface Blast {
  x: number; y: number;
  startTime: number;
  maxRadius: number;
  duration: number;
  force: number;
  waveWidth: number;
}

export default function WaterMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const blastsRef = useRef<Blast[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mesh = buildMesh(window.innerWidth, window.innerHeight);

    // Pre-compute static terrain heights — recomputed only on resize
    let heights: number[] = mesh.nodes.map(n => terrain(n.nx, n.ny, TERRAIN_T));

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(devicePixelRatio, devicePixelRatio);
      mesh = buildMesh(window.innerWidth, window.innerHeight);
      heights = mesh.nodes.map(n => terrain(n.nx, n.ny, TERRAIN_T));
    }
    resize();
    window.addEventListener('resize', resize);

    function handleClick(e: MouseEvent) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const dx = Math.max(e.clientX, W - e.clientX);
      const dy = Math.max(e.clientY, H - e.clientY);
      const maxRadius = Math.sqrt(dx * dx + dy * dy) * 1.05;
      blastsRef.current.push({
        x: e.clientX, y: e.clientY,
        startTime: performance.now(),
        maxRadius,
        duration: 2800,
        force: e.shiftKey ? -0.8 : 0.8,
        waveWidth: 60,
      });
    }
    window.addEventListener('click', handleClick);

    const buckets: { ax: number; ay: number; bx: number; by: number }[][] =
      Array.from({ length: ALPHA_BUCKETS }, () => []);

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const { nodes, edges } = mesh;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);

      // Apply blast forces
      blastsRef.current = blastsRef.current.filter(blast => {
        const elapsed = timestamp - blast.startTime;
        const progress = elapsed / blast.duration;
        if (progress >= 1) return false;
        const eased = 1 - Math.pow(1 - progress, 3);
        const waveRadius = blast.maxRadius * eased;
        const forceMultiplier = Math.max(0, 1 - progress * 2);

        for (const node of nodes) {
          const dx = node.x - blast.x;
          const dy = node.y - blast.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const distFromEdge = dist - waveRadius;
          if (distFromEdge < 0 && distFromEdge > -blast.waveWidth && dist > 0) {
            const inv = 1 / dist;
            const depth = 1 - Math.abs(distFromEdge) / blast.waveWidth;
            const strength = blast.force * depth * forceMultiplier;
            node.vx += dx * inv * strength;
            node.vy += dy * inv * strength;
          }
        }
        return true;
      });

      // Physics — no spring, nodes stay where blasts leave them
      for (const node of nodes) {
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;
      }

      // Blast ring visual
      for (const blast of blastsRef.current) {
        const elapsed = timestamp - blast.startTime;
        const progress = elapsed / blast.duration;
        const eased = 1 - Math.pow(1 - progress, 3);
        const waveRadius = blast.maxRadius * eased;
        const opacity = 0.22 * Math.max(0, 1 - progress * 1.4);
        if (opacity > 0.005) {
          ctx.beginPath();
          ctx.arc(blast.x, blast.y, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(210,210,210,${opacity.toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Batch edges by alpha bucket
      for (let b = 0; b < ALPHA_BUCKETS; b++) buckets[b].length = 0;

      for (const [a, b] of edges) {
        const avgH = (heights[a] + heights[b]) / 2;
        const alpha = 0.12 + ((avgH + 1) / 2) * 0.65;
        const bucket = Math.min(ALPHA_BUCKETS - 1, Math.floor(alpha * ALPHA_BUCKETS));
        buckets[bucket].push({ ax: nodes[a].x, ay: nodes[a].y, bx: nodes[b].x, by: nodes[b].y });
      }

      ctx.lineWidth = 0.75;
      for (let b = 0; b < ALPHA_BUCKETS; b++) {
        if (buckets[b].length === 0) continue;
        const alpha = (b + 0.5) / ALPHA_BUCKETS;
        ctx.strokeStyle = `rgba(185,185,185,${alpha.toFixed(3)})`;
        ctx.beginPath();
        for (const e of buckets[b]) {
          ctx.moveTo(e.ax, e.ay);
          ctx.lineTo(e.bx, e.by);
        }
        ctx.stroke();
      }

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        const h = heights[i];
        const r = 0.8 + ((h + 1) / 2) * 1.4;
        const a = 0.25 + ((h + 1) / 2) * 0.65;
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,220,220,${a.toFixed(3)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="water-mesh-container">
      <canvas ref={canvasRef} className="water-mesh-canvas" />
    </div>
  );
}
