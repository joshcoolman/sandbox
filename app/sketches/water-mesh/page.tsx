// sketch: Hexagonal mesh with Z-axis deformation — aerial perspective, click to dent.
'use client';

import { useEffect, useRef } from 'react';
import './styles.css';

const CELL_SIZE = 30;
const MESH_PADDING = 80;
const ROW_SPACING = CELL_SIZE * (Math.sqrt(3) / 2);
const ALPHA_BUCKETS = 12;
const TERRAIN_T = 1.4;

// Camera directly above
const CAM_Z = 2200;
const Z_CAP_UP = -(CAM_Z - 100);

// Z physics — extrude force targets the camera plane in one click
const Z_DAMPING = 0.75;
const Z_LINEAR_DECAY = 5; // units/frame toward zero — 7s recovery from full cap at 60fps
const BLAST_FORCE = CAM_Z * (1 - Z_DAMPING);
const BLAST_SIGMA = CELL_SIZE * 1.5;
const Z_NEIGHBOR_K = 0.004;

function terrain(nx: number, ny: number, t: number): number {
  const x = nx * 7;
  const y = ny * 5;
  const h1 = Math.sin(x * 0.8 + t * 0.9) * Math.cos(y * 0.6 + t * 0.7);
  const h2 = Math.sin(x * 1.5 - y * 1.1 + t * 0.5) * 0.5;
  const h3 = Math.cos(x * 0.4 + y * 1.3 + t * 0.3) * 0.35;
  const h4 = Math.sin(x * 2.2 + y * 0.7 + t * 0.8) * 0.15;
  return (h1 + h2 + h3 + h4) / 2.0;
}

function buildMesh(W: number, H: number) {
  // Mesh fits within viewport minus padding; subtract half-cell for odd-row hex offset
  const cols = Math.floor((W - MESH_PADDING * 2 - CELL_SIZE / 2) / CELL_SIZE) + 1;
  const rows = Math.floor((H - MESH_PADDING * 2) / ROW_SPACING) + 1;
  const startX = MESH_PADDING;
  const startY = MESH_PADDING;

  const nodes = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rx = startX + col * CELL_SIZE + (row % 2) * (CELL_SIZE / 2);
      const ry = startY + row * ROW_SPACING;
      nodes.push({
        x: rx, y: ry,       // fixed — never change
        z: 0, vz: 0,        // depth and velocity
        nx: rx / W, ny: ry / H,
      });
    }
  }

  const edges: [number, number][] = [];
  const idx = (r: number, c: number) => r * cols + c;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (col < cols - 1) edges.push([idx(row, col), idx(row, col + 1)]);
      if (row < rows - 1) {
        if (row % 2 === 0) {
          if (col > 0) edges.push([idx(row, col), idx(row + 1, col - 1)]);
          edges.push([idx(row, col), idx(row + 1, col)]);
        } else {
          edges.push([idx(row, col), idx(row + 1, col)]);
          if (col < cols - 1) edges.push([idx(row, col), idx(row + 1, col + 1)]);
        }
      }
    }
  }

  // Adjacency list for Z neighbor coupling
  const adjacency: number[][] = Array.from({ length: nodes.length }, () => []);
  for (const [a, b] of edges) {
    adjacency[a].push(b);
    adjacency[b].push(a);
  }

  return { nodes, edges, adjacency };
}

interface BlastRing {
  x: number; y: number;
  startTime: number;
  maxRadius: number;
  duration: number;
}

export default function WaterMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const ringsRef = useRef<BlastRing[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mesh = buildMesh(window.innerWidth, window.innerHeight);
    let heights = mesh.nodes.map(n => terrain(n.nx, n.ny, TERRAIN_T));

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
      const force = e.shiftKey ? BLAST_FORCE * 3 : -BLAST_FORCE;
      const sigma2 = BLAST_SIGMA * BLAST_SIGMA * 2;

      for (const node of mesh.nodes) {
        const dx = node.x - e.clientX;
        const dy = node.y - e.clientY;
        node.vz += force * Math.exp(-(dx * dx + dy * dy) / sigma2);
      }

      // Visual ring for feedback
      const cx = Math.max(e.clientX, W - e.clientX);
      const cy = Math.max(e.clientY, H - e.clientY);
      ringsRef.current.push({
        x: e.clientX, y: e.clientY,
        startTime: performance.now(),
        maxRadius: Math.sqrt(cx * cx + cy * cy) * 1.05,
        duration: 2000,
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

      // Z neighbor coupling — each node pulled toward average Z of its neighbors
      const { adjacency } = mesh;
      for (let i = 0; i < nodes.length; i++) {
        const nbrs = adjacency[i];
        let avgZ = 0;
        for (const j of nbrs) avgZ += nodes[j].z;
        nodes[i].vz += ((avgZ / nbrs.length) - nodes[i].z) * Z_NEIGHBOR_K;
      }

      // Z integrate
      for (const node of nodes) {
        if (node.z !== 0) node.vz += Math.sign(-node.z) * Z_LINEAR_DECAY;
        node.vz *= Z_DAMPING;
        node.z += node.vz;
        if (node.z < Z_CAP_UP) node.z = Z_CAP_UP;
        if (Math.abs(node.z) < 1.0) { node.z = 0; node.vz = 0; }
      }

      // Perspective projection
      const px = new Float32Array(nodes.length);
      const py = new Float32Array(nodes.length);
      for (let i = 0; i < nodes.length; i++) {
        const scale = CAM_Z / (CAM_Z + nodes[i].z);
        px[i] = W / 2 + (nodes[i].x - W / 2) * scale;
        py[i] = H / 2 + (nodes[i].y - H / 2) * scale;
      }

      // Visual rings
      ringsRef.current = ringsRef.current.filter(ring => {
        const elapsed = timestamp - ring.startTime;
        const progress = elapsed / ring.duration;
        if (progress >= 1) return false;
        const eased = 1 - Math.pow(1 - progress, 3);
        const radius = ring.maxRadius * eased;
        const opacity = 0.18 * Math.max(0, 1 - progress * 1.4);
        if (opacity > 0.005) {
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(210,210,210,${opacity.toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        return true;
      });

      // Batch edges by terrain alpha
      for (let b = 0; b < ALPHA_BUCKETS; b++) buckets[b].length = 0;

      for (const [a, b] of edges) {
        const avgH = (heights[a] + heights[b]) / 2;
        const alpha = 0.12 + ((avgH + 1) / 2) * 0.65;
        const bucket = Math.min(ALPHA_BUCKETS - 1, Math.floor(alpha * ALPHA_BUCKETS));
        buckets[bucket].push({ ax: px[a], ay: py[a], bx: px[b], by: py[b] });
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
        ctx.arc(px[i], py[i], r, 0, Math.PI * 2);
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
