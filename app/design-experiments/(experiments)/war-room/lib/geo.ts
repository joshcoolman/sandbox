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

/**
 * Sample the great circle between two points as normalized equirect (u,v)
 * pairs. `breaks` marks sample indices where the path crosses the dateline so
 * the map can stroke it as separate segments instead of a smear.
 */
export function greatCircle(from: LatLon, to: LatLon, n = 64): GreatCircle {
  const a = latLonToVec3(from.lat, from.lon)
  const b = latLonToVec3(to.lat, to.lon)
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const omega = Math.acos(dot)
  const pts = new Float32Array((n + 1) * 2)
  const breaks: number[] = []
  let prevU = 0

  for (let i = 0; i <= n; i++) {
    const t = i / n
    let x: number, y: number, z: number
    if (omega < 1e-4) {
      x = a[0] + (b[0] - a[0]) * t
      y = a[1] + (b[1] - a[1]) * t
      z = a[2] + (b[2] - a[2]) * t
    } else {
      const s1 = Math.sin((1 - t) * omega) / Math.sin(omega)
      const s2 = Math.sin(t * omega) / Math.sin(omega)
      x = s1 * a[0] + s2 * b[0]
      y = s1 * a[1] + s2 * b[1]
      z = s1 * a[2] + s2 * b[2]
    }
    const lat = toDeg(Math.asin(Math.max(-1, Math.min(1, z))))
    const lon = toDeg(Math.atan2(y, x))
    const [u, v] = project(lon, lat)
    if (i > 0 && Math.abs(u - prevU) > 0.5) breaks.push(i)
    prevU = u
    pts[i * 2] = u
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
