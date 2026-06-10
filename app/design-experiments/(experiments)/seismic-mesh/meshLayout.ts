// Single source of truth for the hexagonal node lattice. Both the mesh
// (page.tsx) and the magnetic backdrop (SeismicGrid) build off these positions,
// so every backdrop line rotates around the exact point where a mesh node sits.

export const CELL_SIZE = 30;
export const MESH_PADDING = 80; // horizontal (left/right) margin
export const ROW_SPACING = CELL_SIZE * (Math.sqrt(3) / 2);
// Drop two hex rows off the top and bottom so the mesh sits with more breathing
// room inside the content area. Top also clears the ~130px header.
export const MESH_PADDING_TOP = 140 + ROW_SPACING * 2;
export const MESH_PADDING_BOTTOM = MESH_PADDING + ROW_SPACING * 2;

export type GridPoint = { x: number; y: number };

// Fixed screen positions of every hex node for a given viewport. At rest the
// mesh renders its nodes at exactly these coordinates (perspective scale = 1),
// so the backdrop lattice lines up perfectly with the resting mesh.
export function meshGrid(W: number, H: number) {
  const cols = Math.floor((W - MESH_PADDING * 2 - CELL_SIZE / 2) / CELL_SIZE) + 1;
  const rows = Math.floor((H - MESH_PADDING_TOP - MESH_PADDING_BOTTOM) / ROW_SPACING) + 1;
  const points: GridPoint[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: MESH_PADDING + col * CELL_SIZE + (row % 2) * (CELL_SIZE / 2),
        y: MESH_PADDING_TOP + row * ROW_SPACING,
      });
    }
  }
  return { cols, rows, points };
}
