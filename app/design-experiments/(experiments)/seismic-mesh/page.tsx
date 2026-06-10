// experiment: Hexagonal mesh with Z-axis deformation — aerial perspective.
// Plain click: cinematic — the mountain rises, a seismic ripple radiates out,
// the surface freezes at peak while ASCII telemetry decodes in beside the
// epicenter, then everything releases and melts back. Shift-click: quick dent.
'use client';

import { useEffect, useRef, useState } from 'react';
import { DecodeText } from '@/app/components/DecodeText';
import { makeReadout, type Readout } from './data/readout';
import './styles.css';

const CELL_SIZE = 30;
const MESH_PADDING = 80;
const MESH_PADDING_TOP = 140; // header is ~130px tall; extra clearance to match bottom gap
const ROW_SPACING = CELL_SIZE * (Math.sqrt(3) / 2);
const TERRAIN_T = 1.4;

// Camera directly above
const CAM_Z = 2200;
const Z_CAP_UP = -(CAM_Z - 100);

// Z physics — extrude force targets the camera plane in one click
const Z_DAMPING = 0.75;
const Z_LINEAR_DECAY = 2; // units/frame toward zero — ~17s recovery from full cap at 60fps
const BLAST_FORCE = CAM_Z * (1 - Z_DAMPING);
const BLAST_SIGMA = CELL_SIZE * 1.5;
const Z_NEIGHBOR_K = 0.004;

// Ambient ripple — purely visual, doesn't touch node.z
const RIPPLE_AMP = 55;    // depth units (~2.5% of CAM_Z)
const RIPPLE_K = 0.008;   // spatial frequency
const RIPPLE_SPEED = 0.0004; // radians per ms

// Cinematic timing
const RISE_MS = 480;      // impulse climb before the freeze grabs it
const FREEZE_MS = 2600;   // hold at peak while telemetry decodes + dwells
const OVERLAY_FADE_MS = 450; // matches the .sm-readout CSS transition

// Seismic traveling wave — render-Z only, never touches node.z
const SEISMIC_SPEED = 0.9;     // px/ms — ring front expansion
const SEISMIC_AMP = 90;        // render-Z units at the crest (~4% of CAM_Z)
const SEISMIC_SIGMA = 70;      // px — gaussian half-width of the moving ring
const SEISMIC_K = 0.035;       // rad/px — oscillation density inside the ring
const SEISMIC_LIFETIME = 2600; // ms — wave fully decayed by here

// Topographic coloring
const ELEV_BANDS = 16;

// Readout panel geometry — must track the .sm-readout CSS so the canvas
// leader line and the DOM panel agree on position
const PANEL_W = 252;
const PANEL_H = 196;
const PANEL_GAP = 44;

const TOPO_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0.0, rgb: [10, 26, 58] },     // deep blue
  { t: 0.28, rgb: [17, 80, 122] },   // blue-teal
  { t: 0.5, rgb: [31, 138, 76] },    // green
  { t: 0.7, rgb: [201, 194, 58] },   // yellow
  { t: 0.86, rgb: [217, 138, 43] },  // amber
  { t: 1.0, rgb: [245, 245, 240] },  // white
];

function topoRgb(t: number): [number, number, number] {
  for (let s = 0; s < TOPO_STOPS.length - 1; s++) {
    const a = TOPO_STOPS[s];
    const b = TOPO_STOPS[s + 1];
    if (t <= b.t) {
      const f = (t - a.t) / (b.t - a.t);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f),
      ];
    }
  }
  return TOPO_STOPS[TOPO_STOPS.length - 1].rgb;
}

// Precomputed per-band styles — elevation quantizes into these
const EDGE_COLORS: string[] = [];
const NODE_COLORS: string[] = [];
const NODE_RADII: number[] = [];
for (let b = 0; b < ELEV_BANDS; b++) {
  const e = (b + 0.5) / ELEV_BANDS;
  const [r, g, bl] = topoRgb(e);
  EDGE_COLORS.push(`rgba(${r},${g},${bl},${(0.22 + e * 0.7).toFixed(3)})`);
  NODE_COLORS.push(`rgba(${r},${g},${bl},${(0.3 + e * 0.65).toFixed(3)})`);
  NODE_RADII.push(0.8 + e * 1.8);
}

