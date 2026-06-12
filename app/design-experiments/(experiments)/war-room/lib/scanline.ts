// Scanline-raster portrait treatment: re-render a photo as horizontal
// glowing dashes — runs of bright pixels become lit line segments, dark
// areas become gaps (the retro raster-display look). Rasterization happens
// once per image into run-length data; drawing is cheap and can be revealed
// progressively top-to-bottom like a scan beam.

export type ScanRun = [startCol: number, endCol: number, luma: number]
export type ScanRaster = { cols: number; rows: number; runRows: ScanRun[][] }

const cache = new Map<string, ScanRaster | 'loading'>()

/**
 * Get (or start loading) the raster for an image URL. Returns null until
 * ready; call again next frame — draw loops poll naturally.
 */
export function getRaster(src: string, cols = 96, rows = 124): ScanRaster | null {
  const hit = cache.get(src)
  if (hit && hit !== 'loading') return hit
  if (hit === 'loading') return null

  cache.set(src, 'loading')
  const img = new Image()
  img.onload = () => cache.set(src, rasterize(img, cols, rows))
  img.onerror = () => cache.delete(src)
  img.src = src
  return null
}

function rasterize(img: HTMLImageElement, cols: number, rows: number): ScanRaster {
  const cv = document.createElement('canvas')
  cv.width = cols
  cv.height = rows
  const ctx = cv.getContext('2d')
  if (!ctx) return { cols, rows, runRows: [] }

  // Cover-crop, biased toward the top quarter where faces live in portraits.
  const scale = Math.max(cols / img.width, rows / img.height)
  const sw = cols / scale
  const sh = rows / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) * 0.25
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)
  const data = ctx.getImageData(0, 0, cols, rows).data

  // Normalize luma range so dim photos still produce contrast.
  const lumas = new Float32Array(cols * rows)
  let min = 1
  let max = 0
  for (let i = 0; i < cols * rows; i++) {
    const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
    lumas[i] = l
    if (l < min) min = l
    if (l > max) max = l
  }
  const range = Math.max(0.001, max - min)

  const THRESHOLD = 0.36
  const runRows: ScanRun[][] = []
  for (let r = 0; r < rows; r++) {
    const runs: ScanRun[] = []
    let start = -1
    let sum = 0
    for (let c = 0; c <= cols; c++) {
      const l = c < cols ? (lumas[r * cols + c] - min) / range : 0
      if (l >= THRESHOLD) {
        if (start === -1) {
          start = c
          sum = 0
        }
        sum += l
      } else if (start !== -1) {
        runs.push([start, c, sum / (c - start)])
        start = -1
      }
    }
    runRows.push(runs)
  }
  return { cols, rows, runRows }
}

export type ScanDrawOpts = {
  color?: string // "r, g, b"
  /** Global brightness multiplier — drive per-frame for flicker. */
  intensity?: number
  /** Horizontal tear: rows in [row0, row1) render offset by dx px. */
  tear?: { row0: number; row1: number; dx: number } | null
}

/**
 * Draw the raster into a rect. `progress` 0..1 reveals rows top-to-bottom;
 * the leading row renders as a bright scan beam (the only shadowBlur user).
 * High-contrast curve: dark runs nearly vanish, bright runs get a white-hot
 * core pass.
 */
export function drawScanRaster(
  ctx: CanvasRenderingContext2D,
  raster: ScanRaster,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  opts: ScanDrawOpts = {},
) {
  const color = opts.color ?? '90, 225, 235'
  const intensity = opts.intensity ?? 1
  const tear = opts.tear ?? null
  const rowH = h / raster.rows
  const colW = w / raster.cols
  const barH = Math.max(1, rowH * 0.66)
  const visRows = Math.floor(Math.max(0, Math.min(1, progress)) * raster.rows)

  for (let r = 0; r < visRows; r++) {
    const dx = tear && r >= tear.row0 && r < tear.row1 ? tear.dx : 0
    for (const [c0, c1, luma] of raster.runRows[r]) {
      // dramatic contrast: gamma curve crushes mids, lifts highlights
      const lum = Math.pow(luma, 1.6)
      const alpha = Math.min(1, (0.08 + lum * 1.05) * intensity)
      ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`
      const rx = x + c0 * colW + dx
      const rw = (c1 - c0) * colW - colW * 0.3
      ctx.fillRect(rx, y + r * rowH, rw, barH)
      // white-hot core on the brightest runs
      if (luma > 0.72) {
        ctx.fillStyle = `rgba(225, 252, 255, ${(lum * 0.55 * intensity).toFixed(3)})`
        ctx.fillRect(rx, y + r * rowH + barH * 0.22, rw, barH * 0.5)
      }
    }
  }

  // Scan beam on the row currently resolving.
  if (visRows < raster.rows && progress > 0) {
    ctx.save()
    ctx.shadowColor = `rgba(${color}, 0.9)`
    ctx.shadowBlur = 8
    ctx.fillStyle = `rgba(${color}, ${(0.95 * intensity).toFixed(3)})`
    ctx.fillRect(x, y + visRows * rowH, w, Math.max(1, barH * 0.7))
    ctx.restore()
  }
}
