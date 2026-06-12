// Launch/sensor installations (map markers + strike origins) and anonymous
// strike destinations. Bases borrow real early-warning-site flavor for the
// WarGames vibe; destinations are unnamed coordinates labeled only by grid
// sector at runtime — fiction, not geopolitics.

import type { LatLon } from '../lib/geo'

export type Site = LatLon & { name: string }

export const BASES: readonly Site[] = [
  { name: 'VANDENBERG', lat: 34.7, lon: -120.6 },
  { name: 'CHEYENNE MTN', lat: 38.7, lon: -104.8 },
  { name: 'THULE', lat: 76.5, lon: -68.7 },
  { name: 'FYLINGDALES', lat: 54.4, lon: -0.7 },
  { name: 'DIEGO GARCIA', lat: -7.3, lon: 72.4 },
  { name: 'GUAM', lat: 13.6, lon: 144.9 },
  { name: 'PINE GAP', lat: -23.8, lon: 133.7 },
  { name: 'KWAJALEIN', lat: 8.7, lon: 167.7 },
  { name: 'CLEAR AFS', lat: 64.3, lon: -149.1 },
]

// Spread across latitudes/longitudes so ambient arcs cross the whole map.
export const HOTSPOTS: readonly LatLon[] = [
  { lat: 55.8, lon: 37.6 },
  { lat: 39.9, lon: 116.4 },
  { lat: 35.7, lon: 51.4 },
  { lat: 69.0, lon: 33.1 },
  { lat: 43.1, lon: 131.9 },
  { lat: 52.5, lon: 13.4 },
  { lat: -33.9, lon: 18.4 },
  { lat: -34.6, lon: -58.4 },
  { lat: 1.3, lon: 103.8 },
  { lat: 61.2, lon: 73.4 },
  { lat: 28.6, lon: 77.2 },
  { lat: -12.0, lon: -77.0 },
]