function panelPos(x: number, y: number, W: number, H: number) {
  let left = x + PANEL_GAP;
  let flipped = false;
  if (left + PANEL_W > W - 16) {
    left = x - PANEL_GAP - PANEL_W;
    flipped = true;
  }
  if (left < 16) left = 16;
  const top = Math.max(100, Math.min(y - PANEL_H / 2, H - PANEL_H - 16));
  return { left, top, flipped };
}

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
  const rows = Math.floor((H - MESH_PADDING_TOP - MESH_PADDING) / ROW_SPACING) + 1;
  const startX = MESH_PADDING;
  const startY = MESH_PADDING_TOP;

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

interface Cinematic {
  phase: 'rising' | 'frozen';
  epX: number;
  epY: number;
  startTime: number;
}

interface SeismicWave {
  x: number;
  y: number;
  startTime: number;
  amp: number; // per-quake amplitude variation
}

interface Overlay {
  x: number;
  y: number;
  data: Readout;
  visible: boolean;
  gen: number;
}

export default function SeismicMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cinematicRef = useRef<Cinematic | null>(null);
  const seismicWavesRef = useRef<SeismicWave[]>([]);
  // Lets the epicenter marker fade out in sync with the overlay after release
  const releaseRef = useRef<{ epX: number; epY: number; time: number } | null>(null);
  const overlayGenRef = useRef(0);
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mesh = buildMesh(window.innerWidth, window.innerHeight);
    let heights = mesh.nodes.map(n => terrain(n.nx, n.ny, TERRAIN_T));
    let fadeTimeout = 0;

    function resize() {
      if (!canvas || !ctx) return;
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
      const isDent = e.shiftKey;
      const force = isDent ? BLAST_FORCE * 3 : -BLAST_FORCE;
      const sigma2 = BLAST_SIGMA * BLAST_SIGMA * 2;

      for (const node of mesh.nodes) {
        const dx = node.x - e.clientX;
        const dy = node.y - e.clientY;
        node.vz += force * Math.exp(-(dx * dx + dy * dy) / sigma2);
      }

      // Every click radiates a seismic wave through the mesh
      seismicWavesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        startTime: performance.now(),
        amp: SEISMIC_AMP * (0.85 + Math.random() * 0.3),
      });

      // Plain click starts (or restarts) the cinematic at the new epicenter
      if (!isDent) {
        cinematicRef.current = {
          phase: 'rising',
          epX: e.clientX,
          epY: e.clientY,
          startTime: performance.now(),
        };
        releaseRef.current = null;
        setOverlay(null);
      }
    }
    window.addEventListener('click', handleClick);

    const edgeBuckets: number[][] = Array.from({ length: ELEV_BANDS }, () => []);
    const nodeBuckets: number[][] = Array.from({ length: ELEV_BANDS }, () => []);

    // Pulsing crosshair at the epicenter + leader line that draws itself out
    // to the readout panel. lineProgress < 0 means no line yet (still rising).
    function drawEpicenterMarker(
      epX: number, epY: number, alpha: number, lineProgress: number,
      timestamp: number, W: number, H: number,
    ) {
      if (!ctx) return;
      const arm = 14;
      const pulse = 7 + Math.sin(timestamp * 0.004) * 2;
      ctx.strokeStyle = `rgba(245,245,240,${(0.55 * alpha).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(epX, epY, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(epX - arm, epY); ctx.lineTo(epX - pulse - 2, epY);
      ctx.moveTo(epX + pulse + 2, epY); ctx.lineTo(epX + arm, epY);
      ctx.moveTo(epX, epY - arm); ctx.lineTo(epX, epY - pulse - 2);
      ctx.moveTo(epX, epY + pulse + 2); ctx.lineTo(epX, epY + arm);
      ctx.stroke();

      if (lineProgress <= 0) return;
      const { left, top, flipped } = panelPos(epX, epY, W, H);
      const tx = flipped ? left + PANEL_W : left;
      const ty = top + PANEL_H / 2;
      const dx = tx - epX, dy = ty - epY;
      const len = Math.hypot(dx, dy) || 1;
      const sx = epX + (dx / len) * (arm + 3);
      const sy = epY + (dy / len) * (arm + 3);
      const prog = Math.min(1, lineProgress);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (tx - sx) * prog, sy + (ty - sy) * prog);
      ctx.strokeStyle = `rgba(245,245,240,${(0.35 * alpha).toFixed(3)})`;
      ctx.stroke();
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const { nodes, edges, adjacency } = mesh;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);

      // Cinematic state machine — all phase timing lives here, no timers
      const cin = cinematicRef.current;
      if (cin) {
        const elapsed = timestamp - cin.startTime;
        if (cin.phase === 'rising' && elapsed >= RISE_MS) {
          cin.phase = 'frozen';
          cin.startTime = timestamp;
          const gen = ++overlayGenRef.current;
          setOverlay({
            x: cin.epX,
            y: cin.epY,
            data: makeReadout(cin.epX, cin.epY, W, H),
            visible: true,
            gen,
          });
        } else if (cin.phase === 'frozen' && elapsed >= FREEZE_MS) {
          releaseRef.current = { epX: cin.epX, epY: cin.epY, time: timestamp };
          cinematicRef.current = null;
          const gen = overlayGenRef.current;
          setOverlay(o => (o && o.gen === gen ? { ...o, visible: false } : o));
          // Unmount after the CSS fade; gen guard ignores stale timeouts if a
          // new click already replaced the overlay
          window.clearTimeout(fadeTimeout);
          fadeTimeout = window.setTimeout(() => {
            setOverlay(o => (o && o.gen === gen ? null : o));
          }, OVERLAY_FADE_MS + 50);
        }
      }

      const frozen = cinematicRef.current?.phase === 'frozen';

      if (frozen) {
        // Hold the mountain: no coupling, no decay — just kill residual velocity
        for (const node of nodes) {
          node.vz *= 0.5;
          node.z += node.vz;
          if (node.z < Z_CAP_UP) node.z = Z_CAP_UP;
        }
      } else {
        // Z neighbor coupling — each node pulled toward average Z of its neighbors
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
      }

      // Cull dead seismic waves once per frame
      if (seismicWavesRef.current.length) {
        seismicWavesRef.current = seismicWavesRef.current.filter(
          w => timestamp - w.startTime < SEISMIC_LIFETIME,
        );
      }
      const waves = seismicWavesRef.current;

      // Perspective projection — render Z = physics + ambient ripple + seismic.
      // Elevation derives from the same renderZ, so the ripple and the seismic
      // crest paint moving color across the surface for free.
      const t = timestamp * RIPPLE_SPEED;
      const px = new Float32Array(nodes.length);
      const py = new Float32Array(nodes.length);
      const elev = new Float32Array(nodes.length);
      const sigma2 = 2 * SEISMIC_SIGMA * SEISMIC_SIGMA;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ripple = RIPPLE_AMP * Math.sin(node.x * RIPPLE_K + node.y * RIPPLE_K * 0.7 + t);
        let waveZ = 0;
        for (const w of waves) {
          const age = timestamp - w.startTime;
          const front = age * SEISMIC_SPEED;
          const dx = node.x - w.x, dy = node.y - w.y;
          const phase = Math.hypot(dx, dy) - front;
          const ring = Math.exp(-(phase * phase) / sigma2);
          const env = Math.max(0, 1 - age / SEISMIC_LIFETIME);
          waveZ += w.amp * ring * Math.cos(phase * SEISMIC_K) * env;
        }
        let renderZ = node.z + ripple + waveZ;
        if (renderZ < Z_CAP_UP) renderZ = Z_CAP_UP;
        const scale = CAM_Z / (CAM_Z + renderZ);
        px[i] = W / 2 + (node.x - W / 2) * scale;
        py[i] = H / 2 + (node.y - H / 2) * scale;
        // renderZ negative = toward camera = high
        const e = 0.5 + heights[i] * 0.28 + (-renderZ / CAM_Z) * 0.9;
        elev[i] = e < 0 ? 0 : e > 1 ? 1 : e;
      }

      // Faint leading edge of each seismic wave
      for (const w of waves) {
        const age = timestamp - w.startTime;
        const a = 0.1 * Math.max(0, 1 - age / SEISMIC_LIFETIME);
        if (a > 0.008) {
          ctx.beginPath();
          ctx.arc(w.x, w.y, age * SEISMIC_SPEED, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(150,190,220,${a.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Edges batched by elevation band — one stroke per band
      for (let b = 0; b < ELEV_BANDS; b++) edgeBuckets[b].length = 0;
      for (const [a, b] of edges) {
        const e = (elev[a] + elev[b]) / 2;
        const band = Math.min(ELEV_BANDS - 1, (e * ELEV_BANDS) | 0);
        edgeBuckets[band].push(a, b);
      }
      ctx.lineWidth = 0.75;
      for (let b = 0; b < ELEV_BANDS; b++) {
        const bucket = edgeBuckets[b];
        if (bucket.length === 0) continue;
        ctx.strokeStyle = EDGE_COLORS[b];
        ctx.beginPath();
        for (let k = 0; k < bucket.length; k += 2) {
          ctx.moveTo(px[bucket[k]], py[bucket[k]]);
          ctx.lineTo(px[bucket[k + 1]], py[bucket[k + 1]]);
        }
        ctx.stroke();
      }

      // Nodes batched by band — radius swells with elevation
      for (let b = 0; b < ELEV_BANDS; b++) nodeBuckets[b].length = 0;
      for (let i = 0; i < nodes.length; i++) {
        const band = Math.min(ELEV_BANDS - 1, (elev[i] * ELEV_BANDS) | 0);
        nodeBuckets[band].push(i);
      }
      for (let b = 0; b < ELEV_BANDS; b++) {
        const bucket = nodeBuckets[b];
        if (bucket.length === 0) continue;
        const r = NODE_RADII[b];
        ctx.fillStyle = NODE_COLORS[b];
        ctx.beginPath();
        for (const i of bucket) {
          ctx.moveTo(px[i] + r, py[i]);
          ctx.arc(px[i], py[i], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Epicenter marker: fades in during rise, leader line draws out during
      // freeze, both fade with the overlay after release
      const cin2 = cinematicRef.current;
      const rel = releaseRef.current;
      if (cin2) {
        if (cin2.phase === 'rising') {
          const a = Math.min(1, (timestamp - cin2.startTime) / RISE_MS);
          drawEpicenterMarker(cin2.epX, cin2.epY, a, -1, timestamp, W, H);
        } else {
          const prog = (timestamp - cin2.startTime) / 260;
          drawEpicenterMarker(cin2.epX, cin2.epY, 1, prog, timestamp, W, H);
        }
      } else if (rel) {
        const fade = 1 - (timestamp - rel.time) / OVERLAY_FADE_MS;
        if (fade <= 0) {
          releaseRef.current = null;
        } else {
          drawEpicenterMarker(rel.epX, rel.epY, fade, 1, timestamp, W, H);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(fadeTimeout);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const pos = overlay
    ? panelPos(overlay.x, overlay.y, window.innerWidth, window.innerHeight)
    : null;

  return (
    <div className="seismic-mesh-container">
      <canvas ref={canvasRef} className="seismic-mesh-canvas" />
      {overlay && pos && (
        <div
          key={overlay.gen}
          className={`sm-readout ${overlay.visible ? 'is-visible' : ''}`}
          style={{ left: pos.left, top: pos.top }}
          aria-hidden="true"
        >
          <div className="sm-readout-title">
            <DecodeText text={overlay.data.title} delay={120} />
            <span className="sm-cursor" />
          </div>
          <div className="sm-readout-mag">
            <DecodeText text={overlay.data.magnitude} delay={260} />
          </div>
          <div className="sm-readout-rows">
            {overlay.data.rows.map((r, i) => (
              <div className="sm-readout-row" key={r.k}>
                <span className="sm-k">
                  <DecodeText text={r.k} delay={420 + i * 100} />
                </span>
                <span className="sm-v">
                  <DecodeText text={r.v} delay={460 + i * 100} />
                </span>
              </div>
            ))}
          </div>
          <div className="sm-readout-ref">
            <DecodeText text={overlay.data.ref} delay={420 + overlay.data.rows.length * 100} />
          </div>
        </div>
      )}
    </div>
  );
}
