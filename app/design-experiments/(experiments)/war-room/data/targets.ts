// The target pool. The roster shows 5 surveillance slots that cycle through
// this pool with hard cuts (no scroll). Mugshots reuse the full ascii-reveal
// set as placeholders (600x800) — swap freely later. Coordinates drive the
// map ping and the globe's rotate-to-target when a target is engaged.

export type Target = {
  id: string
  codename: string
  image: string
  lat: number
  lon: number
  seed: number
}

export const TARGETS: readonly Target[] = [
  { id: 'T-01', codename: 'KESTREL', image: '/ascii-reveal/stark.jpg', lat: 59.33, lon: 18.07, seed: 11 },
  { id: 'T-02', codename: 'VOSKHOD', image: '/ascii-reveal/smoking.jpg', lat: 41.01, lon: 28.98, seed: 23 },
  { id: 'T-03', codename: 'NIGHTJAR', image: '/ascii-reveal/cuffs.jpg', lat: 35.68, lon: 139.69, seed: 37 },
  { id: 'T-04', codename: 'MERIDIAN', image: '/ascii-reveal/scarlet.jpg', lat: -33.87, lon: 151.21, seed: 41 },
  { id: 'T-05', codename: 'HALCYON', image: '/ascii-reveal/bunny.jpg', lat: 19.43, lon: -99.13, seed: 53 },
  { id: 'T-06', codename: 'BASILISK', image: '/ascii-reveal/face.jpg', lat: 52.52, lon: 13.4, seed: 59 },
  { id: 'T-07', codename: 'CORMORANT', image: '/ascii-reveal/prince.jpg', lat: 48.85, lon: 2.35, seed: 61 },
  { id: 'T-08', codename: 'VANTAGE', image: '/ascii-reveal/dance.jpg', lat: 40.71, lon: -74.01, seed: 67 },
  { id: 'T-09', codename: 'OKHOTNIK', image: '/ascii-reveal/skate.jpg', lat: 55.75, lon: 37.62, seed: 71 },
  { id: 'T-10', codename: 'PALISADE', image: '/ascii-reveal/hand.jpg', lat: 1.35, lon: 103.82, seed: 73 },
  { id: 'T-11', codename: 'SIROCCO', image: '/ascii-reveal/city.jpg', lat: 33.57, lon: -7.59, seed: 79 },
  { id: 'T-12', codename: 'LODESTAR', image: '/ascii-reveal/brutalist.jpg', lat: -23.55, lon: -46.63, seed: 83 },
]
