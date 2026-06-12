// Spherical + map-projection math shared by the flat map, the globe, and
// strike trajectories. The flat map is equirectangular: u = (lon+180)/360,
// v = (90-lat)/180, both normalized 0..1 and scaled into a panel rect at
// draw time.

export type LatLon = { lat: number; lon: number }

export const toRad = (d: number) => (d * Math.PI) / 180
export const toDeg = (r: number) => (r * 180) / Math.PI
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
export const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t))

export function project(lon: number, lat: number): [number, number] {
  return [(lon + 180) / 360, (90 - lat) / 180]
}

export function unproject(u: number, v: number): LatLon {
  return { lon: u * 360 - 180, lat: 90 - v * 180 }
}

/** Unit sphere position; z is the polar (north) axis. */
export function latLonToVec3(lat: number, lon: number): [number, number, number] {
  const phi = toRad(lat)
  const lam = toRad(lon)
  return [Math.cos(phi) * Math.cos(lam), Math.cos(phi) * Math.sin(lam), Math.sin(phi)]
}

/** Wrapped angular delta in [-PI, PI] — for the globe's rotate-to-target ease. */
export function shortestAngleDiff(target: number, current: number): number {
  let d = (target - current) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

export type GreatCircle = { pts: Float32Array; breaks: number[] }

// How hard arcs bow toward the top, and the ceiling on that bow. Tuned for the
// WarGames look — long shots sail off the top edge and curve back in.
const BOW_GAIN = 1.5
const BOW_CAP = 0.9

/**
 * Stylized strike arc (WarGames homage) — deliberately NOT a true great
 * circle. A smooth quadratic that bows toward the top of the map, taller for
 * longer shots, and free to sail off the top edge and back. This trades
 * geographic accuracy (which the equirect projection renders as ugly pole
 * spikes / flat "square" tops near 90°N) for clean, believable arcs. `breaks`
 * still marks seam crossings so a shot that wraps the dateline strokes as
 * separate segments instead of a smear.
 */
export function strikeArc(from: LatLon, to: LatLon, n = 64): GreatCircle {
  const [u0, v0] = project(from.lon, from.lat)
  let [u1, v1] = project(to.lon, to.lat)
  // take the short way around the seam (keep the control span within half the map)
  if (u1 - u0 > 0.5) u1 -= 1
  else if (u1 - u0 < -0.5) u1 += 1

  const chord = Math.hypot(u1 - u0, v1 - v0)
  const bow = Math.min(BOW_CAP, chord * BOW_GAIN)
  const cu = (u0 + u1) / 2
  const cv = (v0 + v1) / 2 - bow // control point lifted toward the top (v can go < 0 = above frame)

  const pts = new Float32Array((n + 1) * 2)
  const breaks: number[] = []
  let prevU = 0
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const mt = 1 - t
    const u = mt * mt * u0 + 2 * mt * t * cu + t * t * u1
    const v = mt * mt * v0 + 2 * mt * t * cv + t * t * v1
    const uw = ((u % 1) + 1) % 1 // wrap into [0,1]; seam crossings become breaks
    if (i > 0 && Math.abs(uw - prevU) > 0.5) breaks.push(i)
    prevU = uw
    pts[i * 2] = uw
    pts[i * 2 + 1] = v
  }
  return { pts, breaks }
}

/** Grid designation like "K-07" derived from coordinates — fictional target labels. */
export function sectorCode(lat: number, lon: number): string {
  const row = Math.max(0, Math.min(11, Math.floor(((90 - lat) / 180) * 12)))
  const col = Math.max(1, Math.min(12, Math.floor(((lon + 180) / 360) * 12) + 1))
  return `${String.fromCharCode(65 + row)}-${String(col).padStart(2, '0')}`
}

/** "59.33N 18.07E" style coordinate readout. */
export function fmtLatLon(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}${ns} ${Math.abs(lon).toFixed(2)}${ew}`
}
