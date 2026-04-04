export interface CameraState {
  rotate: number
  vertical: number
  zoom: number
}

export const DEFAULT_CAMERA: CameraState = { rotate: 41, vertical: 0, zoom: 5 }

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
