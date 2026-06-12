// Deterministic PRNG helpers. mulberry32 is the house micro-RNG: fast,
// seedable, good-enough distribution for visual jitter. hash2 folds two
// coordinates into a 32-bit seed (same pattern as seismic-mesh's readout).

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hash2(x: number, y: number): number {
  return ((Math.round(x) * 73856093) ^ (Math.round(y) * 19349663)) >>> 0
}
